'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Check, Trash2, MessageSquare, FileWarning, Sparkles, AlertTriangle, Clock, Briefcase } from 'lucide-react'
import { timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  message: { icon: <MessageSquare className="size-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  match: { icon: <Sparkles className="size-4" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  credential_expiry: { icon: <FileWarning className="size-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  application: { icon: <Briefcase className="size-4" />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  application_status: { icon: <Check className="size-4" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
  urgent_shift: { icon: <AlertTriangle className="size-4" />, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  offer_filled: { icon: <Clock className="size-4" />, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

export function Notifications() {
  const { refreshKey } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div></div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'You\u2019re all caught up.'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <Check className="size-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BellOff className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You&apos;ll see updates here as they happen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(n => {
            const meta = TYPE_META[n.type] ?? { icon: <Bell className="size-4" />, color: 'bg-slate-100 text-slate-700' }
            return (
              <Card key={n.id} className={n.read ? 'opacity-70' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{n.title}</span>
                      {!n.read && <span className="size-2 bg-emerald-500 rounded-full shrink-0" />}
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => deleteOne(n.id)}>
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
