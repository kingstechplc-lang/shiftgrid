import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/upload/photo — handle profile photo upload
// Accepts multipart/form-data with a "file" field
// Returns the data URL (base64) which gets saved to user.profilePhoto
// In production, replace with Vercel Blob / S3 upload.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File must be JPG, JPEG, PNG, or WEBP.' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must not exceed 5MB.' }, { status: 400 })
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Save to user's profile
    await db.user.update({
      where: { id: user.id },
      data: { profilePhoto: dataUrl },
    })

    return NextResponse.json({ url: dataUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed.' }, { status: 500 })
  }
}
