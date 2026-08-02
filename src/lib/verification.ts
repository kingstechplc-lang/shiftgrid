import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { createHash, randomBytes, randomInt } from 'crypto'

// Generate a 6-digit code and a long token for email links
export function generateVerificationCode(): string {
  return String(randomInt(0, 1000000)).padStart(6, '0')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createVerificationToken(userId: string): Promise<{ code: string; token: string }> {
  // Invalidate any existing unused tokens for this user
  await db.verificationToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  })

  const code = generateVerificationCode()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await db.verificationToken.create({
    data: { userId, code, token, type: 'email_verification', expiresAt },
  })

  return { code, token }
}

export async function sendVerification(userId: string, email: string, name: string): Promise<{ demo: boolean; preview?: string; code?: string }> {
  const { code, token } = await createVerificationToken(userId)
  const result = await sendVerificationEmail(email, name, code, token)
  // In demo mode, include the code in the response so the UI can display it
  if (result.demo) {
    return { ...result, code }
  }
  return result
}

export async function verifyCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const token = await db.verificationToken.findFirst({
    where: { userId, code, type: 'email_verification', used: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) return { success: false, error: 'Invalid code. Please check and try again.' }
  if (token.expiresAt < new Date()) return { success: false, error: 'This code has expired. Please request a new one.' }

  await db.$transaction([
    db.verificationToken.update({ where: { id: token.id }, data: { used: true } }),
    db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
  ])
  return { success: true }
}

export async function verifyToken(token: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  const t = await db.verificationToken.findUnique({ where: { token } })
  if (!t) return { success: false, error: 'Invalid verification link.' }
  if (t.used) return { success: false, error: 'This link has already been used.' }
  if (t.expiresAt < new Date()) return { success: false, error: 'This link has expired.' }

  await db.$transaction([
    db.verificationToken.update({ where: { id: t.id }, data: { used: true } }),
    db.user.update({ where: { id: t.userId }, data: { emailVerified: new Date() } }),
  ])
  return { success: true, userId: t.userId }
}
