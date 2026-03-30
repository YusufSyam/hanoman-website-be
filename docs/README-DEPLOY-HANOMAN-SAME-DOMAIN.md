# Deploy Hanoman — skenario A (IP / VPS sama, domain tetap)

Panduan ini untuk **mengganti situs yang sudah ada** di **`hanoman.co.id`** dengan stack baru (frontend Next terpisah + backend Payload + Postgres di Docker), **tanpa pindah server** dan **tanpa mengganti IP** yang sudah dipakai domain tersebut.

Asumsi:

- Record DNS **`hanoman.co.id`** dan **`www.hanoman.co.id`** sudah mengarah ke **VPS yang sama** tempat Anda mengerjakan deploy.
- Repositori **frontend** terpisah dari **backend** (`hanoman-website-be`).
- Target URL publik setelah selesai:

| Peran | URL |
|-------|-----|
| Situs pengunjung (Next.js frontend) | `https://hanoman.co.id` dan/atau `https://www.hanoman.co.id` |
| API Payload, admin, REST `/api/...` | `https://api.hanoman.co.id` |

Frontend memanggil backend lewat variabel `NEXT_PUBLIC_*` yang mengarah ke **`https://api.hanoman.co.id`**, bukan ke path `/api` di domain utama — menghindari bentrok dengan route Next di root domain.

---

## 1. Gambaran arsitektur di VPS

```
Internet
   │
   ▼
┌────────────────────────┐
│  Nginx :80 / :443      │  SSL (Let’s Encrypt), reverse proxy
└───────────┬────────────┘
            │
       ┌────┴─────┐
       ▼          ▼
┌─────────────┐  ┌──────────────────────────────────┐
│ PM2         │  │ Docker Compose                    │
│ Next.js FE  │  │  • postgres                       │
│ 127.0.0.1   │  │  • payload → 127.0.0.1:3000       │
│ :3001       │  │  • volume ./media → /app/media    │
└─────────────┘  └──────────────────────────────────┘
```

- **Nginx** menerima `hanoman.co.id` / `www` → memproksi ke **`http://127.0.0.1:3001`** (frontend).
- **Nginx** menerima `api.hanoman.co.id` → memproksi ke **`http://127.0.0.1:3000`** (Payload).
- Port **3000** dan **3001** cukup listen di localhost; yang terbuka ke internet adalah **80** dan **443** (Nginx).

---

## 2. Prasyarat di VPS

- OS: **Ubuntu 22.04 atau 24.04 LTS** (perintah di bawah memakai **`apt`**).
- **Docker** + **Docker Compose** (subperintah `docker compose`).
- **Git**, **curl**, **ca-certificates**.
- Akses pengguna ke **`sudo`**.
- **Domain:** **A record** berikut mengarah ke **IP VPS yang sama**:
  - `hanoman.co.id`
  - `www.hanoman.co.id`
  - **`api.hanoman.co.id`** (tambahkan jika belum ada).

### 2.1 Cek cepat (sudah terpasang atau belum)

Jalankan di VPS:

```bash
lsb_release -a 2>/dev/null || cat /etc/os-release
command -v sudo && sudo -n true 2>/dev/null && echo "sudo: OK" || echo "sudo: perlu password atau belum ada"
docker --version 2>/dev/null || echo "Docker: belum terpasang"
docker compose version 2>/dev/null || echo "docker compose: belum terpasang"
git --version 2>/dev/null || echo "Git: belum terpasang"
curl --version 2>/dev/null | head -1 || echo "curl: belum terpasang"
```

### 2.2 Instalasi paket dasar (curl, git, sudo)

Hanya jika belum ada (misalnya image VPS minimal tanpa `curl`/`git`):

```bash
apt update
apt install -y sudo curl ca-certificates git
```

Jika Anda **bukan** root, pakai:

```bash
sudo apt update
sudo apt install -y curl ca-certificates git
```

### 2.3 Instalasi Docker Engine + Docker Compose (plugin)

**Opsi A — dari repositori Ubuntu (cukup untuk panduan ini)**

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Keluar dari SSH dan masuk lagi (atau jalankan `newgrp docker`) agar grup **`docker`** aktif tanpa `sudo` untuk perintah `docker`.

Cek:

```bash
docker --version
docker compose version
```

Jika paket **`docker-compose-v2`** tidak ditemukan (distro lama), gunakan **Opsi B**.

