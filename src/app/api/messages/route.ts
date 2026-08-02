import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/messages?withUserId=...&offerId=...
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const withUserId = searchParams.get('withUserId')
  const offerId = searchParams.get('offerId')

  if (withUserId) {
    const where: any = {
      OR: [
        { senderId: user.id, recipientId: withUserId },
        { senderId: withUserId, recipientId: user.id },
      ],
    }
    if (offerId) where.offerId = offerId
    const items = await db.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })
    await db.message.updateMany({
      where: { recipientId: user.id, senderId: withUserId, read: false, ...(offerId ? { offerId } : {}) },
      data: { read: true },
    })
    return NextResponse.json({ items })
  }

  const sent = await db.message.findMany({
    where: { senderId: user.id },
    include: { recipient: { select: { id: true, name: true, role: true, profilePhoto: true, hospital: { select: { name: true } } } }, offer: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const received = await db.message.findMany({
    where: { recipientId: user.id },
    include: { sender: { select: { id: true, name: true, role: true, profilePhoto: true, hospital: { select: { name: true } } } }, offer: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const threadsMap = new Map<string, any>()
  for (const m of [...sent, ...received]) {
    const partnerId = m.senderId === user.id ? m.recipientId : m.senderId
    const key = `${partnerId}:${m.offerId ?? ''}`
    const existing = threadsMap.get(key)
    if (!existing || new Date(m.createdAt) > new Date(existing.lastAt)) {
      const partner = m.senderId === user.id ? m.recipient : m.sender
      threadsMap.set(key, {
        partnerId, partnerName: partner.name, partnerRole: partner.role,
        partnerPhoto: partner.profilePhoto,
        partnerHospital: partner.hospital?.name ?? null,
        offerId: m.offerId ?? null, offerTitle: m.offer?.title ?? null,
        preview: m.body.length > 100 ? m.body.slice(0, 100) + '…' : m.body,
        lastAt: m.createdAt, mine: m.senderId === user.id,
      })
    }
  }
  const items = Array.from(threadsMap.values()).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
  return NextResponse.json({ items })
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { recipientId, body, offerId } = await req.json()
  if (!recipientId || !body) return NextResponse.json({ error: 'recipientId and body required' }, { status: 400 })

  // Check if recipient is a super admin and if they allow messages
  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { role: true, canReceiveMessages: true, name: true },
  })
  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })

  if (recipient.role === 'super_admin' && recipient.canReceiveMessages === 'false') {
    return NextResponse.json({
      error: `${recipient.name} is not accepting messages at this time.`,
    }, { status: 403 })
  }

  const msg = await db.message.create({
    data: { senderId: user.id, recipientId, body, offerId: offerId ?? null },
  })
  await db.notification.create({
    data: { userId: recipientId, type: 'message', title: `New message from ${user.name}`, body: body.length > 100 ? body.slice(0, 100) + '…' : body, payload: JSON.stringify({ messageId: msg.id, offerId: offerId ?? null }) },
  })
  return NextResponse.json({ message: msg }, { status: 201 })
}
