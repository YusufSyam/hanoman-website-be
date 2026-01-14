import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Authors } from './collections/Authors'
import { Posts } from './collections/Posts'
import { Clients } from './collections/Clients'
import { Careers } from './collections/Careers'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Authors, Posts, Clients, Careers],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  cors: [
    'http://localhost:3000',
    'https://hanoman-website-mirror.vercel.app/',
  ],
  csrf: [
    'http://localhost:3000',
    'https://hanoman-website-mirror.vercel.app/',
  ],
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true, // Aktifkan untuk collection 'media'
      },
      token: process.env.BLOB_READ_WRITE_TOKEN, // Nanti didapat dari dashboard Vercel
    }),
  ],
})
