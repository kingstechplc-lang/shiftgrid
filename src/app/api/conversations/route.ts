import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/conversations — returns list of users the current user can message,
// scoped by role:
//   staff → admins at hospitals where they've applied or messaged
//   admin → staff who have applied to their hospital's offers or messaged them
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let partners: Array<{ id: string; name: string; role: string; hospital: { name: string } | null }> = []

  if (user.role === 'staff') {
    // Admins at hospitals where staff has applied, plus admins staff has messaged
    const apps = await db.application.findMany({
      where: { userId: user.id },
      include: { offer: { include: { hospital: { include: { members: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } } } } } },
    })
    const set = new Map<string, any>()
    for (const a of apps) {
      for (const m of a.offer.hospital.members) set.set(m.id, m)
    }
    const sent = await db.message.findMany({ where: { senderId: user.id }, include: { recipient: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } } })
    for (const m of sent) set.set(m.recipient.id, m.recipient)
    const received = await db.message.findMany({ where: { recipientId: user.id }, include: { sender: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } } })
    for (const m of received) set.set(m.sender.id, m.sender)
    partners = Array.from(set.values())
  } else if (user.role === 'hospital_admin' && user.hospitalId) {
    // Staff who have applied to this hospital's offers, plus staff who have messaged this admin
    const apps = await db.application.findMany({
      where: { offer: { hospitalId: user.hospitalId } },
      include: { user: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } },
    })
    const set = new Map<string, any>()
    for (const a of apps) set.set(a.user.id, a.user)
    const sent = await db.message.findMany({ where: { senderId: user.id }, include: { recipient: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } } })
    for (const m of sent) set.set(m.recipient.id, m.recipient)
    const received = await db.message.findMany({ where: { recipientId: user.id }, include: { sender: { select: { id: true, name: true, role: true, hospital: { select: { name: true } } } } } })
    for (const m of received) set.set(m.sender.id, m.sender)
    partners = Array.from(set.values())
  }

  return NextResponse.json({ items: partners })
}
