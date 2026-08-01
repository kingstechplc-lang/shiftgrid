'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, Copy, Pencil, Pause, Play, X, FileDown, ChevronRight } from 'lucide-react'
import { formatDateTime, formatDate, statusColor, labelize, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const STATUSES = ['all', 'draft', 'published', 'closed', 'filled']

export function AdminOffersList() {
  const { openOfferEdit, openOfferDetail, refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('mine', 'true')
    if (q) params.set('q', q)
    if (status !== 'all') params.set('status', status)
    if (type !== 'all') params.set('type', type)
    params.set('pageSize', '100')
    api<{ items: any[] }>(`/api/offers?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [q, status, type, refreshKey])

  async function handleAction(o: any, action: 'publish' | 'pause' | 'close' | 'duplicate' | 'delete') {
    try {
      if (action === 'duplicate') {
        await api(`/api/offers/${o.id}/duplicate`, { method: 'POST' })
        toast({ title: 'Offer duplicated', description: 'A draft copy was created.' })
      } else if (action === 'delete') {
        if (!confirm(`Permanently delete "${o.title}"? This cannot be undone.`)) return
        await api(`/api/offers/${o.id}`, { method: 'DELETE' })
        toast({ title: 'Offer deleted' })
      } else {
        const newStatus = action === 'publish' ? 'published' : action === 'pause' ? 'draft' : 'closed'
        await api(`/api/offers/${o.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
        toast({ title: `Offer ${labelize(newStatus)}` })
      }
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message })
    }
  }

  function exportCsv() {
    if (items.length === 0) return
    const rows = [
      ['Title', 'Type', 'Specialty', 'Status', 'Urgent', 'Rate', 'Salary Min', 'Salary Max', 'Location', 'Applicants', 'Created'],
      ...items.map(o => [
        o.title, o.type, o.specialty ?? '', o.status, o.urgent ? 'Yes' : 'No',
        o.rate ?? '', o.salaryMin ?? '', o.salaryMax ?? '',
        o.location ?? '', o._count?.applications ?? 0,
        formatDate(o.createdAt),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `offers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div></div>

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Offers</h1>
          <p className="text-muted-foreground mt-1">{items.length} offer{items.length === 1 ? '' : 's'} across all statuses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={items.length === 0}>
            <FileDown className="size-4 mr-1" /> Export CSV
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openOfferEdit(null)}>
            <Plus className="size-4 mr-1" /> New offer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search offers..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="locum">Locum</SelectItem>
            <SelectItem value="permanent">Permanent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : labelize(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Plus className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No offers yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Post your first locum or permanent offer to start receiving applicants.</p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => openOfferEdit(null)}>
              <Plus className="size-4 mr-1" /> Create offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map(o => (
                <div key={o.id} className="p-4 flex items-center gap-3 hover:bg-muted/50">
                  <button onClick={() => openOfferDetail(o.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm truncate">{o.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{o.type}</Badge>
                      {o.urgent && <Badge className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white">Urgent</Badge>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>{labelize(o.status)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      {o.specialty && <span>{o.specialty}</span>}
                      <span>{o._count?.applications ?? 0} applicant{(o._count?.applications ?? 0) === 1 ? '' : 's'}</span>
                      <span>Updated {timeAgo(o.updatedAt)}</span>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openOfferDetail(o.id)}>
                        <ChevronRight className="size-4 mr-2" /> View & manage applicants
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openOfferEdit(o)}>
                        <Pencil className="size-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(o, 'duplicate')}>
                        <Copy className="size-4 mr-2" /> Duplicate as template
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {o.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleAction(o, 'publish')}>
                          <Play className="size-4 mr-2" /> Publish
                        </DropdownMenuItem>
                      )}
                      {o.status === 'published' && (
                        <DropdownMenuItem onClick={() => handleAction(o, 'pause')}>
                          <Pause className="size-4 mr-2" /> Pause (back to draft)
                        </DropdownMenuItem>
                      )}
                      {(o.status === 'published' || o.status === 'draft') && (
                        <DropdownMenuItem onClick={() => handleAction(o, 'close')} className="text-rose-600">
                          <X className="size-4 mr-2" /> Close
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleAction(o, 'delete')} className="text-rose-600">
                        <X className="size-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
