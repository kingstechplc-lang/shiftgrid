'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Megaphone, Save, Loader2, Eye, EyeOff, ExternalLink, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type AdConfig = {
  id: string
  slotName: string
  label: string
  enabled: boolean
  adKey: string | null
  adScriptSrc: string | null
  width: number | null
  height: number | null
  adType: string
  customCode: string | null
  updatedAt: string
}

const SLOT_DESCRIPTIONS: Record<string, string> = {
  skyscraper: '160×600 vertical banner in the right sidebar (desktop xl+ only). Visible to staff users.',
  leaderboard: '728×90 horizontal banner between content sections (desktop only). Replaces mobile banner on large screens.',
  mobile_banner: '320×50 sticky bottom bar on mobile devices. Dismissible by users. Visible to staff users.',
  native: 'In-feed native ad between offer cards on the browse page. Responsive. Visible to staff users.',
}

const DEFAULT_CONFIGS: Record<string, { adKey: string; adScriptSrc: string; width: number; height: number; adType: string }> = {
  skyscraper: { adKey: '435fa794ab27249e1ebebea502a8ebe2', adScriptSrc: 'https://www.highperformanceformat.com/435fa794ab27249e1ebebea502a8ebe2/invoke.js', width: 160, height: 600, adType: 'atoptions' },
  leaderboard: { adKey: 'ff9303a4c3803518fcbf35c0d9fa74ea', adScriptSrc: 'https://www.highperformanceformat.com/ff9303a4c3803518fcbf35c0d9fa74ea/invoke.js', width: 728, height: 90, adType: 'atoptions' },
  mobile_banner: { adKey: '49b9469e70a7c6ba5a53aca9834c4282', adScriptSrc: 'https://www.highperformanceformat.com/49b9469e70a7c6ba5a53aca9834c4282/invoke.js', width: 320, height: 50, adType: 'atoptions' },
  native: { adKey: 'f4f5a78d91d7cfa27c8e5f86ee630713', adScriptSrc: 'https://pl30656065.effectivecpmnetwork.com/f4f5a78d91d7cfa27c8e5f86ee630713/invoke.js', width: 0, height: 0, adType: 'native' },
}

