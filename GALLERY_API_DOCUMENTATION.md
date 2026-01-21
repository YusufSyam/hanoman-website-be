# Gallery API Documentation

Dokumentasi API untuk collection `gallery` yang berisi foto-foto dengan caption.

## Base Endpoint

```
/api/gallery
```

## Authentication

Endpoint ini bersifat **public read-only**, tidak memerlukan authentication untuk membaca data.

---

## Endpoints

### GET `/api/gallery`
Mengambil daftar gallery items dengan pagination dan filtering.

**Query Parameters:**
- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah item per halaman (default: 10)
- `sort` - Sorting field (contoh: `-createdAt` untuk newest first, `createdAt` untuk oldest first)
- `depth` - Depth untuk populate image relationship (default: 0, gunakan 1 untuk populate image object dengan URL)

**Response Structure:**
```json
{
  "docs": [
    {
      "id": 1,
      "image": 123, // ID media (jika depth=0) atau object Media (jika depth=1)
      "caption": "Event foto description",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "totalDocs": 50,
  "limit": 10,
  "totalPages": 5,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": true
}
```

**Gallery Object Fields:**
- `id` - Unique identifier (number)
- `image` - Media ID (number) atau Media object (jika depth=1)
- `caption` - Caption/deskripsi foto (string, required)
- `createdAt` - Creation timestamp (ISO date string)
- `updatedAt` - Last update timestamp (ISO date string)

### GET `/api/gallery/:id`
Mengambil single gallery item berdasarkan ID.

**Path Parameters:**
- `id` - Gallery item ID

**Query Parameters:**
- `depth` - Depth untuk populate image relationship (recommended: 1 untuk mendapatkan URL gambar)

**Response:** Single gallery object

---

## Cara Menggunakan di Frontend

### 1. Fetch List Gallery Items

```javascript
// Mengambil 12 gambar terbaru
const response = await fetch('http://localhost:3001/api/gallery?limit=12&sort=-createdAt&depth=1')
const data = await response.json()

// data.docs berisi array gallery items
data.docs.forEach(item => {
  console.log(item.caption)
  console.log(item.image.url) // URL gambar jika depth=1
})
```

### 2. Fetch Single Gallery Item

```javascript
const response = await fetch('http://localhost:3001/api/gallery/123?depth=1')
const item = await response.json()

console.log(item.caption)
console.log(item.image.url) // URL gambar
```

### 3. Pagination

```javascript
// Halaman 2, 20 item per halaman
const response = await fetch('http://localhost:3001/api/gallery?page=2&limit=20&depth=1')
const data = await response.json()

// Check apakah ada halaman selanjutnya
if (data.hasNextPage) {
  // Load more...
}
```

### 4. Display Gallery Grid

**React Component Example:**
```jsx
function GalleryGrid() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/gallery?limit=20&sort=-createdAt&depth=1')
      .then(res => res.json())
      .then(data => {
        setItems(data.docs)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="gallery-grid">
      {items.map(item => (
        <div key={item.id} className="gallery-item">
          <img 
            src={item.image.url} 
            alt={item.image.alt || item.caption}
            loading="lazy"
          />
          <p className="caption">{item.caption}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Important Notes

1. **Gunakan `depth=1`** untuk mendapatkan object `image` lengkap (dengan URL, width, height, dll) tanpa perlu fetch terpisah
2. **Default sorting**: Gunakan `sort=-createdAt` untuk menampilkan gambar terbaru terlebih dahulu
3. **Image URL**: Ketika `depth=1`, `item.image.url` berisi URL lengkap untuk menampilkan gambar
4. **Alt text**: Gunakan `item.image.alt` untuk accessibility atau fallback ke `item.caption`
5. **Pagination**: Gunakan `hasNextPage` dan `hasPrevPage` untuk implementasi infinite scroll atau pagination UI

---

## Media Object (ketika depth=1)

Struktur lengkap object `image` ketika menggunakan `depth=1`:

```json
{
  "id": 123,
  "alt": "Image description",
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "filesize": 123456,
  "width": 1920,
  "height": 1080,
  "url": "http://localhost:3001/media/photo.jpg",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

---

## Best Practices

1. **Lazy Loading**: Gunakan `loading="lazy"` pada tag `<img>` untuk performa yang lebih baik
2. **Responsive Images**: Gunakan `width` dan `height` dari media object untuk implementasi responsive images
3. **Error Handling**: Selalu handle error saat fetch dan pastikan `image` object tidak null
4. **Pagination**: Implement pagination atau infinite scroll untuk gallery yang besar
5. **Image Optimization**: Pertimbangkan menggunakan image CDN atau Next.js Image component untuk optimasi

