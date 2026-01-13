import 'dotenv/config'
import { readFileSync, statSync } from 'fs'
import { getPayload } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Data Careers
const careers = [
    {
        name: 'Code Warrior',
        imageFile: 'news1.png', // Asumsi file ini ada di folder seed-assets
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
        category: 'Banking & Finance',
    },
    {
        name: 'Bank Internasional Indonesia',
        href: 'http://www.bii.co.id',
        imageFile: 'bii.png',
        imageHeight: 50,
        category: 'Banking & Finance',
    },
    {
        name: 'Bank Sinarmas',
        href: 'http://www.banksinarmas.com',
        imageFile: 'bsim.png',
        imageHeight: 42,
        category: 'Banking & Finance',
    },
    {
        name: 'Telkomsel',
        href: 'http://telkomsel.com/',
        imageFile: 'tsel.png',
        imageHeight: 56,
        category: 'Enterprise & Industrial',
    },
    {
        name: 'Honda Prospect Motor',
        href: 'http://www.hpm.co.id',
        imageFile: 'hpm.jpg',
        imageHeight: 56,
        category: 'Enterprise & Industrial',
    },
    {
        name: 'Bank Tabungan Negara - Syariah',
        href: 'http://www.btn.co.id/Syariah/Home.aspx',
        imageFile: 'btns1.png',
        imageHeight: 44,
        category: 'Banking & Finance',
    },
    {
        name: 'Bank Negara Indonesia',
        href: 'http://www.bni.co.id',
        imageFile: 'bni.png',
        imageHeight: 24,
        category: 'Banking & Finance',
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
        category: 'Enterprise & Industrial',
    },
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
 * Upload image file to Media collection
 */
async function uploadImage(
    payload: Awaited<ReturnType<typeof getPayload>>,
    filename: string,
): Promise<number> {
    const seedAssetsPath = path.resolve(dirname, '../seed-assets', filename)

    try {
        // Check if file exists
        if (!statSync(seedAssetsPath).isFile()) {
            throw new Error(`File not found: ${seedAssetsPath}`)
        }

        const fileBuffer = readFileSync(seedAssetsPath)
        const fileExtension = path.extname(filename).slice(1).toLowerCase()

        // Determine MIME type
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

        // Convert ID to number (Payload uses number IDs for PostgreSQL)
        return typeof media.id === 'number' ? media.id : Number(media.id)
    } catch (error) {
        console.error(`Error uploading ${filename}:`, error)
        throw error
    }
}

/**
 * Main seeding function
 */
async function seed() {
    console.log('🌱 Starting seed process...\n')

    // Initialize Payload
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    try {
        // Reset collections (optional - uncomment if you want to clear existing data)
        console.log('🗑️  Clearing existing data...')
        try {
            const existingCareers = await payload.find({
                collection: 'careers',
                limit: 1000,
            })
            for (const career of existingCareers.docs) {
                await payload.delete({
                    collection: 'careers',
                    id: career.id,
                })
            }
            console.log(`   ✓ Deleted ${existingCareers.docs.length} existing careers`)
        } catch (error) {
            console.log('   ⚠ No existing careers to delete')
        }

        try {
            const existingClients = await payload.find({
                collection: 'clients',
                limit: 1000,
            })
            for (const client of existingClients.docs) {
                await payload.delete({
                    collection: 'clients',
                    id: client.id,
                })
            }
            console.log(`   ✓ Deleted ${existingClients.docs.length} existing clients`)
        } catch (error) {
            console.log('   ⚠ No existing clients to delete')
        }

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
        } catch (error) {
            console.log('   ⚠ No existing media to delete')
        }

        console.log('\n📤 Seeding Clients...\n')

        // Seed Clients
        for (const clientData of clients) {
            try {
                if (!clientData.imageFile) {
                    console.log(`   ⚠ Skipping ${clientData.name} - no imageFile specified`)
                    continue
                }

                console.log(`   📤 Uploading image for ${clientData.name}...`)
                const mediaId = await uploadImage(payload, clientData.imageFile)

                console.log(`   ✅ Creating client: ${clientData.name}`)
                await payload.create({
                    collection: 'clients',
                    data: {
                        name: clientData.name,
                        href: clientData.href,
                        logo: mediaId,
                        category: clientData.category as
                            | 'Banking & Finance'
                            | 'Enterprise & Industrial'
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

        // Seed Careers
        for (const careerData of careers) {
            try {
                let mediaId: number | undefined

                if (careerData.imageFile) {
                    console.log(`   📤 Uploading image for ${careerData.name}...`)
                    mediaId = await uploadImage(payload, careerData.imageFile)
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

        console.log('✨ Seed process completed successfully!')
    } catch (error) {
        console.error('❌ Seed process failed:', error)
        process.exit(1)
    }

    process.exit(0)
}

// Run seed
seed()

