import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const TYPE_CONFIG: Record<string, { width: number; height: number; quality: number; maxSize: number }> = {
  profile_photo:   { width: 512,  height: 512,  quality: 85, maxSize: 300 * 1024 },
  cover_photo:     { width: 1500, height: 500,  quality: 82, maxSize: 800 * 1024 },
  facility_logo:   { width: 512,  height: 512,  quality: 85, maxSize: 300 * 1024 },
  facility_cover:  { width: 1600, height: 900,  quality: 80, maxSize: 1500 * 1024 },
  shift_banner:    { width: 1600, height: 900,  quality: 80, maxSize: 1500 * 1024 },
  hero_desktop:    { width: 1920, height: 700,  quality: 80, maxSize: 1500 * 1024 },
  hero_mobile:     { width: 1080, height: 600,  quality: 80, maxSize: 1500 * 1024 },
  announcement:    { width: 1200, height: 675,  quality: 82, maxSize: 1500 * 1024 },
  document:        { width: 1200, height: 1600, quality: 85, maxSize: 1500 * 1024 },
}

// POST /api/upload/image — unified image upload with sharp processing
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'profile_photo'

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. JPG, PNG, or WebP only.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large. Maximum 10 MB.' }, { status: 400 })
    }

    const config = TYPE_CONFIG[type] || TYPE_CONFIG.profile_photo

    // Process image with sharp: resize, crop to aspect, convert to WebP
    const buffer = Buffer.from(await file.arrayBuffer())
    let processedBuffer = await sharp(buffer)
      .resize(config.width, config.height, { fit: 'cover', position: 'center' })
      .webp({ quality: config.quality })
      .toBuffer()

    // If still too large, reduce quality
    if (processedBuffer.length > config.maxSize) {
      const reducedQuality = Math.max(50, config.quality - 15)
      processedBuffer = await sharp(buffer)
        .resize(config.width, config.height, { fit: 'cover', position: 'center' })
        .webp({ quality: reducedQuality })
        .toBuffer()
    }

    // If STILL too large, reduce dimensions
    if (processedBuffer.length > config.maxSize) {
      const scale = Math.sqrt(config.maxSize / processedBuffer.length)
      const newW = Math.round(config.width * scale)
      const newH = Math.round(config.height * scale)
      processedBuffer = await sharp(buffer)
        .resize(newW, newH, { fit: 'cover', position: 'center' })
        .webp({ quality: 60 })
        .toBuffer()
    }

    // Convert to base64 data URL (in production, use Vercel Blob / S3)
    const base64 = processedBuffer.toString('base64')
    const dataUrl = `data:image/webp;base64,${base64}`

    // Save media asset record
    await db.mediaAsset.create({
      data: {
        url: dataUrl,
        type,
        uploadedById: user.id,
        fileSize: processedBuffer.length,
        width: config.width,
        height: config.height,
        mimeType: 'image/webp',
      },
    }).catch(() => {}) // Don't fail if already exists

    return NextResponse.json({
      url: dataUrl,
      size: processedBuffer.length,
      width: config.width,
      height: config.height,
      type: 'image/webp',
    })
  } catch (e: any) {
    console.error('Image upload error:', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
