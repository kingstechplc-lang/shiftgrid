'use client'

import { useEffect, useRef, useState } from 'react'

type AdVariant = 'skyscraper' | 'mobile-banner' | 'native'

interface AdSlotProps {
  variant: AdVariant
  className?: string
  label?: string
}

// Adsterra ad configurations
const AD_CONFIGS = {
  skyscraper: {
    key: '435fa794ab27249e1ebebea502a8ebe2',
    width: 160,
    height: 600,
    scriptSrc: 'https://www.highperformanceformat.com/435fa794ab27249e1ebebea502a8ebe2/invoke.js',
  },
  'mobile-banner': {
    key: '49b9469e70a7c6ba5a53aca9834c4282',
    width: 320,
    height: 50,
    scriptSrc: 'https://www.highperformanceformat.com/49b9469e70a7c6ba5a53aca9834c4282/invoke.js',
  },
  native: {
    key: 'f4f5a78d91d7cfa27c8e5f86ee630713',
    scriptSrc: 'https://pl30656065.effectivecpmnetwork.com/f4f5a78d91d7cfa27c8e5f86ee630713/invoke.js',
    containerId: 'container-f4f5a78d91d7cfa27c8e5f86ee630713',
  },
}

let adInstanceId = 0

export function AdSlot({ variant, className = '', label = 'Sponsored' }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const instanceId = useRef(`ad-${variant}-${++adInstanceId}`)

  useEffect(() => {
    if (!containerRef.current) return

    const config = AD_CONFIGS[variant]
    const container = containerRef.current

    // Clear any existing content
    container.innerHTML = ''

    if (variant === 'native') {
      // Native ad: create container div + load script
      const adDiv = document.createElement('div')
      adDiv.id = config.containerId
      container.appendChild(adDiv)

      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = config.scriptSrc
      script.onload = () => setLoaded(true)
      script.onerror = () => setLoaded(false)
      container.appendChild(script)
    } else {
      // Skyscraper + mobile banner: use atOptions pattern
      const atOptionsScript = document.createElement('script')
      atOptionsScript.type = 'text/javascript'
      atOptionsScript.text = `
        atOptions = {
          'key' : '${config.key}',
          'format' : 'iframe',
          'height' : ${config.height},
          'width' : ${config.width},
          'params' : {}
        };
      `
      container.appendChild(atOptionsScript)

      const invokeScript = document.createElement('script')
      invokeScript.type = 'text/javascript'
      invokeScript.src = config.scriptSrc
      invokeScript.async = true
      invokeScript.onload = () => setLoaded(true)
      invokeScript.onerror = () => setLoaded(false)
      container.appendChild(invokeScript)
    }

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [variant])

  const config = AD_CONFIGS[variant]

  // Different wrapper styles per variant
  const wrapperClass = {
    skyscraper: 'flex flex-col items-center',
    'mobile-banner': 'flex justify-center',
    native: 'w-full',
  }[variant]

  const dimensions = variant !== 'native' ? { width: config.width, height: config.height } : undefined

  return (
    <div className={`ad-slot ${wrapperClass} ${className}`}>
      {/* Sponsored label */}
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-1 font-medium">
        {label}
      </div>
      {/* Ad container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg"
        style={dimensions ? { width: config.width, height: config.height, maxWidth: '100%' } : { minHeight: 90 }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategic ad placement wrappers
// ─────────────────────────────────────────────────────────────────────────────

// Sidebar skyscraper — desktop only, appears in right sidebar
export function SidebarAd() {
  return (
    <div className="hidden xl:block sticky top-6">
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-3 bg-muted/30">
        <AdSlot variant="skyscraper" label="Sponsored" />
      </div>
    </div>
  )
}

// Mobile sticky bottom banner — mobile only
export function MobileStickyAd() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border p-1 flex justify-center">
      <AdSlot variant="mobile-banner" label="" className="py-0" />
    </div>
  )
}

// In-feed native ad — between content items
export function InFeedAd() {
  return (
    <div className="my-4 rounded-xl border-2 border-dashed border-muted-foreground/15 p-3 bg-muted/20">
      <AdSlot variant="native" label="Sponsored Content" />
    </div>
  )
}

// Inline banner ad — between sections (e.g., between dashboard sections)
export function InlineBannerAd() {
  return (
    <div className="my-4 rounded-xl border-2 border-dashed border-muted-foreground/15 p-3 bg-muted/20 flex justify-center">
      <AdSlot variant="mobile-banner" label="Sponsored" />
    </div>
  )
}
