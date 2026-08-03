'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AdConfig {
  slotName: string
  label: string
  adKey?: string | null
  adScriptSrc?: string | null
  width?: number | null
  height?: number | null
  adType: string // "atoptions" | "native" | "custom"
  customCode?: string | null
}

// Cache for ad configs — fetched once per page load
let adConfigCache: Record<string, AdConfig> | null = null
let adConfigPromise: Promise<Record<string, AdConfig>> | null = null

async function fetchAdConfigs(): Promise<Record<string, AdConfig>> {
  if (adConfigCache) return adConfigCache
  if (adConfigPromise) return adConfigPromise

  adConfigPromise = fetch('/api/ads').then(r => r.json()).then(data => {
    adConfigCache = data.ads || {}
    return adConfigCache
  }).catch(() => {
    adConfigCache = {}
    return {}
  })

  return adConfigPromise
}

// ─────────────────────────────────────────────────────────────────────────────
// Core AdSlot — renders ad in an isolated iframe to prevent atOptions conflicts
// ─────────────────────────────────────────────────────────────────────────────

interface AdSlotProps {
  slotName: string // "skyscraper" | "leaderboard" | "mobile_banner" | "native"
  className?: string
  label?: string
}

export function AdSlot({ slotName, className = '', label = 'Sponsored' }: AdSlotProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [config, setConfig] = useState<AdConfig | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchAdConfigs().then(configs => {
      const cfg = configs[slotName]
      if (cfg) setConfig(cfg)
    })
  }, [slotName])

  const writeAdToIframe = useCallback(() => {
    if (!iframeRef.current || !config) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Build the HTML for the iframe
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;background:transparent;}</style></head><body>'

    if (config.adType === 'native') {
      // Native ad: container div + script
      html += `<div id="container-${config.adKey}"></div>`
      html += `<script async="async" data-cfasync="false" src="${config.adScriptSrc}"></script>`
    } else if (config.adType === 'custom' && config.customCode) {
      // Custom ad code
      html += config.customCode
    } else if (config.adKey && config.adScriptSrc) {
      // atOptions pattern — isolated in iframe so no conflicts
      html += `<script>`
      html += `atOptions = {`
      html += `'key' : '${config.adKey}',`
      html += `'format' : 'iframe',`
      html += `'height' : ${config.height || 600},`
      html += `'width' : ${config.width || 160},`
      html += `'params' : {}`
      html += `};`
      html += `</script>`
      html += `<script src="${config.adScriptSrc}"></script>`
    }

    html += '</body></html>'

    doc.open()
    doc.write(html)
    doc.close()
    setLoaded(true)
  }, [config])

  useEffect(() => {
    if (config) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(writeAdToIframe, 100)
      return () => clearTimeout(timer)
    }
  }, [config, writeAdToIframe])

  if (!config) {
    // Still loading config or slot is disabled
    return null
  }

  const w = config.width || '100%'
  const h = config.height || 90

  return (
    <div className={`ad-slot flex flex-col items-center ${className}`}>
      {label && (
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-0.5 font-medium">
          {label}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title={`ad-${slotName}`}
        width={w}
        height={h}
        style={{ border: 'none', maxWidth: '100%', overflow: 'hidden' }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        scrolling="no"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategic placement wrappers
// ─────────────────────────────────────────────────────────────────────────────

// Sidebar skyscraper — desktop only (xl+)
export function SidebarAd() {
  return (
    <div className="hidden xl:flex flex-col items-center sticky top-6">
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-3 bg-muted/30">
        <AdSlot slotName="skyscraper" label="Sponsored" />
      </div>
    </div>
  )
}

// Mobile sticky bottom banner — mobile only, dismissible
export function MobileStickyAd({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border flex items-center justify-center relative py-1">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-0.5 right-1 size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
          aria-label="Dismiss ad"
        >
          <span className="text-xs">✕</span>
        </button>
      )}
      <AdSlot slotName="mobile_banner" label="" />
    </div>
  )
}

// Desktop leaderboard — shown on desktop only (between sections)
export function DesktopLeaderboardAd() {
  return (
    <div className="hidden lg:flex my-4 rounded-xl border-2 border-dashed border-muted-foreground/15 p-3 bg-muted/20 justify-center">
      <AdSlot slotName="leaderboard" label="Sponsored" />
    </div>
  )
}

// Mobile inline banner — shown on mobile only (between sections)
export function MobileInlineAd() {
  return (
    <div className="lg:hidden my-4 rounded-xl border-2 border-dashed border-muted-foreground/15 p-3 bg-muted/20 flex justify-center">
      <AdSlot slotName="mobile_banner" label="Sponsored" />
    </div>
  )
}

// Inline banner — responsive (leaderboard on desktop, mobile banner on mobile)
export function InlineBannerAd() {
  return (
    <>
      <DesktopLeaderboardAd />
      <MobileInlineAd />
    </>
  )
}

// In-feed native ad — between content items
export function InFeedAd() {
  return (
    <div className="my-4 col-span-full rounded-xl border-2 border-dashed border-muted-foreground/15 p-3 bg-muted/20">
      <AdSlot slotName="native" label="Sponsored Content" />
    </div>
  )
}
