import { postgresAdapter } from '@payloadcms/db-postgres'
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
import { Gallery } from './collections/Gallery'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Upload collection `media` uses Payload default local storage (`./media` relative to the app cwd). */

/**
 * Trusted browser `Origin` values for:
 * - `cors`: REST/GraphQL dari frontend
 * - `csrf`: pengambilan JWT dari cookie (admin / sesi) — Origin harus ada di daftar ini
 */
const trustedBrowserOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://hanoman.co.id',
  'https://www.hanoman.co.id',
  'https://api.hanoman.co.id',
  'https://hanoman-website-mirror.vercel.app',
  'https://hanoman-website-be.vercel.app',
]

/** URL publik backend (mis. https://api.hanoman.co.id). Kosongkan di lokal jika akses lewat localhost:3000. */
const serverURL = process.env.PAYLOAD_SERVER_URL?.trim() ?? ''

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Authors, Posts, Clients, Careers, Gallery],
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
  ...(serverURL ? { serverURL } : {}),
  cors: trustedBrowserOrigins,
  csrf: trustedBrowserOrigins,
  // Rate limiting is implemented in src/middleware.ts
  // Configuration: 500 requests per 15 minutes, trustProxy: true
})
