'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Plus, ShieldCheck, Mail } from 'lucide-react'
import { formatDate } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function TeamManagement() {
  const { user, refreshKey } = useApp()
  const { toast } = useToast()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ items: any[] }>('/api/team').then(r => setMembers(r.items)).finally(() => setLoading(false))
  }, [refreshKey])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/team', { method: 'POST', body: JSON.stringify(form) })
      const r = await api<{ items: any[] }>('/api/team')
      setMembers(r.items)
      setDialogOpen(false)
      setForm({ name: '', email: '', password: '' })
      toast({ title: 'Team member added', description: 'They can now sign in with the credentials you set.' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">Manage admins at {user?.hospital?.name}.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="size-4 mr-1" /> Invite admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a team admin</DialogTitle>
              <DialogDescription>They will have full access to {user?.hospital?.name}&apos;s offers and applicants.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="iname">Full name</Label>
                <Input id="iname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iemail">Email</Label>
                <Input id="iemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipw">Temporary password</Label>
                <Input id="ipw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                <p className="text-xs text-muted-foreground">Share this with them — they can change it after signing in.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Adding...' : 'Add admin'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No team members yet</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {members.map(m => (
                <div key={m.id} className="p-4 flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      {m.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      {m.id === user?.id && <Badge variant="outline" className="text-[10px]">You</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="size-3" /> {m.email}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <ShieldCheck className="size-3" /> Admin
                    </div>
                    <div>Added {formatDate(m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
