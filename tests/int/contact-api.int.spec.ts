import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/contact/route'
import { sendEmail } from '@/lib/mailer'

vi.mock('@/lib/mailer', () => ({
  sendEmail: vi.fn(),
}))

describe('Contact API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CONTACT_TO_EMAIL = 'internal-team@example.com'
  })

  it('returns success for valid payload', async () => {
    vi.mocked(sendEmail).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        phone: '  +62 812-1111-2222  ',
        message: '  Hello team, I need more information.  ',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      message: 'Message sent',
    })

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'internal-team@example.com',
      subject: '[Website] New Contact Message from John Doe',
      text: expect.stringContaining('Name: John Doe'),
      replyTo: 'john@example.com',
    })
  })

  it('returns validation error for invalid payload', async () => {
    const request = new Request('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Jane',
        email: 'invalid-email',
        message: '',
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      ok: false,
      error: 'Validation error',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
