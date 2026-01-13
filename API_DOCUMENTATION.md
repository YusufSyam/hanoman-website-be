# API Documentation - Read-Only Endpoints

Dokumentasi API untuk frontend yang hanya dapat membaca data dari collections `posts`, `clients`, dan `careers`.

## Base URL

Semua endpoint menggunakan base URL Payload CMS:
```
/api/{collection-slug}
```

## Authentication

Endpoints ini bersifat **public read-only**, tidak memerlukan authentication untuk membaca data.

---

## 1. Posts API

**Base Endpoint:** `/api/posts`

Collection untuk News dan Blog posts. Menggunakan field `type` untuk membedakan antara "news" dan "blog".

### Endpoints

#### GET `/api/posts`
Mengambil daftar posts dengan pagination dan filtering.

**Query Parameters:**
- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah item per halaman (default: 10)
- `sort` - Sorting field (contoh: `-publishedDate` untuk descending, `publishedDate` untuk ascending)
- `where[type][equals]` - Filter berdasarkan type: `"news"` atau `"blog"`
- `where[category][equals]` - Filter berdasarkan category (text)
- `where[slug][equals]` - Filter berdasarkan slug (untuk single post lookup)
- `where[author][equals]` - Filter berdasarkan author ID
- `where[publishedDate][greater_than]` - Filter posts setelah tanggal tertentu
- `where[publishedDate][less_than]` - Filter posts sebelum tanggal tertentu
- `depth` - Depth untuk populate relationships (default: 0, gunakan 1-2 untuk populate author dan image)

**Response Structure:**
- `docs` - Array of post objects
- `totalDocs` - Total jumlah dokumen
- `limit` - Limit per halaman
- `totalPages` - Total jumlah halaman
- `page` - Halaman saat ini
- `hasPrevPage` - Boolean, apakah ada halaman sebelumnya
- `hasNextPage` - Boolean, apakah ada halaman selanjutnya

**Post Object Fields:**
- `id` - Unique identifier
- `type` - `"news"` atau `"blog"`
- `category` - Category name (string)
- `title` - Post title (string)
- `slug` - URL-friendly slug (string, unique)
- `image` - Media object atau ID (relationship ke `media`)
- `excerpt` - Short description/teaser (string)
- `publishedDate` - Published date (ISO date string)
- `content` - Rich text content (Lexical JSON structure)
- `author` - Author object atau ID (relationship ke `authors`)
- `createdAt` - Creation timestamp (ISO date string)
- `updatedAt` - Last update timestamp (ISO date string)

#### GET `/api/posts/:id`
Mengambil single post berdasarkan ID.

**Path Parameters:**
- `id` - Post ID

**Query Parameters:**
- `depth` - Depth untuk populate relationships (recommended: 2 untuk populate author dan image secara lengkap)

**Response:** Single post object

---

## 2. Clients API

**Base Endpoint:** `/api/clients`

Collection untuk client/partner logos dan informasi.

### Endpoints

#### GET `/api/clients`
Mengambil daftar clients dengan pagination dan filtering.

**Query Parameters:**
- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah item per halaman (default: 10)
- `sort` - Sorting field (contoh: `name` untuk ascending, `-name` untuk descending)
- `where[category][equals]` - Filter berdasarkan category:
  - `"Banking & Finance"`
  - `"Enterprise & Industrial"`
  - `"Government"`
- `where[name][contains]` - Search berdasarkan nama client (case-insensitive)
- `depth` - Depth untuk populate logo relationship (default: 0, gunakan 1 untuk populate logo object)

**Response Structure:**
- `docs` - Array of client objects
- `totalDocs` - Total jumlah dokumen
- `limit` - Limit per halaman
- `totalPages` - Total jumlah halaman
- `page` - Halaman saat ini
- `hasPrevPage` - Boolean
- `hasNextPage` - Boolean

**Client Object Fields:**
- `id` - Unique identifier
- `name` - Client name (string)
- `href` - Website URL (string)
- `logo` - Media object atau ID (relationship ke `media`)
- `category` - Category (string, salah satu dari tiga opsi di atas)
- `imageHeight` - Optional image height in pixels (number)
- `createdAt` - Creation timestamp (ISO date string)
- `updatedAt` - Last update timestamp (ISO date string)

#### GET `/api/clients/:id`
Mengambil single client berdasarkan ID.

**Path Parameters:**
- `id` - Client ID

**Query Parameters:**
- `depth` - Depth untuk populate logo relationship (recommended: 1)

**Response:** Single client object

---

## 3. Careers API

**Base Endpoint:** `/api/careers`

Collection untuk job openings dan career opportunities.

### Endpoints

#### GET `/api/careers`
Mengambil daftar career positions dengan pagination dan filtering.

