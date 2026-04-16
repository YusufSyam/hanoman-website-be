import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting configuration
// These values match the configuration requested in payload.config.ts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes in milliseconds
const RATE_LIMIT_MAX = 500 // Maximum requests per window
const TRUST_PROXY = true // Trust proxy headers (required for Vercel/behind proxy)

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

function getClientIP(request: NextRequest): string {
  if (TRUST_PROXY) {
    // Trust proxy headers (for Vercel/behind proxy)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    if (realIP) {
      return realIP
    }
  }

  // Fallback to direct connection IP (not available in NextRequest, use headers)
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

function buildCspHeader(nonce: string): string {
  const apiOrigin = process.env.PAYLOAD_SERVER_URL?.trim() || 'https://api.hanoman.co.id'

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${apiOrigin} https:`,
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "frame-src 'self' https://maps.google.com https://www.google.com",
    'report-uri /csp-report-endpoint',
  ].join('; ')
}

function withSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))
  return response
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!isApiRoute) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return withSecurityHeaders(response, nonce)
  }

  const clientIP = getClientIP(request)
  const now = Date.now()

  // Get or create rate limit entry for this IP
  let rateLimit = rateLimitStore.get(clientIP)

  if (!rateLimit || rateLimit.resetTime < now) {
    // Create new rate limit entry
    rateLimit = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    }
    rateLimitStore.set(clientIP, rateLimit)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return withSecurityHeaders(response, nonce)
  }

  // Increment request count
  rateLimit.count++

  // Check if limit exceeded
  if (rateLimit.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000)

    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW / 1000 / 60} minutes.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX - rateLimit.count).toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      }
    )
    return withSecurityHeaders(response, nonce)
  }

  // Update rate limit entry
  rateLimitStore.set(clientIP, rateLimit)

  // Add rate limit headers to response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - rateLimit.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

  return withSecurityHeaders(response, nonce)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
