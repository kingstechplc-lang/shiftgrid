'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Search, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const TYPE_LABELS: Record<string, string> = {
  profile_photo: 'Profile Photos',
  cover_photo: 'Cover Photos',
  facility_logo: 'Facility Logos',
  facility_cover: 'Facility Covers',
  shift_banner: 'Shift Banners',
  hero_desktop: 'Hero Banners (Desktop)',
  hero_mobile: 'Hero Banners (Mobile)',
  announcement: 'Announcements',
  document: 'Documents',
  other: 'Other',
}

export function MediaLibrary() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('type', filter)
    api<{ items: any[] }>(`/api/media?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [filter])

  const filtered = search
    ? items.filter(i => i.type?.toLowerCase().includes(search.toLowerCase()))
    : items

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ImageIcon className="size-7" /> Media Library
        </h1>
        <p className="text-muted-foreground mt-1">{items.length} media assets on the platform.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
          <option value="all">All</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No media found</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload images to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="border-2 hover:shadow-md transition-all overflow-hidden">
              <div className="aspect-square bg-muted overflow-hidden">
                <img src={item.url} alt={item.type} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <CardContent className="p-2">
                <Badge variant="outline" className="text-[10px] mb-1">{TYPE_LABELS[item.type] ?? item.type}</Badge>
                <div className="text-[10px] text-muted-foreground">
                  {item.width}×{item.height} · {(item.fileSize / 1024).toFixed(0)}KB
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  by {item.uploader?.name ?? 'Unknown'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
