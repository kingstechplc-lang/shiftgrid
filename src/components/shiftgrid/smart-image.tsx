'use client'

import { useState, useCallback } from 'react'

type ImageType =
  | 'avatar'
  | 'cover-3-1'
  | 'cover-16-9'
  | 'hero-desktop'
  | 'hero-mobile'
  | 'document'
  | 'hospital-logo'

const FALLBACKS: Record<ImageType, string> = {
  'avatar': '/defaults/avatar.svg',
  'cover-3-1': '/defaults/cover-3-1.svg',
  'cover-16-9': '/defaults/cover-16-9.svg',
  'hero-desktop': '/defaults/hero-desktop.svg',
  'hero-mobile': '/defaults/hero-mobile.svg',
  'document': '/defaults/document.svg',
  'hospital-logo': '/defaults/hospital-logo.svg',
}

const ASPECT_CLASSES: Record<ImageType, string> = {
  'avatar': 'aspect-square rounded-full',
  'cover-3-1': 'aspect-[3/1]',
  'cover-16-9': 'aspect-[16/9]',
  'hero-desktop': 'aspect-[1920/700]',
  'hero-mobile': 'aspect-[9/5]',
  'document': 'aspect-[3/4]',
  'hospital-logo': 'aspect-square',
}

interface SmartImageProps {
  src?: string | null
  alt: string
  type?: ImageType
  className?: string
  imgClassName?: string
  lazy?: boolean
  fallback?: string
  sizes?: string
}

export function SmartImage({
  src,
  alt,
  type = 'avatar',
  className = '',
  imgClassName = '',
  lazy = true,
  fallback,
  sizes,
}: SmartImageProps) {
  const fallbackSrc = fallback || FALLBACKS[type]
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
  const [loaded, setLoaded] = useState(false)

  const handleError = useCallback(() => {
    setImgSrc(fallbackSrc)
  }, [fallbackSrc])

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  // If src prop changes, update
  const currentSrc = src || fallbackSrc
  if (currentSrc !== imgSrc && !imgSrc.startsWith('/defaults/')) {
    setImgSrc(currentSrc)
    setLoaded(false)
  } else if (currentSrc !== imgSrc && imgSrc.startsWith('/defaults/') && src) {
    setImgSrc(src)
    setLoaded(false)
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${ASPECT_CLASSES[type]} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading…</div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        sizes={sizes}
      />
    </div>
  )
}
