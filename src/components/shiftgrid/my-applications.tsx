'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, MapPin, MessageSquare, Calendar, ArrowRight, Inbox } from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, statusColor, labelize, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const STAGES = ['applied', 'under_review', 'shortlisted', 'offered', 'accepted', 'declined', 'withdrawn'] as const

export function MyApplications() {
  const { openOffer, openConversation, refreshKey } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api<{ items: any[] }>('/api/applications?mine=true').then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey])

  async function withdraw(app: any) {
    if (!confirm('Withdraw this application?')) return
    try {
      await api(`/api/applications/${app.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'withdrawn' }) })
      setItems(prev => prev.map(a => a.id === app.id ? { ...a, status: 'withdrawn' } : a))
      toast({ title: 'Application withdrawn' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  const visible = filter === 'all' ? items : items.filter(a => a.status === filter)

  // Stage counts
  const counts: Record<string, number> = {}
  for (const a of items) counts[a.status] = (counts[a.status] ?? 0) + 1

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-40" />)}</div></div>

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My applications</h1>
        <p className="text-muted-foreground mt-1">Track the status of every offer you&apos;ve applied to.</p>
      </div>

      {/* Stage chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All ({items.length})
        </button>
        {STAGES.map(stage => (
          <button
            key={stage}
            onClick={() => setFilter(stage)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === stage ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {labelize(stage)} ({counts[stage] ?? 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Inbox className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">No applications here</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {items.length === 0 ? 'You haven\u2019t applied to any offers yet.' : 'No applications match this filter.'}
          </p>
          {items.length === 0 && (
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => useApp.getState().setView('browse')}>
              Browse offers <ArrowRight className="size-4 ml-1" />
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map(app => (
            <Card key={app.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge className={statusColor(app.status)}>{labelize(app.status)}</Badge>
                  <span className="text-xs text-muted-foreground">Applied {timeAgo(app.appliedAt)}</span>
                </div>
                <button onClick={() => openOffer(app.offer.id)} className="text-left w-full">
                  <h3 className="font-semibold text-base leading-tight mb-1 hover:text-emerald-700 line-clamp-2">{app.offer.title}</h3>
                  {app.offer.specialty && <p className="text-sm text-muted-foreground mb-2">{app.offer.specialty}</p>}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <Building2 className="size-3.5" />
                    <span className="truncate">{app.offer.hospital?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {app.offer.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="size-3" />
                        {app.offer.location.split(',')[0]}
                      </span>
                    )}
                    {app.offer.type === 'locum' ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDateTime(app.offer.shiftStart)}
                      </span>
                    ) : (
                      app.offer.salaryMin != null && <span className="font-medium text-emerald-700">{formatCurrency(app.offer.salaryMin)}–{formatCurrency(app.offer.salaryMax)}</span>
                    )}
                  </div>
                </button>

                {app.coverNote && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground italic line-clamp-2">
                    &ldquo;{app.coverNote}&rdquo;
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openConversation(app.offer.createdById, app.offer.id)}>
                    <MessageSquare className="size-3.5 mr-1" /> Message
                  </Button>
                  {app.status !== 'withdrawn' && app.status !== 'accepted' && app.status !== 'declined' && (
                    <Button variant="outline" size="sm" onClick={() => withdraw(app)}>Withdraw</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