**Opsi B — skrip resmi Docker (Engine + Compose plugin, versi lebih baru)**

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo usermod -aG docker "$USER"
rm /tmp/get-docker.sh
```

Lalu **logout/login** atau `newgrp docker`, lalu:

```bash
docker --version
docker compose version
```

### 2.4 Uji Docker tanpa sudo

```bash
docker run --rm hello-world
```

Jika error permission denied, pastikan user sudah di grup `docker` dan sesi login sudah diperbarui.

### 2.5 Alat lain yang dipakai di panduan ini

| Kebutuhan | Kapan muncul di panduan | Instal jika belum ada |
|-----------|-------------------------|------------------------|
| **Nginx** | Bagian reverse proxy | `sudo apt install -y nginx` |
| **Certbot** | SSL Let’s Encrypt | `sudo apt install -y certbot python3-certbot-nginx` |
| **UFW** | Firewall | `sudo apt install -y ufw` |
| **build-essential** (opsional) | Beberapa `npm install` native | `sudo apt install -y build-essential` |

### 2.6 Node.js (nvm, PM2)

Node dan PM2 dijelaskan di **§4**; tidak wajib di §2 kecuali Anda ingin menginstal lebih dulu. Ringkas:

```bash
# nvm — ikuti §4.1
# PM2 global — setelah Node ada:
npm install -g pm2
```

---

## 3. Persiapan kode backend (`hanoman-website-be`)

### 3.1 Origin yang dipercaya (CORS / CSRF)

File `src/payload.config.ts` memakai array **`trustedBrowserOrigins`** untuk **`cors`** dan **`csrf`**. Setiap origin browser yang mengakses API atau admin **harus** ada di daftar ini.

Pastikan array tersebut memuat minimal:

- `https://hanoman.co.id`
- `https://www.hanoman.co.id`
- `https://api.hanoman.co.id` (admin Payload dibuka dari subdomain ini)

Simpan, commit, dan gunakan commit ini saat build image di VPS.

### 3.2 Clone backend di VPS

```bash
sudo mkdir -p /opt
sudo chown $USER:$USER /opt
cd /opt
git clone <URL-GIT-BACKEND> hanoman-website-be
cd hanoman-website-be
```

### 3.3 File `.env` backend (di server)

Buat atau salin `.env` di root `hanoman-website-be`. Isi wajar (sesuaikan password dan secret):

```env
# Postgres — dipakai service postgres di Docker Compose
POSTGRES_DB=hanoman
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ganti_password_kuat
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Koneksi dari container payload ke container postgres (hostname = nama service Compose)
DATABASE_URL=postgresql://postgres:ganti_password_kuat@postgres:5432/hanoman

PAYLOAD_SECRET=ganti_secret_panjang_acak
NODE_ENV=production

# URL publik API (tanpa slash di akhir)
PAYLOAD_SERVER_URL=https://api.hanoman.co.id

# Origin frontend untuk CORS endpoint kontak (skema + host, tanpa path)
FRONTEND_ORIGIN=https://hanoman.co.id
```

Catatan:

- **`DATABASE_URL`** untuk container **wajib** memakai hostname **`postgres`**, bukan `127.0.0.1`.
- **`FRONTEND_ORIGIN`** harus sama dengan origin yang dipakai pengunjung (jika kanonis Anda `https://www.hanoman.co.id`, isi itu).
- Variabel untuk email kontak / SMTP (jika dipakai) tetap sesuai kebutuhan proyek Anda.

Amankan file:

```bash
chmod 600 .env
```

### 3.4 Jalankan Postgres dan Payload

```bash
cd /opt/hanoman-website-be
docker compose --env-file .env -f docker-compose.yml up -d --build
```

Tunggu container `postgres` sehat, lalu cek:

```bash
docker compose ps
```

### 3.5 Buat tabel database (sekali, jika DB baru)

Dengan **`NODE_ENV=production`**, Payload **tidak** mendorong schema otomatis. Setelah Postgres jalan, dari folder backend (dengan `pnpm` dan dependency terpasang):

```bash
cd /opt/hanoman-website-be
corepack enable && corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
pnpm run db:push
```

Perintah `db:push` menjalankan script yang memuat Payload dengan **`NODE_ENV=development`** hanya untuk proses tersebut, sehingga schema Drizzle diterapkan ke database.

