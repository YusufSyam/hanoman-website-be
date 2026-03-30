import 'dotenv/config'
import { readFileSync, statSync } from 'fs'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** One upload per filename; reused by clients, careers, posts, gallery, and author. */
const mediaByFile = new Map<string, number>()

// Data Careers
const careers = [
    {
        name: 'Code Warrior',
        imageFile: 'news1.png',
        requirements: [
            'Resourceful, communicative, fast learner, innovative, and good team player',
            'Hands on experience with Java EE',
            'Comprehend any Java MVC Frameworks',
            'Comprehend any Java Persistence Frameworks',
            'Comprehend any modern RDBMS',
        ],
        mainJobDescription: [
            'Participate in solution design',
            'Responsible in developing, unit testing, and troubleshooting solution',
        ],
        isUrgentlyHiring: true,
        jobCategory: 'Technology & Engineering',
    },
    {
        name: 'Web Developer',
        imageFile: 'news2.jpeg',
        requirements: [
            'Creative, communicative, fast learner, innovative, and good team player',
            'Master in modern web technologies',
            'User experience oriented',
            'Exposure on mobile development is preferred',
        ],
        jobCategory: 'Marketing, Sales & Communication',
        mainJobDescription: [
            'Responsible in user experience design',
            'Responsible in developing, unit testing, and troubleshooting solution',
        ],
    },
    {
        name: 'Quality Assurance',
        imageFile: 'news3.jpeg',
        requirements: [
            'Thorough, communicative, fast learner, innovative, and good team player',
            'Hands on experience with testing lifecycle, scenario, and tools',
            'Comprehend programming logic',
            'Comprehend any modern RDBMS',
        ],
        jobCategory: 'Finance & Accounting',
        mainJobDescription: [
            'Responsible in testing lifecycle',
            'Responsible in solution documentation',
            'Participate in solution training',
        ],
    },
    {
        name: 'Tech. Leader',
        imageFile: 'news4.png',
        requirements: [
            'Knowledgeable, proactive, innovative, and good team player',
            'Minimum 4 years of experience in solution design and development',
            'Master in any Java MVC and Persistence Frameworks, as well as RDBMS',
            'Exposure on Service Oriented Architecture/Big Data/Mobile is an advantage',
        ],
        jobCategory: 'Creative & Design',
        mainJobDescription: [
            'Responsible in technical team management',
            'Responsible in requirement analysis and solution design',
            'Responsible in developing, unit testing, deployment, and troubleshooting solution',
        ],
    },
]

// Data Clients
const clients = [
    {
        name: 'Bank Tabungan Negara',
        href: 'http://www.btn.co.id',
        imageFile: 'btn.png',
        imageHeight: 42,
        category: 'Banking',
    },
    {
        name: 'Bank Internasional Indonesia',
        href: 'http://www.bii.co.id',
        imageFile: 'bii.png',
        imageHeight: 50,
        category: 'Banking',
    },
    {
        name: 'Bank Sinarmas',
        href: 'http://www.banksinarmas.com',
        imageFile: 'bsim.png',
        imageHeight: 42,
        category: 'Banking',
    },
    {
        name: 'Telkomsel',
        href: 'http://telkomsel.com/',
        imageFile: 'tsel.png',
        imageHeight: 56,
        category: 'Insurance',
    },
    {
        name: 'Honda Prospect Motor',
        href: 'http://www.hpm.co.id',
        imageFile: 'hpm.jpg',
        imageHeight: 56,
        category: 'Insurance',
    },
    {
        name: 'Bank Tabungan Negara - Syariah',
        href: 'http://www.btn.co.id/Syariah/Home.aspx',
        imageFile: 'btns1.png',
        imageHeight: 44,
        category: 'Banking',
    },
    {
        name: 'Bank Negara Indonesia',
        href: 'http://www.bni.co.id',
        imageFile: 'bni.png',
        imageHeight: 24,
        category: 'Banking',
    },
    {
        name: 'Direktorat Jenderal Bea dan Cukai',
        href: 'http://www.beacukai.go.id',
        imageFile: 'djbc.png',
        imageHeight: 48,
        category: 'Government',
    },
    {
        name: 'Sinarmas Forestry',
        href: 'http://www.sinarmasforestry.com/Default.asp',
        imageFile: 'smf2.png',
        imageHeight: 48,
        category: 'Insurance',
    },
]

