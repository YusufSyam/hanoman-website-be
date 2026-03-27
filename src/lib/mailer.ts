import nodemailer from 'nodemailer'

type SendEmailInput = {
  to: string
  subject: string
  text: string
  replyTo?: string
}

let transporter: nodemailer.Transporter | null = null

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter
  }

  const host = getRequiredEnv('SMTP_HOST')
  const port = Number(process.env.SMTP_PORT ?? '587')
  const secure = process.env.SMTP_SECURE === 'true'
  const user = getRequiredEnv('SMTP_USER')
  const pass = getRequiredEnv('SMTP_PASS')

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || getRequiredEnv('SMTP_USER')

  await getTransporter().sendMail({
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
  })
}
