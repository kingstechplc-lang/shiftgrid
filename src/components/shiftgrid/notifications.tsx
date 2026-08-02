'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Check, Trash2, MessageSquare, FileWarning, Sparkles, AlertTriangle, Clock, Briefcase, ShieldCheck, Search } from 'lucide-react'
import { timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from './confirm-dialog'

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  message: { icon: <MessageSquare className="size-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', label: 'Messages' },
  match: { icon: <Sparkles className="size-4" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', label: 'Matches' },
  credential_expiry: { icon: <FileWarning className="size-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', label: 'Credentials' },
  application: { icon: <Briefcase className="size-4" />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', label: 'Applications' },
  application_status: { icon: <Check className="size-4" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300', label: 'Status Updates' },
  urgent_shift: { icon: <AlertTriangle className="size-4" />, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', label: 'Urgent Shifts' },
  offer_filled: { icon: <Clock className="size-4" />, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Offer Filled' },
  global_message: { icon: <ShieldCheck className="size-4" />, color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300', label: 'Global Messages' },
}

export function Notifications() {
  const { user, refreshKey } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin'

  useEffect(() => {
    api<{ items: any[]; unreadCount: number }>('/api/notifications').then(r => {
      setItems(r.items)
      setUnreadCount(r.unreadCount)
      setLoading(false)
    })
  }, [refreshKey])

  async function markAllRead() {
    await api('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) })
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    toast({ title: 'All marked as read' })
  }

  async function deleteOne(id: string) {
    await api(`/api/notifications/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(n => n.id !== id))
    setDeleteTarget(null)
  }

  async function clearAll() {
    for (const n of items) {
      await api(`/api/notifications/${n.id}`, { method: 'DELETE' })
    }
    setItems([])
    setUnreadCount(0)
    setClearAllOpen(false)
    toast({ title: 'All notifications cleared' })
  }

  // Get unique types from items for filter dropdown
  const availableTypes = Array.from(new Set(items.map(n => n.type)))

  // Filter items
  const filtered = items.filter(n => {
    if (filter !== 'all' && n.type !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return n.title?.toLowerCase().includes(s) || n.body?.toLowerCase().includes(s)
    }
    return true
  })

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div></div>

  return (
    <div className={`min-h-screen ${isSuperAdmin ? 'bg-gradient-to-br from-violet-50 via-background to-fuchsia-50 dark:from-violet-950/20 dark:via-background dark:to-fuchsia-950/20' : ''}`}>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className={`mb-6 rounded-2xl p-6 ${isSuperAdmin ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 ${isSuperAdmin ? 'text-white' : ''}`}>
                {isSuperAdmin && <ShieldCheck className="size-7" />}
                Notifications
              </h1>
              <p className={`mt-1 text-sm ${isSuperAdmin ? 'text-white/80' : 'text-muted-foreground'}`}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'You\u2019re all caught up.'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant={isSuperAdmin ? 'secondary' : 'outline'} size="sm" onClick={markAllRead} className={isSuperAdmin ? 'bg-white/20 text-white hover:bg-white/30 border-0' : ''}>
                  <Check className="size-4 mr-1" /> Mark all read
                </Button>
              )}
              {items.length > 0 && (
                <Button variant={isSuperAdmin ? 'secondary' : 'outline'} size="sm" onClick={() => setClearAllOpen(true)} className={isSuperAdmin ? 'bg-white/20 text-white hover:bg-white/30 border-0' : ''}>
                  <Trash2 className="size-4 mr-1" /> Clear all
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
            <option value="all">All types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{TYPE_META[t]?.label ?? t}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BellOff className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length === 0 ? 'You\u2019ll see updates here as they happen.' : 'No notifications match your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const meta = TYPE_META[n.type] ?? { icon: <Bell className="size-4" />, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: n.type }
              return (
                <Card key={n.id} className={`hover:shadow-sm transition-all ${!n.read ? 'border-l-4 border-l-emerald-500' : ''} ${n.type === 'global_message' ? 'border-l-4 border-l-fuchsia-500 bg-fuchsia-50/30 dark:bg-fuchsia-950/10' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{n.title}</span>
                        {!n.read && <span className="size-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />}
                        {n.type === 'global_message' && <Badge variant="outline" className="text-[10px] border-fuchsia-400 text-fuchsia-700">GLOBAL</Badge>}
                      </div>
                      {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                      <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setDeleteTarget(n)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete notification?"
        description="This notification will be permanently removed."
        confirmText="Delete"
        variant="danger"
        onConfirm={() => deleteTarget && deleteOne(deleteTarget.id)}
      />

      {/* Clear all confirmation */}
      <ConfirmDialog
        open={clearAllOpen}
        onOpenChange={setClearAllOpen}
        title="Clear all notifications?"
        description={`This will permanently delete all ${items.length} notifications. This cannot be undone.`}
        confirmText="Clear all"
        variant="danger"
        requireCheckbox
        checkboxLabel="I understand all notifications will be deleted"
        onConfirm={clearAll}
      />
    </div>
  )
}