const postsSeed = [
    {
        type: 'news' as const,
        category: 'Teknologi',
        title: 'Perbankan Indonesia Genjot Adopsi Cloud dan Keamanan Siber',
        imageFile: 'news1.png',
        excerpt:
            'Lembaga keuangan mempercepat modernisasi core banking sambil memperketat tata kelola risiko siber dan kepatuhan data.',
        publishedDate: '2025-02-10T02:00:00.000Z',
        markdown: `## Ringkasan

**Jakarta** — Transformasi digital di sektor perbankan nasional masuk babak baru: institusi tidak hanya memigrasikan beban kerja ke *cloud*, tetapi juga merancang ulang arsitektur keamanan agar konsisten dengan regulasi dan ekspektasi nasabah.

## Poin Utama

- Peningkatan investasi pada observabilitas dan deteksi ancaman berbasis perilaku
- Standarisasi pipeline rilis untuk mengurangi *drift* konfigurasi antar lingkungan
- Kolaborasi lintas divisi antara IT, risiko, dan kepatuhan

## Analisis

Menurut praktisi industri, tantangan terbesar bukan pada alat, melainkan pada disiplin proses: dokumentasi perubahan, uji regresi otomatis, dan mekanisme *rollback* yang dapat diaudit.

> "Keamanan bukan fitur tambahan; ia harus menjadi bagian dari definisi selesainya sebuah fitur," demikian ringkasan dari diskusi panel internal.

## Tautan terkait

Baca juga [panduan baseline keamanan aplikasi](https://owasp.org) untuk referensi praktik umum.

---

*Narasi ini disusun untuk keperluan demonstrasi konten editorial pada lingkungan pengembangan.*`,
    },
    {
        type: 'blog' as const,
        category: 'Opini',
        title: 'Membangun Budaya DevSecOps di Tim Produksi',
        imageFile: 'news2.jpeg',
        excerpt:
            'Integrasi keamanan sejak awal siklus pengembangan membutuhkan kejelasan peran, metrik, dan ruang aman untuk eksperimen.',
        publishedDate: '2025-02-18T04:30:00.000Z',
        markdown: `## Mengapa budaya lebih menentukan daripada alat

Tim yang sehat memisahkan **akuntabilitas** dari **salah-sasaran**: temuan kerentanan menjadi input perencanaan, bukan ajang mencari kambing hitam.

### Tiga praktik yang sering terabaikan

1. *Threat modeling* ringkas di awal fitur — cukup satu halaman, asal konsisten
2. *Security champions* per squad — jembatan antara dev dan tim keamanan
3. Metrik yang masuk akal: MTTD/MTTR insiden, bukan hanya jumlah temuan

## Studi kasus fiktif

Sebuah tim backend mengurangi insiden konfigurasi dengan menerapkan *policy-as-code* pada pipeline CI/CD. Hasilnya, perubahan infrastruktur dapat ditinjau seperti kode aplikasi.

---

Paragraf penutup: DevSecOps berhasil ketika insinyur merasa **dibantu**, bukan diawasi.`,
    },
    {
        type: 'news' as const,
        category: 'Perusahaan',
        title: 'Hanoman Perluas Kolaborasi dengan Mitra Strategis Sektor Publik',
        imageFile: 'news3.jpeg',
        excerpt:
            'Inisiatif baru menekankan interoperabilitas sistem dan peningkatan layanan berbasis data bagi masyarakat dan pelaku usaha.',
        publishedDate: '2025-03-01T01:15:00.000Z',
        markdown: `## Siaran Pers (contoh)

**Jakarta** — Kemitraan strategis ini fokus pada tiga garis besar: integrasi layanan, peningkatan kualitas data, dan penguatan kapasitas sumber daya manusia di lapangan.

### Rencana aksi

- Fase persiapan: penyelarasan *data dictionary* dan hak akses
- Fase implementasi: pilot terbatas dengan *feedback loop* mingguan
- Fase stabilisasi: dokumentasi operasional dan transfer pengetahuan

## Kutipan

> Kolaborasi berkelanjutan membutuhkan transparansi target dan metrik keberhasilan yang disepakati bersama.

### Daftar pihak (ilustrasi)

- Tim program dan manajemen risiko
- Unit teknis lapangan
- Mitra ekosistem dan penyedia infrastruktur

---

Informasi lebih lanjut akan diumumkan melalui kanal resmi perusahaan.`,
    },
    {
        type: 'blog' as const,
        category: 'Analisis',
        title: 'Tren AI di Ruang Kerja: Antara Efisiensi dan Tata Kelola Data',
        imageFile: 'news4.png',
        excerpt:
            'Penerapan asisten AI menuntut kebijakan penggunaan yang jelas, audit log, dan kesadaran privasi di seluruh lini organisasi.',
        publishedDate: '2025-03-12T03:45:00.000Z',
        markdown: `## Lanskap saat ini

Organisasi bereksperimen dengan **asisten penulisan**, **ringkasan dokumen**, dan **klasifikasi tiket** dukungan. Manfaatnya nyata, namun risiko kebocoran data sensitif ikut meningkat.

## Checklist tata kelola (ringkas)

- [ ] Klasifikasi data: apa yang boleh masuk ke model publik vs internal
- [ ] Log penggunaan: siapa, kapan, konteks permintaan
- [ ] Pelatihan staf: penggunaan yang etis dan kebijakan sanksi ringan

## Opini

> AI paling aman ketika diposisikan sebagai *co-pilot* dengan batasan teknis dan organisasi yang eksplisit.

### Baca juga

Referensi umum: [Prinsip AI yang manusiawi](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics) (contoh tautan eksternal).

---

*Artikel ini bersifat ilustratif untuk pengujian tampilan rich text.*`,
    },
]

