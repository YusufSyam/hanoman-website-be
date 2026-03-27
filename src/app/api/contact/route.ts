import { sendEmail } from '@/lib/mailer'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ContactPayload = {
  name: string
  email: string
  phone?: string
  message: string
}

function getAllowedOrigin(): string | null {
  const origin = process.env.FRONTEND_ORIGIN?.trim()
  return origin || null
}

function getCorsHeaders(request: Request): HeadersInit {
  const allowedOrigin = getAllowedOrigin()
  const requestOrigin = request.headers.get('origin')

  if (allowedOrigin && requestOrigin === allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    }
  }

  return {}
}

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function parseAndValidate(body: unknown): ContactPayload | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const data = body as Record<string, unknown>
  const name = normalizeString(data.name)
  const email = normalizeString(data.email).toLowerCase()
  const phone = normalizeString(data.phone)
  const message = normalizeString(data.message)

  if (!name || !email || !message) {
    return null
  }

  if (!EMAIL_REGEX.test(email)) {
    return null
  }

  return {
    name,
    email,
    phone,
    message,
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}

export async function POST(request: Request) {
  const headers = getCorsHeaders(request)

  try {
    const parsedBody = parseAndValidate(await request.json())

    if (!parsedBody) {
      return Response.json(
        {
          ok: false,
          error: 'Validation error',
        },
        {
          status: 400,
          headers,
        }
      )
    }

    const contactToEmail = process.env.CONTACT_TO_EMAIL?.trim()

    if (!contactToEmail) {
      throw new Error('Missing required environment variable: CONTACT_TO_EMAIL')
    }

    const emailBody = [
      'New contact message received.',
      '',
      `Name: ${parsedBody.name}`,
      `Email: ${parsedBody.email}`,
      `Phone: ${parsedBody.phone || '-'}`,
      '',
      'Message:',
      parsedBody.message,
    ].join('\n')

    await sendEmail({
      to: contactToEmail,
      subject: `[Website] New Contact Message from ${parsedBody.name}`,
      text: emailBody,
      replyTo: parsedBody.email,
    })

    return Response.json(
      {
        ok: true,
        message: 'Message sent',
      },
      {
        status: 200,
        headers,
      }
    )
  } catch (error) {
    console.error('Failed to send contact message:', error)

    return Response.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers,
      }
    )
  }
}
