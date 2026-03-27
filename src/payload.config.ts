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
  cors: '*',
  // Rate limiting is implemented in src/middleware.ts
  // Configuration: 500 requests per 15 minutes, trustProxy: true
})
