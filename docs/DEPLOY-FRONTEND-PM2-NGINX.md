# Deploy frontend (PM2 + Nginx) dengan backend & database di Docker

Panduan ini menjelaskan pola deployment di **VPS**: **PostgreSQL + Payload (Next.js backend)** tetap di **Docker**, sementara **frontend** (aplikasi Next.js terpisah) di-build, dijalankan dengan **PM2**, dan dihadapkan ke internet lewat **Nginx** (HTTPS).

> **Catatan:** Repositori frontend diasumsikan **terpisah** dari repositori backend (`hanoman-website-be`). Sesuaikan path dan nama folder dengan proyek Anda.

---

## 1. Gambaran arsitektur

```
Internet
   │
   ▼
┌──────────────────┐
│  Nginx :80 / :443│  (SSL, reverse proxy)
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────────────────┐
│ PM2    │  │ Docker Compose               │
│ Next   │  │  • postgres:5432           │
│ FE     │  │  • payload → host :3000      │
│ :3001  │  │  • volume ./media → /app/media│
└────────┘  └─────────────────────────────┘
```

- **Frontend (PM2):** misalnya `http://127.0.0.1:3001` (hanya localhost; Nginx yang memproksi ke domain publik).
- **Backend (Docker):** `payload` memetakan **`3000:3000`** — di host, API Payload tersedia di `http://127.0.0.1:3000` (REST di `/api/...`).

---

## 2. Prasyarat di VPS

- OS umumnya **Ubuntu 22.04/24.04 LTS** (instruksi berikut memakai `apt`).
- **Docker** + **Docker Compose** plugin sudah terpasang dan service backend + DB sudah jalan dengan `docker compose` (lihat README repositori backend).
- **Domain** sudah mengarah (A record) ke IP VPS — misalnya:
  - `www.example.com` → frontend
  - `api.example.com` → backend Payload (disarankan subdomain terpisah agar jelas dan tidak bentrok route `/api` di Next frontend).

---

## 3. Bagian A — Pastikan backend Docker berjalan

Di mesin VPS, di direktori repositori **backend**:

```bash
cd /path/to/hanoman-website-be
docker compose --env-file .env -f docker-compose.yml up -d
```

Pastikan:

- `.env` berisi `DATABASE_URL`, `PAYLOAD_SECRET`, kredensial Postgres, dll.
- **`DATABASE_URL` di dalam Docker** harus memakai hostname **`postgres`** (nama service di Compose), bukan `127.0.0.1`, agar container `payload` bisa konek ke DB.
- Folder **`media/`** di host ter-mount ke container (lihat `docker-compose.yml`) agar upload media tidak hilang.

**Deploy pertama / database baru:** dengan `NODE_ENV=production`, Payload **tidak** menjalankan push schema otomatis. Setelah Postgres sehat, jalankan sekali (dari folder backend di VPS):

```bash
docker compose --profile db-push run --rm db-push
```

Atau dari mesin yang bisa reach DB dengan env yang sama: `pnpm run db:push`. Baru setelah tabel ada, buka admin dan buat user pertama.

Uji cepat dari VPS:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/
```

Jika backend sehat, Anda akan mendapat respons HTTP (bukan koneksi ditolak).

---

## 4. Bagian B — Node.js, pnpm/yarn, dan PM2

### 4.1 Versi Node

Samakan **major** Node dengan yang dipakai proyek (cek `engines` di `package.json` frontend). Contoh memakai Node 22 via **nvm** (disarankan):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
```

### 4.2 PM2 (global)

```bash
npm install -g pm2
# opsional: startup otomatis setelah reboot
pm2 startup
# jalankan perintah yang di-print oleh pm2 startup (sudo env ...)
```

---

## 5. Bagian C — Build dan jalankan frontend

### 5.1 Kloning dan dependensi

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone <URL-REPO-FRONTEND> hanoman-frontend
cd hanoman-frontend
```

Pasang paket (contoh **pnpm**; sesuaikan jika pakai yarn/npm):

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
```

