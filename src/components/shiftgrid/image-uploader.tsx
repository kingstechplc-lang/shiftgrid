'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2, RotateCcw, AlertCircle, CheckCircle2, Crop } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export type ImageType =
  | 'profile_photo'
  | 'cover_photo'
  | 'facility_logo'
  | 'facility_cover'
  | 'shift_banner'
  | 'hero_desktop'
  | 'hero_mobile'
  | 'announcement'
  | 'document'

const IMAGE_CONFIG: Record<ImageType, { aspect: number; width: number; height: number; maxSize: number; label: string }> = {
  profile_photo:   { aspect: 1,    width: 512,  height: 512,  maxSize: 300 * 1024,    label: 'Profile Photo (512×512, 1:1)' },
  cover_photo:     { aspect: 3,    width: 1500, height: 500,  maxSize: 800 * 1024,    label: 'Profile Cover (1500×500, 3:1)' },
  facility_logo:   { aspect: 1,    width: 512,  height: 512,  maxSize: 300 * 1024,    label: 'Facility Logo (512×512, 1:1)' },
  facility_cover:  { aspect: 16/9, width: 1600, height: 900,  maxSize: 1500 * 1024,   label: 'Facility Cover (1600×900, 16:9)' },
  shift_banner:    { aspect: 16/9, width: 1600, height: 900,  maxSize: 1500 * 1024,   label: 'Shift Banner (1600×900, 16:9)' },
  hero_desktop:    { aspect: 1920/700, width: 1920, height: 700, maxSize: 1500 * 1024, label: 'Desktop Hero (1920×700)' },
  hero_mobile:     { aspect: 9/5,  width: 1080, height: 600,  maxSize: 1500 * 1024,   label: 'Mobile Hero (1080×600, 9:5)' },
  announcement:    { aspect: 16/9, width: 1200, height: 675,  maxSize: 1500 * 1024,   label: 'Announcement (1200×675, 16:9)' },
  document:        { aspect: 3/4,  width: 1200, height: 1600, maxSize: 1500 * 1024,   label: 'Document (1200×1600, 3:4)' },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

interface ImageUploaderProps {
  type: ImageType
  currentUrl?: string | null
  onUploaded: (url: string) => void
  onRemoved?: () => void
  uploadEndpoint: string // e.g. '/api/upload/photo'
  altText: string
  className?: string
  shape?: 'circle' | 'square' | 'wide'
}

type UploadState = 'idle' | 'validating' | 'processing' | 'uploading' | 'success' | 'error'

export function ImageUploader({
  type,
  currentUrl,
  onUploaded,
  onRemoved,
  uploadEndpoint,
  altText,
  className = '',
  shape = 'square',
}: ImageUploaderProps) {
  const config = IMAGE_CONFIG[type]
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [dragOver, setDragOver] = useState(false)

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'wide' ? 'rounded-xl' : 'rounded-xl'

  const processAndUpload = useCallback(async (file: File) => {
    setError(null)

    // 1. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or WebP.')
      setState('error')
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'JPG, PNG, or WebP only.' })
      return
    }

    // 2. Validate file size (max 10MB original)
    if (file.size > MAX_UPLOAD_SIZE) {
      setError('Image is too large. Please choose an image under 10 MB.')
      setState('error')
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum 10 MB.' })
      return
    }

    setState('validating')

    try {
      // 3. Read image to get dimensions
      const img = new window.Image()
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // 4. Process image: crop to aspect ratio + resize + compress
      setState('processing')
      const processedBlob = await processImage(img, config.aspect, config.width, config.height)
      URL.revokeObjectURL(objectUrl)

      // 5. Check processed size
      if (processedBlob.size > config.maxSize * 1.5) {
        // If still too big after compression, compress more
        // sharp on the server will handle final compression
      }

      // 6. Upload
      setState('uploading')
      setProgress(0)

      const formData = new FormData()
      const processedFile = new File([processedBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
      formData.append('file', processedFile)
      formData.append('type', type)

      const xhr = new XMLHttpRequest()
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          try {
            const data = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300 && data.url) {
              resolve(data.url)
            } else {
              reject(new Error(data.error || 'Upload failed'))
            }
          } catch {
            reject(new Error('Invalid response from server'))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
        xhr.open('POST', uploadEndpoint)
        xhr.send(formData)
      })

      const url = await uploadPromise
      setPreview(url)
      setState('success')
      setProgress(100)
      onUploaded(url)
      toast({ title: 'Image uploaded', description: `${config.label} updated successfully.` })

      // Reset to idle after 2 seconds
      setTimeout(() => setState('idle'), 2000)
    } catch (e: any) {
      setError(e.message || 'Unable to upload image. Please try again.')
      setState('error')
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message })
    }
  }, [config, type, uploadEndpoint, onUploaded, toast])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processAndUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processAndUpload(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleRemove() {
    setPreview(null)
    setState('idle')
    onRemoved?.()
  }

  function handleRetry() {
    setState('idle')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const isLoading = state === 'validating' || state === 'processing' || state === 'uploading'

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview / Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && state !== 'error' && fileInputRef.current?.click()}
        className={`relative ${shapeClass} overflow-hidden border-2 border-dashed transition-all cursor-pointer ${
          dragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' :
          state === 'error' ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' :
          'border-border hover:border-emerald-300 hover:bg-muted/50'
        } ${shape === 'circle' ? 'size-32' : 'w-full aspect-' + (shape === 'wide' ? '[3/1]' : '[1/1]')}`}
        style={shape !== 'circle' ? { aspectRatio: config.aspect.toString() } : undefined}
      >
        {preview ? (
          <img src={preview} alt={altText} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="size-8 mb-2" />
            <span className="text-xs text-center px-2">Click or drag image</span>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            {state === 'validating' && <><Loader2 className="size-6 animate-spin mb-2" /><span className="text-xs">Validating…</span></>}
            {state === 'processing' && <><Crop className="size-6 mb-2" /><span className="text-xs">Optimizing image…</span></>}
            {state === 'uploading' && (
              <>
                <Loader2 className="size-6 animate-spin mb-2" />
                <span className="text-xs">Uploading… {progress}%</span>
                <div className="w-24 h-1 bg-white/30 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Success overlay */}
        {state === 'success' && (
          <div className="absolute inset-0 bg-emerald-600/80 flex items-center justify-center text-white animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="size-8" />
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 bg-rose-600/80 flex flex-col items-center justify-center text-white p-2">
            <AlertCircle className="size-6 mb-1" />
            <span className="text-[10px] text-center">Upload failed</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {state === 'error' ? (
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            <RotateCcw className="size-3 mr-1" /> Retry
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload className="size-3 mr-1" /> {preview ? 'Change' : 'Upload'}
          </Button>
        )}
        {preview && !isLoading && (
          <Button type="button" variant="outline" size="sm" onClick={handleRemove} className="text-rose-600 hover:bg-rose-50">
            <X className="size-3 mr-1" /> Remove
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      )}

      {/* Help text */}
      <p className="text-[10px] text-muted-foreground mt-1">{config.label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Image processing: crop to aspect ratio + resize + compress to WebP
// ─────────────────────────────────────────────────────────────────────────────
async function processImage(
  img: HTMLImageElement,
  aspect: number,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // Source dimensions
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  // Calculate crop region to match aspect ratio
  let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH
  const srcAspect = srcW / srcH

  if (srcAspect > aspect) {
    // Source is wider than target — crop sides
    cropW = srcH * aspect
    cropX = (srcW - cropW) / 2
  } else if (srcAspect < aspect) {
    // Source is taller than target — crop top/bottom
    cropH = srcW / aspect
    cropY = (srcH - cropH) / 2
  }

  // Set canvas to target dimensions
  canvas.width = targetWidth
  canvas.height = targetHeight

  // Draw cropped + resized image
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight)

  // Convert to WebP with quality compression
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to process image'))
      },
      'image/webp',
      0.85 // 85% quality — good balance of size vs quality
    )
  })
}