/** Gallery memakai media yang sama dengan unggahan clients/careers (sudah di-cache). */
const gallerySeed = [
    { imageFile: 'news1.png', caption: 'Sesi kolaborasi tim teknologi dan bisnis' },
    { imageFile: 'news2.jpeg', caption: 'Workshop pengalaman pengguna dan desain produk' },
    { imageFile: 'news3.jpeg', caption: 'Kunjungan lapangan bersama mitra strategis' },
    { imageFile: 'news4.png', caption: 'Pembahasan arsitektur dan tata kelola rilis' },
    { imageFile: 'btn.png', caption: 'Logo mitra: layanan perbankan nasional' },
    { imageFile: 'bii.png', caption: 'Kolaborasi di sektor jasa keuangan' },
    { imageFile: 'tsel.png', caption: 'Solusi untuk pelanggan korporat dan industri' },
    { imageFile: 'hpm.jpg', caption: 'Kemitraan di sektor manufaktur dan distribusi' },
]

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * Upload image file to Media collection (no cache — use ensureMedia instead).
 */
async function uploadImage(
    payload: Awaited<ReturnType<typeof getPayload>>,
    filename: string,
): Promise<number> {
    const seedAssetsPath = path.resolve(dirname, '../seed-assets', filename)

    try {
        if (!statSync(seedAssetsPath).isFile()) {
            throw new Error(`File not found: ${seedAssetsPath}`)
        }

        const fileBuffer = readFileSync(seedAssetsPath)
        const fileExtension = path.extname(filename).slice(1).toLowerCase()

        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
        }
        const mimeType = mimeTypes[fileExtension] || 'image/jpeg'

        const altText = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

        const media = await payload.create({
            collection: 'media',
            data: {
                alt: altText,
            },
            file: {
                data: fileBuffer,
                mimetype: mimeType,
                name: filename,
                size: fileBuffer.length,
            },
        })

        return typeof media.id === 'number' ? media.id : Number(media.id)
    } catch (error) {
        console.error(`Error uploading ${filename}:`, error)
        throw error
    }
}

async function ensureMedia(
    payload: Awaited<ReturnType<typeof getPayload>>,
    filename: string,
): Promise<number> {
    const existing = mediaByFile.get(filename)
    if (existing !== undefined) {
        return existing
    }
    const id = await uploadImage(payload, filename)
    mediaByFile.set(filename, id)
    return id
}

async function lexicalFromMarkdown(
    sanitizedConfig: Awaited<typeof config>,
    markdown: string,
): Promise<ReturnType<typeof convertMarkdownToLexical>> {
    const editorConfig = await editorConfigFactory.default({
        config: sanitizedConfig,
    })
    return convertMarkdownToLexical({
        editorConfig,
        markdown,
    })
}

/**
 * Main seeding function
 */