export function AdManagement() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<AdConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      // Fetch all ad configs (including disabled) — need a super admin endpoint
      const res = await fetch('/api/ads?all=true', { credentials: 'include' })
      const data = await res.json()
      if (data.ads) {
        // Convert map to array
        const arr = Object.values(data.ads) as AdConfig[]
        setConfigs(arr)
      }
    } catch {
      // Fallback: fetch enabled only and construct from defaults
    }
    setLoading(false)
  }

  async function toggleEnabled(slot: AdConfig) {
    setSaving(slot.slotName)
    try {
      const res = await api<{ config: AdConfig }>('/api/ads', {
        method: 'PATCH',
        body: JSON.stringify({ slotName: slot.slotName, enabled: !slot.enabled }),
      })
      setConfigs(prev => prev.map(c => c.slotName === slot.slotName ? { ...c, enabled: !c.enabled } : c))
      toast({
        title: slot.enabled ? 'Ad slot disabled' : 'Ad slot enabled',
        description: slot.label,
      })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(null)
    }
  }

  async function handleSave(slot: AdConfig, updates: Partial<AdConfig>) {
    setSaving(slot.slotName)
    try {
      await api('/api/ads', {
        method: 'PATCH',
        body: JSON.stringify({ slotName: slot.slotName, ...updates }),
      })
      setConfigs(prev => prev.map(c => c.slotName === slot.slotName ? { ...c, ...updates } : c))
      toast({ title: 'Ad configuration saved', description: slot.label })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(null)
    }
  }

  async function handleReset(slot: AdConfig) {
    const defaults = DEFAULT_CONFIGS[slot.slotName]
    if (!defaults) return
    setSaving(slot.slotName)
    try {
      await api('/api/ads', {
        method: 'PATCH',
        body: JSON.stringify({
          slotName: slot.slotName,
          adKey: defaults.adKey,
          adScriptSrc: defaults.adScriptSrc,
          adType: defaults.adType,
        }),
      })
      setConfigs(prev => prev.map(c => c.slotName === slot.slotName ? { ...c, ...defaults } : c))
      toast({ title: 'Reset to defaults', description: slot.label })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="size-7" /> Ad Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all ad slots across the platform. Toggle visibility, update ad unit IDs, and control which ads staff users see.
        </p>
      </div>

      <div className="space-y-4">
        {configs.map(slot => (
          <AdSlotCard
            key={slot.slotName}
            slot={slot}
            saving={saving === slot.slotName}
            onToggle={() => toggleEnabled(slot)}
            onSave={(updates) => handleSave(slot, updates)}
            onReset={() => handleReset(slot)}
          />
        ))}
      </div>

      <Card className="mt-6 border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Eye className="size-4 text-violet-600" /> Ad Visibility Rules
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ads are only shown to <strong>healthcare staff</strong> users (not admins or super admins)</li>
            <li>• Ads do not appear on the login/registration pages</li>
            <li>• Skyscraper appears on extra-large desktop screens (xl+) in the right sidebar</li>
            <li>• Leaderboard (728×90) appears between content sections on desktop</li>
            <li>• Mobile banner (320×50) appears as a sticky bottom bar on mobile (dismissible)</li>
            <li>• Native ads appear in-feed between offer cards on the browse page</li>
            <li>• Disabling a slot here immediately hides it from all staff users</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function AdSlotCard({
  slot,
  saving,
  onToggle,
  onSave,
  onReset,
}: {
  slot: AdConfig
  saving: boolean
  onToggle: () => void
  onSave: (updates: Partial<AdConfig>) => void
  onReset: () => void
}) {
  const [adKey, setAdKey] = useState(slot.adKey || '')
  const [adScriptSrc, setAdScriptSrc] = useState(slot.adScriptSrc || '')
  const [adType, setAdType] = useState(slot.adType || 'atoptions')
  const [customCode, setCustomCode] = useState(slot.customCode || '')

  return (
    <Card className={`border-2 transition-all ${slot.enabled ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium">{slot.label}</span>
              {slot.enabled ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border border-emerald-300">
                  <Eye className="size-2.5 mr-0.5" /> VISIBLE
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 text-[10px] border border-slate-300">
                  <EyeOff className="size-2.5 mr-0.5" /> HIDDEN
                </Badge>
              )}
              {slot.width && slot.height && (
                <Badge variant="outline" className="text-[10px] font-mono">{slot.width}×{slot.height}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] capitalize">{slot.adType}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{SLOT_DESCRIPTIONS[slot.slotName] || ''}</p>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{slot.enabled ? 'On' : 'Off'}</span>
            <Switch checked={slot.enabled} onCheckedChange={onToggle} disabled={saving} />
          </div>
        </div>

        {/* Configuration fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ad Key / Unit ID</Label>
              <Input
                value={adKey}
                onChange={(e) => setAdKey(e.target.value)}
                placeholder="e.g. 435fa794ab27249e1ebebea502a8ebe2"
                className="text-xs font-mono h-8"
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ad Type</Label>
              <Select value={adType} onValueChange={setAdType} disabled={saving}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="atoptions">atOptions (Adsterra iframe)</SelectItem>
                  <SelectItem value="native">Native (container + script)</SelectItem>
                  <SelectItem value="custom">Custom HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Script URL</Label>
            <Input
              value={adScriptSrc}
              onChange={(e) => setAdScriptSrc(e.target.value)}
              placeholder="https://www.highperformanceformat.com/.../invoke.js"
              className="text-xs font-mono h-8"
              disabled={saving}
            />
          </div>

          {adType === 'custom' && (
            <div className="space-y-1">
              <Label className="text-xs">Custom Ad Code (HTML/JS)</Label>
              <Textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="<script>...</script> or any HTML"
                rows={4}
                className="text-xs font-mono"
                disabled={saving}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
              <RotateCcw className="size-3 mr-1" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={() => onSave({ adKey, adScriptSrc, adType, customCode })}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Save className="size-3 mr-1" />}
              Save
            </Button>
          </div>

          {/* Preview link */}
          {slot.enabled && slot.adScriptSrc && (
            <a href={slot.adScriptSrc} target="_blank" rel="noopener" className="text-[10px] text-violet-600 hover:underline flex items-center gap-0.5">
              <ExternalLink className="size-2.5" /> Test script URL
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
