import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/credentials — current user's credentials
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.credential.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items })
}

// POST /api/credentials — add a credential
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { type, name, fileUrl, issueDate, expiryDate } = await req.json()
  if (!type || !name) return NextResponse.json({ error: 'type and name required' }, { status: 400 })
  const cred = await db.credential.create({
    data: {
      userId: user.id,
      type: String(type),
      name: String(name),
      fileUrl: fileUrl ?? '',
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      verified: false,
    },
  })
  return NextResponse.json({ credential: cred }, { status: 201 })
}