### 5.2 Environment production (frontend)

Buat file **`.env.production`** (atau `.env` sesuai konvensi Next) di root frontend. Minimal:

```env
# URL publik backend Payload (tanpa slash di akhir)
# Gunakan https://api.example.com jika Nginx sudah memproksi ke :3000
NEXT_PUBLIC_PAYLOAD_API_URL=https://api.example.com
```

Sesuaikan dengan cara frontend Anda menyusun URL:

- Jika kode memakai `NEXT_PUBLIC_PAYLOAD_API_URL + '/api/posts'` → isi **tanpa** `/api` di akhir.
- Jika kode memakai `NEXT_PUBLIC_PAYLOAD_API_URL + '/posts'` → isi **dengan** `https://api.example.com/api`.

**Build-time:** `NEXT_PUBLIC_*` di-embed saat `next build`; setelah mengubahnya, **harus build ulang**.

### 5.3 Build

```bash
pnpm run build
```

### 5.4 PM2 — file `ecosystem.config.cjs`

Di root frontend (mis. `/var/www/hanoman-frontend`), buat `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'hanoman-fe',
      cwd: '/var/www/hanoman-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001 -H 127.0.0.1',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
```

> Port **3001** dipakai agar tidak bentrok dengan backend di **3000**. Sesuaikan jika Anda memakai port lain.

Jalankan:

```bash
cd /var/www/hanoman-frontend
pm2 start ecosystem.config.cjs
pm2 save
```

Uji lokal:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
```

---

## 6. Bagian D — Nginx (reverse proxy + HTTPS)

### 6.1 Instalasi

```bash
sudo apt update
sudo apt install -y nginx
```

### 6.2 Dua server block (disarankan)

**a) Backend — `api.example.com` → `127.0.0.1:3000`**

Buat `/etc/nginx/sites-available/hanoman-api`:

```nginx
server {
    listen 80;
    server_name api.example.com;

    # Admin upload media — naikkan jika perlu (default Nginx 1m sering terlalu kecil)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

**b) Frontend — `www.example.com` → `127.0.0.1:3001`**

Buat `/etc/nginx/sites-available/hanoman-www`:

