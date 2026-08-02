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
import { ImagePlus, Trash2, Calendar, ExternalLink, Loader2, Plus } from 'lucide-react'
import { ImageUploader } from './image-uploader'
import { ConfirmDialog } from './confirm-dialog'
import { useToast } from '@/hooks/use-toast'

type Banner = {
  id: string
  title: string
  desktopImageUrl: string | null
  mobileImageUrl: string | null
  targetUrl: string | null
  isActive: boolean
  displayOrder: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export function AdminBanners() {
  const { toast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [newBanner, setNewBanner] = useState({
    title: '',
    desktopImageUrl: '',
    mobileImageUrl: '',
    targetUrl: '',
    displayOrder: 0,
    startDate: '',
    endDate: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api<{ items: Banner[] }>('/api/banners?all=true').then(r => setBanners(r.items)).finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newBanner.title) {
      toast({ variant: 'destructive', title: 'Title required' })
      return
    }
    setCreating(true)
    try {
      const res = await api<{ banner: Banner }>('/api/banners', {
        method: 'POST',
        body: JSON.stringify({
          ...newBanner,
          startDate: newBanner.startDate || undefined,
          endDate: newBanner.endDate || undefined,
        }),
      })
      setBanners(prev => [...prev, res.banner])
      setNewBanner({ title: '', desktopImageUrl: '', mobileImageUrl: '', targetUrl: '', displayOrder: 0, startDate: '', endDate: '' })
      setShowCreate(false)
      toast({ title: 'Banner created' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(b: Banner) {
    try {
      const res = await api<{ banner: Banner }>(`/api/banners/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !b.isActive }),
      })
      setBanners(prev => prev.map(x => x.id === b.id ? res.banner : x))
      toast({ title: b.isActive ? 'Banner disabled' : 'Banner enabled' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api(`/api/banners/${deleteTarget.id}?confirm=yes`, { method: 'DELETE' })
      setBanners(prev => prev.filter(x => x.id !== deleteTarget.id))
      toast({ title: 'Banner deleted' })
      setDeleteTarget(null)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message })
    }
  }

  function getBannerStatus(b: Banner): { label: string; color: string } {
    const now = new Date()
    if (!b.isActive) return { label: 'INACTIVE', color: 'bg-slate-100 text-slate-600' }
    if (b.startDate && new Date(b.startDate) > now) return { label: 'SCHEDULED', color: 'bg-blue-100 text-blue-700' }
    if (b.endDate && new Date(b.endDate) < now) return { label: 'EXPIRED', color: 'bg-rose-100 text-rose-700' }
    return { label: 'ACTIVE', color: 'bg-emerald-100 text-emerald-700' }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ImagePlus className="size-7" /> Platform Banners
          </h1>
          <p className="text-muted-foreground mt-1">Manage homepage hero banners for desktop and mobile.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="size-4 mr-1" /> New Banner
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6 border-2 border-violet-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader><CardTitle className="text-base">Create New Banner</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btitle">Title <span className="text-rose-500">*</span></Label>
              <Input id="btitle" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="e.g. Emergency Recruitment Drive" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Desktop Banner (1920×700)</Label>
                <ImageUploader
                  type="hero_desktop"
                  currentUrl={newBanner.desktopImageUrl}
                  onUploaded={(url) => setNewBanner({ ...newBanner, desktopImageUrl: url })}
                  uploadEndpoint="/api/upload/image"
                  altText="Desktop banner"
                  shape="wide"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Mobile Banner (1080×600)</Label>
                <ImageUploader
                  type="hero_mobile"
                  currentUrl={newBanner.mobileImageUrl}
                  onUploaded={(url) => setNewBanner({ ...newBanner, mobileImageUrl: url })}
                  uploadEndpoint="/api/upload/image"
                  altText="Mobile banner"
                  shape="wide"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="burl">Target URL (optional)</Label>
                <Input id="burl" value={newBanner.targetUrl} onChange={(e) => setNewBanner({ ...newBanner, targetUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="border">Display Order</Label>
                <Input id="border" type="number" value={newBanner.displayOrder} onChange={(e) => setNewBanner({ ...newBanner, displayOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bstart">Start Date (optional)</Label>
                <Input id="bstart" type="datetime-local" value={newBanner.startDate} onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bend">End Date (optional)</Label>
                <Input id="bend" type="datetime-local" value={newBanner.endDate} onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-violet-600 hover:bg-violet-700">
                {creating ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Create Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImagePlus className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">No banners yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Create your first platform banner.</p>
            </CardContent>
          </Card>
        ) : (
          banners.map(b => {
            const status = getBannerStatus(b)
            return (
              <Card key={b.id} className={`border-2 ${b.isActive ? 'border-emerald-200' : 'border-slate-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="size-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      {b.desktopImageUrl ? (
                        <img src={b.desktopImageUrl} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">{b.title}</span>
                        <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">Order: {b.displayOrder}</Badge>
                      </div>
                      {b.targetUrl && (
                        <a href={b.targetUrl} target="_blank" rel="noopener" className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mb-1">
                          <ExternalLink className="size-3" /> {b.targetUrl}
                        </a>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {b.startDate && <span className="flex items-center gap-1"><Calendar className="size-3" /> Start: {new Date(b.startDate).toLocaleDateString()}</span>}
                        {b.endDate && <span className="flex items-center gap-1"><Calendar className="size-3" /> End: {new Date(b.endDate).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Switch checked={b.isActive} onCheckedChange={() => toggleActive(b)} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)} className="text-rose-600">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete banner?"
        description={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmText="Delete"
        variant="danger"
        requireCheckbox
        checkboxLabel="I confirm I want to delete this banner"
        onConfirm={handleDelete}
      />
    </div>
  )
}