**Query Parameters:**
- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah item per halaman (default: 10)
- `sort` - Sorting field (contoh: `-createdAt` untuk newest first)
- `where[jobCategory][equals]` - Filter berdasarkan job category:
  - `"Technology & Engineering"`
  - `"Marketing, Sales & Communication"`
  - `"Finance & Accounting"`
  - `"Human Resources & General Affairs"`
  - `"Creative & Design"`
  - `"Operations & Customer Success"`
- `where[isUrgentlyHiring][equals]` - Filter hanya urgent positions (boolean: `true` atau `false`)
- `where[slug][equals]` - Filter berdasarkan slug (untuk single career lookup)
- `where[title][contains]` - Search berdasarkan job title (case-insensitive)
- `depth` - Depth untuk populate image relationship (default: 0, gunakan 1 untuk populate image object)

**Response Structure:**
- `docs` - Array of career objects
- `totalDocs` - Total jumlah dokumen
- `limit` - Limit per halaman
- `totalPages` - Total jumlah halaman
- `page` - Halaman saat ini
- `hasPrevPage` - Boolean
- `hasNextPage` - Boolean

**Career Object Fields:**
- `id` - Unique identifier
- `title` - Job title (string)
- `slug` - URL-friendly slug (string, unique)
- `image` - Media object atau ID (relationship ke `media`, optional)
- `requirements` - Array of requirement objects, setiap object memiliki:
  - `item` - Requirement text (string)
- `mainJobDescription` - Array of job description objects, setiap object memiliki:
  - `item` - Job description text (string)
- `isUrgentlyHiring` - Boolean flag untuk urgent positions
- `jobCategory` - Job category (string, salah satu dari enam opsi di atas)
- `createdAt` - Creation timestamp (ISO date string)
- `updatedAt` - Last update timestamp (ISO date string)

#### GET `/api/careers/:id`
Mengambil single career position berdasarkan ID.

**Path Parameters:**
- `id` - Career ID

**Query Parameters:**
- `depth` - Depth untuk populate image relationship (recommended: 1)

**Response:** Single career object

---

## Media Relationships

Semua collections yang memiliki field upload (image/logo) akan mengembalikan relationship ke collection `media`. 

Untuk mendapatkan informasi lengkap media (URL, dimensions, dll), gunakan parameter `depth=1` atau `depth=2` pada request, atau fetch langsung ke `/api/media/:id`.

### Media Object Structure (ketika di-populate dengan depth)
- `id` - Media ID
- `alt` - Alt text untuk accessibility
- `filename` - Nama file
- `mimeType` - MIME type (contoh: `image/jpeg`)
- `filesize` - Ukuran file dalam bytes
- `width` - Lebar gambar dalam pixels
- `height` - Tinggi gambar dalam pixels
- `url` - Public URL untuk mengakses file
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

---

## Query Operators Reference

Payload CMS mendukung berbagai query operators untuk filtering:

### Comparison Operators
- `equals` - Exact match
- `not_equals` - Not equal
- `in` - Value dalam array (contoh: `where[type][in]=news,blog`)
- `not_in` - Value tidak dalam array
- `contains` - Contains substring (case-insensitive untuk text)
- `like` - Like search (semua kata harus ada)
- `exists` - Field exists (boolean: `true` atau `false`)

### Date/Number Operators
- `greater_than` - Greater than
- `greater_than_equal` - Greater than or equal
- `less_than` - Less than
- `less_than_equal` - Less than or equal

### Logical Operators
- `and` - Multiple conditions (AND)
- `or` - Multiple conditions (OR)

**Contoh penggunaan logical operators:**
```
where[or][0][type][equals]=news&where[or][1][type][equals]=blog
```

---

## Best Practices

1. **Pagination**: Selalu gunakan `limit` untuk membatasi jumlah data yang diambil, terutama untuk list endpoints.

2. **Depth untuk Relationships**: 
   - Gunakan `depth=0` jika hanya perlu ID relationships
   - Gunakan `depth=1` untuk populate first-level relationships (author, image, logo)
   - Gunakan `depth=2` untuk populate nested relationships (author dengan image-nya)

3. **Sorting**: Gunakan `sort` parameter untuk mengurutkan hasil, contoh:
   - `-publishedDate` untuk newest first
   - `publishedDate` untuk oldest first
   - `title` untuk alphabetical ascending
   - `-title` untuk alphabetical descending

4. **Filtering**: Kombinasikan multiple filters untuk mendapatkan hasil yang lebih spesifik.

5. **Error Handling**: Payload akan mengembalikan status code:
   - `200` - Success
   - `404` - Not found (untuk single item endpoints)
   - `400` - Bad request (invalid query parameters)
   - `500` - Server error

---

## Rate Limiting

Saat ini tidak ada rate limiting yang dikonfigurasi. Namun disarankan untuk:
- Menggunakan pagination yang wajar (limit maksimal 100 per request)
- Mengimplementasikan caching di frontend untuk mengurangi request berulang
- Menggunakan `depth` parameter dengan bijak (semakin besar depth, semakin berat response)