async function seed() {
    console.log('🌱 Starting seed process...\n')

    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        console.log('🗑️  Clearing existing data...')
        const deleteCollection = async (slug: 'posts' | 'gallery' | 'careers' | 'clients' | 'authors') => {
            try {
                const res = await payload.find({
                    collection: slug,
                    limit: 1000,
                })
                for (const doc of res.docs) {
                    await payload.delete({
                        collection: slug,
                        id: doc.id,
                    })
                }
                console.log(`   ✓ Deleted ${res.docs.length} existing ${slug}`)
            } catch {
                console.log(`   ⚠ No existing ${slug} to delete`)
            }
        }

        await deleteCollection('posts')
        await deleteCollection('gallery')
        await deleteCollection('careers')
        await deleteCollection('clients')
        await deleteCollection('authors')

        try {
            const existingMedia = await payload.find({
                collection: 'media',
                limit: 1000,
            })
            for (const media of existingMedia.docs) {
                await payload.delete({
                    collection: 'media',
                    id: media.id,
                })
            }
            console.log(`   ✓ Deleted ${existingMedia.docs.length} existing media files`)
        } catch {
            console.log('   ⚠ No existing media to delete')
        }

        mediaByFile.clear()

        console.log('\n📤 Seeding Clients...\n')

        for (const clientData of clients) {
            try {
                if (!clientData.imageFile) {
                    console.log(`   ⚠ Skipping ${clientData.name} - no imageFile specified`)
                    continue
                }

                console.log(`   📤 Uploading image for ${clientData.name}...`)
                const mediaId = await ensureMedia(payload, clientData.imageFile)

                console.log(`   ✅ Creating client: ${clientData.name}`)
                await payload.create({
                    collection: 'clients',
                    data: {
                        name: clientData.name,
                        href: clientData.href,
                        logo: mediaId,
                        category: clientData.category as
                            | 'Banking'
                            | 'Insurance'
                            | 'Government',
                        imageHeight: clientData.imageHeight,
                    },
                })

                console.log(`   ✓ Success: ${clientData.name}\n`)
            } catch (error) {
                console.error(`   ✗ Error seeding client ${clientData.name}:`, error)
            }
        }

        console.log('📤 Seeding Careers...\n')

        for (const careerData of careers) {
            try {
                let mediaId: number | undefined

                if (careerData.imageFile) {
                    console.log(`   📤 Ensuring media for ${careerData.name}...`)
                    mediaId = await ensureMedia(payload, careerData.imageFile)
                }

                const slug = generateSlug(careerData.name)

                console.log(`   ✅ Creating career: ${careerData.name}`)
                await payload.create({
                    collection: 'careers',
                    data: {
                        title: careerData.name,
                        slug: slug,
                        image: mediaId ?? null,
                        requirements: careerData.requirements.map((req) => ({ item: req })),
                        mainJobDescription: careerData.mainJobDescription.map((desc) => ({
                            item: desc,
                        })),
                        isUrgentlyHiring: careerData.isUrgentlyHiring ?? false,
                        jobCategory: careerData.jobCategory as
                            | 'Technology & Engineering'
                            | 'Marketing, Sales & Communication'
                            | 'Finance & Accounting'
                            | 'Human Resources & General Affairs'
                            | 'Creative & Design'
                            | 'Operations & Customer Success',
                    },
                })

                console.log(`   ✓ Success: ${careerData.name}\n`)
            } catch (error) {
                console.error(`   ✗ Error seeding career ${careerData.name}:`, error)
            }
        }

        console.log('📤 Seeding Author...\n')

        const authorImageId = await ensureMedia(payload, 'yusuf.jpeg')
        const authorDoc = await payload.create({
            collection: 'authors',
            data: {
                name: 'muh yusuf syam',
                image: authorImageId,
                description:
                    'Pengembang perangkat lunak dan kontributor teknis; tertarik pada arsitektur web, DX, dan kolaborasi lintas tim.',
                socialMediaLink: 'https://www.linkedin.com/in/muh-yusuf-syam/',
            },
        })
        const authorId = typeof authorDoc.id === 'number' ? authorDoc.id : Number(authorDoc.id)
        console.log(`   ✓ Author created: muh yusuf syam (id: ${authorId})\n`)

        console.log('📤 Seeding Posts...\n')

        for (const post of postsSeed) {
            try {
                const featuredId = await ensureMedia(payload, post.imageFile)
                const slug = generateSlug(post.title)
                const content = await lexicalFromMarkdown(payloadConfig, post.markdown)

                await payload.create({
                    collection: 'posts',
                    data: {
                        type: post.type,
                        category: post.category,
                        title: post.title,
                        slug,
                        image: featuredId,
                        excerpt: post.excerpt,
                        publishedDate: post.publishedDate,
                        content,
                        author: authorId,
                    },
                })
                console.log(`   ✓ Post: ${post.title}`)
            } catch (error) {
                console.error(`   ✗ Error seeding post "${post.title}":`, error)
            }
        }

        console.log('\n📤 Seeding Gallery...\n')

        for (const item of gallerySeed) {
            try {
                const imageId = await ensureMedia(payload, item.imageFile)
                await payload.create({
                    collection: 'gallery',
                    data: {
                        image: imageId,
                        caption: item.caption,
                    },
                })
                console.log(`   ✓ Gallery: ${item.caption.slice(0, 48)}…`)
            } catch (error) {
                console.error(`   ✗ Error seeding gallery "${item.caption}":`, error)
            }
        }

        console.log('\n✨ Seed process completed successfully!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Seed process failed:', error)
        process.exit(1)
    }
}

seed().catch((error) => {
    console.error('❌ Seed process failed:', error)
    process.exit(1)
})