```nginx
server {
    listen 80;
    server_name www.example.com example.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

Aktifkan situs:

```bash
sudo ln -sf /etc/nginx/sites-available/hanoman-api /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/hanoman-www /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 SSL (Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com -d www.example.com -d example.com
```

Certbot akan mengubah blok `listen 443 ssl` dan jadwal renew otomatis.

Setelah HTTPS aktif, pastikan **`NEXT_PUBLIC_PAYLOAD_API_URL`** memakai **`https://api.example.com`** lalu **build ulang** frontend dan restart PM2:

```bash
cd /var/www/hanoman-frontend
pnpm run build
pm2 restart hanoman-fe
```

---

## 7. Firewall (opsional tapi disarankan)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Port **3000** dan **3001** tidak perlu dibuka ke publik jika hanya diakses lewat Nginx di localhost.

---

## 8. Backend: URL publik, CORS, CSRF, dan form kontak

Konfigurasi aktual ada di `src/payload.config.ts` (bukan `cors: '*'`).

### 8.1 `PAYLOAD_SERVER_URL` (`.env` backend)

Set ke URL publik API, **tanpa** slash di akhir, mis.:

```env
PAYLOAD_SERVER_URL=https://api.example.com
```

Ini dipakai Payload untuk admin, redirect, dan perilaku URL absolut. Setelah mengubahnya, **build ulang image** dan `docker compose up -d --build`.

### 8.2 `trustedBrowserOrigins` (kode backend)

Array **`trustedBrowserOrigins`** dipakai untuk **`cors`** dan **`csrf`**. Origin browser yang mengakses REST/GraphQL atau mengirim cookie admin **harus** terdaftar, mis.:

- `https://www.example.com` (situs frontend)
- `https://example.com` (jika dipakai)
- `https://api.example.com` (jika admin dibuka dari subdomain yang sama)

Tambahkan origin demo/production di array itu, commit, lalu deploy image baru. Jika origin tidak ada di daftar, fetch dari frontend atau login admin bisa gagal dengan error CORS/CSRF.

### 8.3 `FRONTEND_ORIGIN` (`.env` backend)

Endpoint **`POST /api/contact`** memakai **`FRONTEND_ORIGIN`** untuk header CORS. Isi persis origin frontend, mis. `https://www.example.com` (skema + host, tanpa path).

### 8.4 Cookie admin (opsional)

Jika admin di `api.example.com` dan frontend di `www.example.com`, cookie default **scoped per host**. Untuk skenario subdomain kompleks, pertimbangkan `COOKIE_DOMAIN` di `.env` (lihat `src/collections/Users.ts`) — hanya set jika Anda paham dampaknya terhadap keamanan cookie.

---

## 9. Alur update (deploy ulang frontend)

```bash
cd /var/www/hanoman-frontend
git pull
pnpm install --frozen-lockfile
# edit .env.production jika perlu
pnpm run build
pm2 restart hanoman-fe
```

Backend + DB:

```bash
cd /path/to/hanoman-website-be
git pull
docker compose --env-file .env -f docker-compose.yml up -d --build
```

---

## 10. Troubleshooting singkat

| Gejala | Hal yang dicek |
|--------|----------------|
| 502 Bad Gateway ke FE | `pm2 status`, `curl http://127.0.0.1:3001/` |
| 502 ke API | `docker compose ps`, `curl http://127.0.0.1:3000/api/` |
| Frontend tidak bisa fetch API | `NEXT_PUBLIC_*` salah atau belum rebuild; URL harus **https** setelah Certbot |
| CORS / CSRF / fetch API dari browser gagal | Tambahkan origin frontend (dan API jika perlu) ke `trustedBrowserOrigins` di backend; set `PAYLOAD_SERVER_URL`; deploy ulang image backend |
| Admin redirect aneh atau mixed content | `PAYLOAD_SERVER_URL` harus `https://...` sama dengan domain Nginx |
| `relation "users" does not exist` | DB baru tanpa schema: jalankan `docker compose --profile db-push run --rm db-push` (lihat §3) |
| Media backend 404 | Volume `./media` di Docker dan isi folder `media/` di host |
| Upload admin gagal (413) | Naikkan `client_max_body_size` di Nginx untuk `api.*` |

---

## 11. Ringkasan port di host

| Layanan | Port (localhost) | Publik |
|--------|-------------------|--------|
| Payload (Docker) | `3000` | Via Nginx `api.example.com` |
| Frontend (PM2) | `3001` | Via Nginx `www.example.com` |
| PostgreSQL (Docker) | `5432` (hanya jika perlu; jangan expose ke internet tanpa kebutuhan) | — |

## 12. Checklist singkat sebelum dianggap selesai

- [ ] Backend: `.env` lengkap (`PAYLOAD_SECRET`, `DATABASE_URL` dengan host `postgres`, `PAYLOAD_SERVER_URL`, `FRONTEND_ORIGIN` untuk contact).
- [ ] Backend: origin production ada di `trustedBrowserOrigins` + image sudah di-build ulang.
- [ ] Deploy pertama: `db-push` sudah dijalankan jika DB kosong.
- [ ] Frontend: `.env.production` + `pnpm build` setelah setiap ubah `NEXT_PUBLIC_*`.
- [ ] Nginx: SSL aktif, `client_max_body_size` cukup untuk upload admin.
- [ ] Firewall: hanya SSH + HTTP(S); port 3000/3001 tidak perlu publik.
- [ ] `chmod 600 .env` (backend & frontend) di server.

Dokumen ini fokus ke **frontend + PM2 + Nginx** dan integrasi dengan backend Docker; backup DB, rotasi secret, dan hardening lanjutan mengikuti kebijakan Anda.
