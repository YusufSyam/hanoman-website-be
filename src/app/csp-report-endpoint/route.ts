import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Keep this lightweight: reports are best-effort telemetry.
    await request.json()
  } catch {
    // Ignore malformed reports; we still return no-content.
  }

  return new Response(null, { status: 204 })
}