### 3.6 Uji backend di localhost VPS

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/
```

Respons HTTP (bukan connection refused) berarti proses `payload` mendengarkan.

### 3.7 Buat user admin

Buka di browser (setelah langkah Nginx + SSL di bawah selesai, atau sementara dengan tunnel):  
`https://api.hanoman.co.id/admin`  
dan buat akun admin pertama.  
(Jika SSL belum ada, Anda bisa uji sementara dari VPS dengan `curl` ke localhost — untuk login admin biasanya browser + HTTPS.)

---

## 4. Node.js, pnpm, dan PM2 (untuk frontend)

### 4.1 Node (disarankan pakai nvm)

Samakan **major** Node dengan `engines` di `package.json` frontend (misalnya 22):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
```

### 4.2 PM2 global

```bash
npm install -g pm2
pm2 startup
```

Jalankan perintah `sudo` yang dikeluarkan `pm2 startup` agar PM2 hidup lagi setelah reboot.

---

## 5. Frontend — build dan PM2

### 5.1 Clone dan install

```bash
cd /opt
git clone <URL-GIT-FRONTEND> hanoman-frontend
cd hanoman-frontend
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
```

### 5.2 Environment production frontend

Buat **`.env.production`** di root frontend. Contoh (sesuaikan nama variabel dengan yang dipakai kode frontend Anda):

```env
NEXT_PUBLIC_PAYLOAD_API_URL=https://api.hanoman.co.id
```

Aturan praktis:

- Tanpa **slash** di akhir URL basis (`https://api.hanoman.co.id`).
- Sesuaikan dengan cara kode menyusun path: jika kode menambahkan `'/api/posts'`, basis URL **tanpa** `/api`; jika kode menambahkan `'/posts'` ke basis yang sudah berisi `/api`, sesuaikan.

Setiap mengubah variabel **`NEXT_PUBLIC_*`**, wajib **`pnpm run build`** ulang.

### 5.3 Build

```bash
pnpm run build
```

### 5.4 PM2 — `ecosystem.config.cjs`

Di `/opt/hanoman-frontend`, buat file `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'hanoman-fe',
      cwd: '/opt/hanoman-frontend',
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

Jalankan:

```bash
cd /opt/hanoman-frontend
pm2 start ecosystem.config.cjs
pm2 save
```

Uji:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
```

---

## 6. DNS untuk `api.hanoman.co.id`

Di panel DNS (Cloudflare, registrar, dll.):

- Tambah **A** record: **`api.hanoman.co.id`** → **IP VPS yang sama** dengan `hanoman.co.id`.
- TTL bisa 300 detik saat pengujian.

Tunggu propagasi (cek dengan `dig api.hanoman.co.id +short`).

---

## 7. Nginx — reverse proxy

### 7.1 Pasang Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 7.2 Cadangkan konfigurasi situs lama (jika ada)

```bash
sudo cp -a /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%F) 2>/dev/null || true
```

Jika Anda punya file lain untuk domain lama, cadangkan juga sebelum mengganti isinya.

### 7.3 Server block — API (`api.hanoman.co.id`)

Buat `/etc/nginx/sites-available/hanoman-api`:

```nginx
server {
    listen 80;
    server_name api.hanoman.co.id;

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

### 7.4 Server block — frontend (`hanoman.co.id` dan `www`)

Buat `/etc/nginx/sites-available/hanoman-www`:

```nginx
server {
    listen 80;
    server_name hanoman.co.id www.hanoman.co.id;

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

### 7.5 Aktifkan situs dan uji konfigurasi

```bash
sudo ln -sf /etc/nginx/sites-available/hanoman-api /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/hanoman-www /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL (Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d api.hanoman.co.id \
  -d hanoman.co.id \
  -d www.hanoman.co.id
```

Ikuti prompt. Certbot akan menambahkan `listen 443 ssl` dan pengaturan sertifikat.

Setelah HTTPS aktif:

1. Pastikan **`.env.production`** frontend memakai **`https://api.hanoman.co.id`** (bukan `http`).
2. Build ulang frontend dan restart PM2:

```bash
cd /opt/hanoman-frontend
pnpm run build
pm2 restart hanoman-fe
```

3. Pastikan **`PAYLOAD_SERVER_URL`** di backend **`https://api.hanoman.co.id`**, lalu rebuild dan jalankan ulang container backend jika Anda mengubah `.env`:

```bash
cd /opt/hanoman-website-be
docker compose --env-file .env -f docker-compose.yml up -d --build
```

---

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Tidak perlu membuka port **3000** dan **3001** ke publik jika semua lalu lintas lewat Nginx.

---

## 10. Cutover dari situs lama (skenario A)

1. **Selesaikan** langkah backend (Docker), `db:push`, frontend (PM2), Nginx, dan SSL **sebelum** memutuskan mengganti traffic produksi, jika memungkinkan uji dengan hosts file lokal atau subdomain uji.
2. **Cadangkan** file Nginx lama yang melayani `hanoman.co.id`.
3. **Hentikan** proses lama yang memakai port **3001** (atau port lain yang bentrok) — misalnya PM2 app lama: `pm2 delete nama-app-lama`.
4. **Reload Nginx** hanya jika `nginx -t` sukses.

Downtime sering hanya **beberapa detik** saat `reload`. Jika perlu halaman maintenance, bisa sementara `return 503` di Nginx (opsional).

---

## 11. Memperbarui deploy nanti

**Frontend:**

```bash
cd /opt/hanoman-frontend
git pull
pnpm install --frozen-lockfile
# edit .env.production jika perlu
pnpm run build
pm2 restart hanoman-fe
```

**Backend:**

```bash
cd /opt/hanoman-website-be
git pull
docker compose --env-file .env -f docker-compose.yml up -d --build
```

Setelah mengubah **`trustedBrowserOrigins`** atau **`PAYLOAD_SERVER_URL`**, selalu **build ulang image** backend.

---

## 12. Troubleshooting

| Gejala | Yang dicek |
|--------|------------|
| 502 ke frontend | `pm2 status`, `curl http://127.0.0.1:3001/` |
| 502 ke API | `docker compose ps`, `curl http://127.0.0.1:3000/api/` |
| CORS / CSRF / fetch gagal | Origin `https://hanoman.co.id`, `https://www.hanoman.co.id`, `https://api.hanoman.co.id` ada di `trustedBrowserOrigins`; `PAYLOAD_SERVER_URL=https://api.hanoman.co.id` |
| Mixed content / redirect aneh di admin | Semua URL publik memakai **`https://`**, bukan `http` |
| `relation "users" does not exist` | Jalankan **`pnpm run db:push`** sekali saat DB masih kosong |
| Media 404 | Folder **`media/`** di host ter-mount ke container (`./media:/app/media`) dan file benar-benar ada di disk |
| Upload admin gagal (413) | Naikkan `client_max_body_size` di blok `api.hanoman.co.id` |

---

## 13. Ringkasan port di host

| Layanan | Alamat lokal | Publik |
|---------|----------------|--------|
| Payload (Docker) | `127.0.0.1:3000` | `https://api.hanoman.co.id` |
| Frontend (PM2) | `127.0.0.1:3001` | `https://hanoman.co.id` / `https://www.hanoman.co.id` |
| PostgreSQL | `127.0.0.1:5432` (opsional dari host) | Jangan expose ke internet tanpa kebutuhan |

---

## 14. Checklist sebelum dianggap selesai

- [ ] A record `api.hanoman.co.id` mengarah ke IP VPS yang sama.
- [ ] `.env` backend: `DATABASE_URL` memakai host `postgres`, `PAYLOAD_SERVER_URL`, `FRONTEND_ORIGIN`, `PAYLOAD_SECRET`.
- [ ] `trustedBrowserOrigins` memuat ketiga origin HTTPS di atas.
- [ ] `pnpm run db:push` sudah dijalankan untuk DB baru.
- [ ] `.env.production` frontend memakai `https://api.hanoman.co.id` dan build sudah dijalankan setelah perubahan `NEXT_PUBLIC_*`.
- [ ] Nginx + Certbot untuk ketiga hostname.
- [ ] `ufw` aktif; SSH dan Nginx Full diizinkan.
- [ ] `chmod 600` untuk `.env` backend dan file rahasia frontend.

---

## 15. Rollback kasar

- Simpan salinan konfigurasi Nginx sebelum cutover.
- Untuk mengembalikan perilaku lama: restore file Nginx, `sudo nginx -t && sudo systemctl reload nginx`, dan jalankan kembali proses/PM2 versi lama jika masih ada di server.

Backup database Postgres (`pg_dump`) disarankan sebelum migrasi besar atau perubahan schema produksi.
