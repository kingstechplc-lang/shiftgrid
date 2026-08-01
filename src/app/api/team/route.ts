import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { Role } from '@prisma/client'

// GET /api/team — list admins at current admin's hospital
export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin') || !user.hospitalId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const members = await db.user.findMany({
    where: { hospitalId: user.hospitalId, role: Role.hospital_admin },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ items: members })
}

// POST /api/team — invite/add another admin to the same hospital
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin') || !user.hospitalId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, email, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
  const exists = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
  if (exists) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
  const member = await db.user.create({
    data: {
      name: String(name),
      email: String(email).toLowerCase().trim(),
      passwordHash: hashPassword(password),
      role: Role.hospital_admin,
      hospitalId: user.hospitalId,
    },
  })
  return NextResponse.json({ member }, { status: 201 })
}
