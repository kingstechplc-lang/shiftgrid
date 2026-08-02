import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPasswordSecure } from '@/lib/auth'
import { Role } from '@prisma/client'

// PATCH /api/super/users/[id] — update user role, status, or reset password
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { role, status, newPassword, name } = body
  const data: any = {}

  if (role && ['super_admin', 'hospital_admin', 'staff'].includes(role)) {
    data.role = role as Role
  }
  if (status && ['active', 'suspended', 'banned'].includes(status)) {
    data.status = status
  }
  if (name) data.name = String(name)
  if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
    data.passwordHash = hashPasswordSecure(newPassword)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, status: true },
  })

  return NextResponse.json({ user: updated })
}

// DELETE /api/super/users/[id] — delete a user (super admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }
  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Check the confirm checkbox was sent
  const { searchParams } = new URL(req.url)
  const confirm = searchParams.get('confirm')
  if (confirm !== 'yes') {
    return NextResponse.json({ error: 'Confirmation required. Add ?confirm=yes to confirm deletion.' }, { status: 400 })
  }

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
