import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/super/global-message — send a message to all users or a specific user
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }

  const { recipientType, recipientId, subject, body: messageBody } = await req.json()
  if (!subject || !messageBody) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  let recipients: { id: string; name: string; email: string }[] = []

  if (recipientType === 'all') {
    recipients = await db.user.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, email: true },
    })
  } else if (recipientType === 'staff') {
    recipients = await db.user.findMany({
      where: { status: 'active', role: 'staff' },
      select: { id: true, name: true, email: true },
    })
  } else if (recipientType === 'admins') {
    recipients = await db.user.findMany({
      where: { status: 'active', role: { in: ['hospital_admin', 'super_admin'] } },
      select: { id: true, name: true, email: true },
    })
  } else if (recipientType === 'specific' && recipientId) {
    const r = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true },
    })
    if (r) recipients = [r]
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
  }

  // Create messages + notifications for each recipient
  const messages = recipients.map(r => ({
    senderId: user.id,
    recipientId: r.id,
    body: `${subject}\n\n${messageBody}`,
    read: false,
  }))

  const notifications = recipients.map(r => ({
    userId: r.id,
    type: 'global_message',
    title: `Message from Super Admin: ${subject}`,
    body: messageBody.slice(0, 150),
  }))

  await db.message.createMany({ data: messages })
  await db.notification.createMany({ data: notifications })

  return NextResponse.json({
    success: true,
    sentTo: recipients.length,
    recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email })),
  })
}
