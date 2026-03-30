/**
 * Satu kali: terapkan schema Payload ke Postgres (tabel users, media, …).
 * Jalankan dengan NODE_ENV=development (lihat script `db:push` di package.json).
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

async function main() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('Database schema push finished.')
  await payload.destroy()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
