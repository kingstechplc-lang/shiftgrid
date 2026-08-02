// Email service for ShiftGrid
// In demo mode (no POSTMARK_API_KEY): displays the email content in the API response
// and stores it in an in-memory log so the UI can show "your code is XXXXXX".
// In production: sends via Postmark or SendGrid.

import { db } from '@/lib/db'

export type EmailMessage = {
  to: string
  subject: string
  body: string
  html?: string
}

// In-memory store for demo mode — lets the UI retrieve the latest "sent" email
// so users can see their verification code without a real email account.
const demoOutbox: Map<string, EmailMessage[]> = new Map()

export function isDemoMode(): boolean {
  return !process.env.POSTMARK_API_KEY && !process.env.SENDGRID_API_KEY
}

export async function sendEmail(msg: EmailMessage): Promise<{ demo: boolean; preview?: string }> {
  if (isDemoMode()) {
    // Demo mode: store in memory + log to console
    const list = demoOutbox.get(msg.to) ?? []
    list.unshift(msg)
    demoOutbox.set(msg.to, list.slice(0, 10))
    console.log(`\n📧 [DEMO EMAIL] To: ${msg.to}\n   Subject: ${msg.subject}\n   Body: ${msg.body}\n`)
    return { demo: true, preview: msg.body }
  }

  // Production: Postmark
  if (process.env.POSTMARK_API_KEY) {
    try {
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY!,
        },
        body: JSON.stringify({
          From: process.env.EMAIL_FROM ?? 'ShiftGrid <noreply@shiftgrid.app>',
          To: msg.to,
          Subject: msg.subject,
          TextBody: msg.body,
          HtmlBody: msg.html,
        }),
      })
      if (!res.ok) throw new Error(`Postmark error: ${res.status}`)
      return { demo: false }
    } catch (e: any) {
      console.error('Postmark send failed, falling back to demo:', e.message)
      const list = demoOutbox.get(msg.to) ?? []
      list.unshift(msg)
      demoOutbox.set(msg.to, list.slice(0, 10))
      return { demo: true, preview: msg.body }
    }
  }

  return { demo: true, preview: msg.body }
}

// Retrieve the most recent demo email for a given address.
// Used by the frontend to display the verification code in demo mode.
export function getLatestDemoEmail(to: string): EmailMessage | null {
  const list = demoOutbox.get(to)
  return list && list.length > 0 ? list[0] : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification email
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, name: string, code: string, token: string): Promise<{ demo: boolean; preview?: string }> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/?verify=${token}&email=${encodeURIComponent(to)}`
  const body = `Hi ${name},

Welcome to ShiftGrid! Please verify your email address to activate your account.

Your verification code is: ${code}

Or click this link to verify automatically:
${verifyUrl}

This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.

— The ShiftGrid team`
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #059669; font-size: 24px; margin: 0;">ShiftGrid</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Verify your email address</p>
  </div>
  <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
  <p style="color: #374151; font-size: 16px; line-height: 1.6;">Welcome to ShiftGrid! Please verify your email address to activate your account.</p>
  <div style="text-align: center; margin: 32px 0;">
    <div style="display: inline-block; background: #ecfdf5; border: 2px solid #059669; border-radius: 12px; padding: 20px 40px;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your verification code</div>
      <div style="font-size: 36px; font-weight: 700; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
    </div>
  </div>
  <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Or click the button below to verify automatically:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify email</a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
</div>`
  return sendEmail({ to, subject: 'Verify your ShiftGrid account', body, html })
}
