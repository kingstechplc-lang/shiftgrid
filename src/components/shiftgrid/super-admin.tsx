'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Users, Briefcase, Inbox, ShieldCheck, Clock, TrendingUp, Search, CheckCircle2, XCircle, Ban, PauseCircle, PlayCircle, Eye, Trash2, Loader2, Globe } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function SuperAdminDashboard() {
  const { refreshKey } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/super/stats').then(setData).finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>
  if (!data) return null

  const s = data.stats

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 text-white p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-0 right-0 size-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="size-5" />
            <span className="text-sm font-medium text-white/80">Super Admin</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-white/80 text-sm mt-1">Manage all hospitals, users, and offers across ShiftGrid.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <SuperStatCard icon={<Building2 className="size-5" />} label="Hospitals" value={s.hospitals} sub={`${s.pendingHospitals} pending`} accent="violet" />
        <SuperStatCard icon={<Users className="size-5" />} label="Total users" value={s.users} sub={`${s.staffUsers} staff, ${s.adminUsers} admins`} accent="emerald" />
        <SuperStatCard icon={<Briefcase className="size-5" />} label="Total offers" value={s.offers} sub={`${s.publishedOffers} published`} accent="teal" />
        <SuperStatCard icon={<Inbox className="size-5" />} label="Applications" value={s.applications} sub={`${s.filledRoles} filled`} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="size-4 text-violet-600" /> Offer Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><span className="size-3 rounded-full bg-teal-500" /> Locum (temporary)</span>
              <span className="font-bold">{s.locumOffers}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${s.offers ? (s.locumOffers / s.offers) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2"><span className="size-3 rounded-full bg-violet-500" /> Permanent</span>
              <span className="font-bold">{s.permanentOffers}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${s.offers ? (s.permanentOffers / s.offers) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="size-4 text-amber-600" /> Pending Hospital Verifications</CardTitle></CardHeader>
          <CardContent>
            {s.pendingHospitals === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All hospitals verified ✅</p>
            ) : (
              <div className="text-center py-2">
                <div className="text-3xl font-bold text-amber-600">{s.pendingHospitals}</div>
                <p className="text-xs text-muted-foreground mt-1">hospitals awaiting verification</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.recentHospitals?.length > 0 && (
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardHeader><CardTitle className="text-base">Recent Hospitals</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentHospitals.map((h: any) => (
                <div key={h.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {h.logoUrl ? (
                      <img src={h.logoUrl} alt="Hospital logo" className="size-10 rounded-lg object-cover" />
                    ) : (
                      <Avatar className="size-10"><AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{h.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{h.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{h.address || 'No address'} · {h._count.offers} offers · {h._count.members} admins</div>
                    </div>
                  </div>
                  <StatusBadges status={h.status} verified={h.verified} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentUsers?.length > 0 && (
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <CardHeader><CardTitle className="text-base">Recent User Signups</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentUsers.map((u: any) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.profilePhoto ? (
                      <img src={u.profilePhoto} alt={u.name} className="size-9 rounded-full object-cover" />
                    ) : (
                      <Avatar className="size-9"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{u.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email} · {u.hospital?.name || u.specialty || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.registrationId && <Badge variant="outline" className="text-[10px] font-mono">{u.registrationId}</Badge>}
                    <Badge variant="outline" className="text-[10px] capitalize">{u.role.replace('_', ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
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

function SuperStatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: number; sub: string; accent: string }) {
  const accentClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  }
  return (
    <Card className="hover:shadow-md hover:border-violet-200 transition-all duration-300 hover:scale-[1.02] border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`size-9 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>{icon}</div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}

// Status badges component — shows banned/suspended/verified prominently
function StatusBadges({ status, verified }: { status: string; verified?: boolean }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {status === 'banned' && (
        <Badge className="bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-semibold">
          <Ban className="size-3 mr-1" /> BANNED
        </Badge>
      )}
      {status === 'suspended' && (
        <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-semibold">
          <PauseCircle className="size-3 mr-1" /> SUSPENDED
        </Badge>
      )}
      {verified === true && (
        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]"><CheckCircle2 className="size-3 mr-1" /> Verified</Badge>
      )}
      {verified === false && (
        <Badge variant="outline" className="border-amber-400 text-amber-700 text-[10px]"><Clock className="size-3 mr-1" /> Pending</Badge>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Hospitals management (with filters + preview + ban/suspend)
// ─────────────────────────────────────────────────────────────────────────────

export function SuperHospitals() {
  const { refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewHospital, setPreviewHospital] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (verifiedFilter) params.set('verified', verifiedFilter)
    api<{ items: any[] }>(`/api/super/hospitals?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey, statusFilter, verifiedFilter])

  async function toggleVerify(h: any) {
    try {
      await api('/api/super/hospitals', { method: 'PATCH', body: JSON.stringify({ id: h.id, verified: !h.verified }) })
      setItems(prev => prev.map(x => x.id === h.id ? { ...x, verified: !x.verified } : x))
      toast({ title: h.verified ? 'Hospital unverified' : 'Hospital verified', description: h.name })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function changeStatus(h: any, status: 'active' | 'suspended' | 'banned') {
    try {
      await api(`/api/super/hospitals/${h.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setItems(prev => prev.map(x => x.id === h.id ? { ...x, status } : x))
      toast({ title: `Hospital ${status}`, description: h.name })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handlePreview(h: any) {
    try {
      const res = await api<{ hospital: any }>(`/api/super/hospitals/${h.id}`)
      setPreviewHospital(res.hospital)
      setPreviewOpen(true)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to load', description: e.message })
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !deleteConfirm) return
    setDeleteLoading(true)
    try {
      await api(`/api/super/hospitals/${deleteTarget.id}?confirm=yes`, { method: 'DELETE' })
      setItems(prev => prev.filter(x => x.id !== deleteTarget.id))
      toast({ title: 'Hospital deleted', description: deleteTarget.name })
      setDeleteTarget(null)
      setDeleteConfirm(false)
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Hospitals</h1>
        <p className="text-muted-foreground mt-1">{items.length} hospitals on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
          <option value="">All (verified + unverified)</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
      </div>

      <div className="space-y-3">
        {items.map(h => (
          <Card key={h.id} className={`border-2 hover:shadow-md transition-all ${h.status === 'banned' ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10' : h.status === 'suspended' ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              {h.logoUrl ? (
                <img src={h.logoUrl} alt="Hospital logo" className="size-14 rounded-xl object-cover" />
              ) : (
                <Avatar className="size-14"><AvatarFallback className="bg-violet-100 text-violet-700">{h.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{h.name}</span>
                  <StatusBadges status={h.status} verified={h.verified} />
                </div>
                <div className="text-xs text-muted-foreground truncate">{h.address || 'No address'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{h._count.offers} offers · {h._count.members} admins · Joined {formatDate(h.createdAt)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handlePreview(h)} title="Preview details">
                  <Eye className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleVerify(h)} title={h.verified ? 'Unverify' : 'Verify'}>
                  {h.verified ? <XCircle className="size-4 text-amber-600" /> : <CheckCircle2 className="size-4 text-emerald-600" />}
                </Button>
                {h.status === 'active' ? (
                  <Button variant="ghost" size="sm" onClick={() => changeStatus(h, 'suspended')} title="Suspend">
                    <PauseCircle className="size-4 text-amber-600" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => changeStatus(h, 'active')} title="Activate">
                    <PlayCircle className="size-4 text-emerald-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => changeStatus(h, h.status === 'banned' ? 'active' : 'banned')} title={h.status === 'banned' ? 'Unban' : 'Ban'}>
                  <Ban className={`size-4 ${h.status === 'banned' ? 'text-rose-600' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(h); setDeleteConfirm(false) }} title="Delete">
                  <Trash2 className="size-4 text-rose-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewHospital?.logoUrl && <img src={previewHospital.logoUrl} alt="Hospital logo" className="size-8 rounded-lg" />}
              {previewHospital?.name}
            </DialogTitle>
          </DialogHeader>
          {previewHospital && (
            <div className="space-y-4">
              {previewHospital.bannerUrl && (
                <img src={previewHospital.bannerUrl} alt="Hospital banner" className="w-full h-32 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <StatusBadges status={previewHospital.status} /></div>
                <div><span className="text-muted-foreground">Verified:</span> {previewHospital.verified ? '✅ Yes' : '⏳ Pending'}</div>
                <div><span className="text-muted-foreground">Address:</span> {previewHospital.address || '—'}</div>
                <div><span className="text-muted-foreground">Website:</span> {previewHospital.website ? <a href={previewHospital.website} target="_blank" rel="noopener" className="text-emerald-600 hover:underline">{previewHospital.website}</a> : '—'}</div>
                <div><span className="text-muted-foreground">Joined:</span> {formatDate(previewHospital.createdAt)}</div>
                <div><span className="text-muted-foreground">Offers:</span> {previewHospital._count?.offers ?? 0}</div>
              </div>
              {previewHospital.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{previewHospital.description}</p>
                </div>
              )}
              {previewHospital.members?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Team Members ({previewHospital.members.length})</h4>
                  <div className="space-y-2">
                    {previewHospital.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        {m.profilePhoto ? <img src={m.profilePhoto} alt={m.name} className="size-7 rounded-full" /> : <Avatar className="size-7"><AvatarFallback className="text-xs">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>}
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground text-xs">{m.email}</span>
                        <StatusBadges status={m.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewHospital.offers?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Offers ({previewHospital.offers.length})</h4>
                  <div className="space-y-1">
                    {previewHospital.offers.slice(0, 5).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between text-sm py-1 border-b">
                        <span className="truncate">{o.title}</span>
                        <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog with checkbox */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="size-5" /> Delete Hospital
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Are you absolutely sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
            <p className="text-sm text-muted-foreground">This will permanently delete the hospital, all its offers, and all applications. This action CANNOT be undone.</p>
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/20">
              <Checkbox checked={deleteConfirm} onCheckedChange={(v) => setDeleteConfirm(v === true)} />
              <span className="text-sm font-medium">I understand this action is irreversible and confirm I want to delete this hospital.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm(false) }}>Cancel</Button>
            <Button variant="destructive" disabled={!deleteConfirm || deleteLoading} onClick={handleDelete}>
              {deleteLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Users management (with filters + role change + ban/suspend)
// ─────────────────────────────────────────────────────────────────────────────

export function SuperUsers() {
  const { refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [manageUser, setManageUser] = useState<any>(null)
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const PAGE_SIZE = 15

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    api<{ items: any[] }>(`/api/super/users?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey, q, roleFilter, statusFilter])

  async function changeStatus(u: any, status: 'active' | 'suspended' | 'banned') {
    try {
      await api(`/api/super/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, status } : x))
      toast({ title: `User ${status}`, description: u.name })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handleManageSave() {
    if (!manageUser) return
    try {
      const data: any = {}
      if (newRole && newRole !== manageUser.role) data.role = newRole
      if (newPassword) data.newPassword = newPassword
      if (Object.keys(data).length === 0) {
        toast({ title: 'No changes to save' })
        return
      }
      await api(`/api/super/users/${manageUser.id}`, { method: 'PATCH', body: JSON.stringify(data) })
      setItems(prev => prev.map(x => x.id === manageUser.id ? { ...x, role: newRole || x.role } : x))
      toast({ title: 'User updated', description: manageUser.name })
      setManageUser(null)
      setNewRole('')
      setNewPassword('')
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget || !deleteConfirm) return
    try {
      await api(`/api/super/users/${deleteTarget.id}?confirm=yes`, { method: 'DELETE' })
      setItems(prev => prev.filter(x => x.id !== deleteTarget.id))
      toast({ title: 'User deleted', description: deleteTarget.name })
      setDeleteTarget(null)
      setDeleteConfirm(false)
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message })
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">{items.length} users on the platform.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or registration ID..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="border rounded-lg px-3 text-sm">
          <option value="">All roles</option>
          <option value="staff">Staff</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded-lg px-3 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="space-y-2">
        {paginatedItems.map(u => (
          <Card key={u.id} className={`border-2 hover:shadow-sm transition-all ${u.status === 'banned' ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10' : u.status === 'suspended' ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
            <CardContent className="p-3 flex items-center gap-3">
              {u.profilePhoto ? (
                <img src={u.profilePhoto} alt={u.name} className="size-10 rounded-full object-cover" />
              ) : (
                <Avatar className="size-10"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{u.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{u.name}</span>
                  <StatusBadges status={u.status} verified={!!u.emailVerified} />
                  {u.registrationId && <Badge variant="outline" className="text-[10px] font-mono">{u.registrationId}</Badge>}
                  <Badge variant="outline" className="text-[10px] capitalize">{u.role.replace('_', ' ')}</Badge>
                  {u.authProvider === 'google' && <Badge variant="outline" className="text-[10px]">Google</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.email} · {u.hospital?.name || u.specialty || '—'}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => { setManageUser(u); setNewRole(u.role); setNewPassword('') }} title="Manage role / password">
                  <ShieldCheck className="size-4" />
                </Button>
                {u.status === 'active' ? (
                  <Button variant="ghost" size="sm" onClick={() => changeStatus(u, 'suspended')} title="Suspend">
                    <PauseCircle className="size-4 text-amber-600" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => changeStatus(u, 'active')} title="Activate">
                    <PlayCircle className="size-4 text-emerald-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => changeStatus(u, u.status === 'banned' ? 'active' : 'banned')} title={u.status === 'banned' ? 'Unban' : 'Ban'}>
                  <Ban className={`size-4 ${u.status === 'banned' ? 'text-rose-600' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(u); setDeleteConfirm(false) }} title="Delete">
                  <Trash2 className="size-4 text-rose-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-3 text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Manage User Dialog */}
      <Dialog open={!!manageUser} onOpenChange={(open) => { if (!open) { setManageUser(null); setNewPassword('') } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage User — {manageUser?.name}</DialogTitle></DialogHeader>
          {manageUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                {manageUser.profilePhoto ? <img src={manageUser.profilePhoto} alt={manageUser.name} className="size-12 rounded-full" /> : <Avatar className="size-12"><AvatarFallback>{manageUser.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>}
                <div>
                  <div className="font-medium">{manageUser.name}</div>
                  <div className="text-xs text-muted-foreground">{manageUser.email}</div>
                  {manageUser.registrationId && <div className="text-xs font-mono text-emerald-600">{manageUser.registrationId}</div>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff (healthcare professional)</SelectItem>
                    <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reset Password (optional)</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" minLength={6} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setManageUser(null); setNewPassword('') }}>Cancel</Button>
            <Button onClick={handleManageSave} className="bg-violet-600 hover:bg-violet-700">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog with checkbox */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm(false) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><Trash2 className="size-5" /> Delete User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Are you absolutely sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?</p>
            <p className="text-sm text-muted-foreground">This will permanently delete the user and all their data. This action CANNOT be undone.</p>
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/20">
              <Checkbox checked={deleteConfirm} onCheckedChange={(v) => setDeleteConfirm(v === true)} />
              <span className="text-sm font-medium">I confirm I want to permanently delete this user.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm(false) }}>Cancel</Button>
            <Button variant="destructive" disabled={!deleteConfirm} onClick={handleDeleteUser}>
              <Trash2 className="size-4 mr-2" /> Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Offers management (with ban/close/delete + search + pagination)
// ─────────────────────────────────────────────────────────────────────────────

export function SuperOffers() {
  const { refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const PAGE_SIZE = 15

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (q) params.set('q', q)
    api<{ items: any[] }>(`/api/super/offers?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey, statusFilter, q])

  async function changeOfferStatus(o: any, status: 'closed' | 'draft' | 'published') {
    try {
      await api(`/api/super/offers/${o.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setItems(prev => prev.map(x => x.id === o.id ? { ...x, status } : x))
      toast({ title: `Offer ${status}`, description: o.title })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handleDeleteOffer() {
    if (!deleteTarget || !deleteConfirm) return
    try {
      await api(`/api/super/offers/${deleteTarget.id}?confirm=yes`, { method: 'DELETE' })
      setItems(prev => prev.filter(x => x.id !== deleteTarget.id))
      toast({ title: 'Offer deleted', description: deleteTarget.title })
      setDeleteTarget(null)
      setDeleteConfirm(false)
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message })
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Offers</h1>
        <p className="text-muted-foreground mt-1">{items.length} offers across all hospitals.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search offers..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border rounded-lg px-3 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="filled">Filled</option>
          <option value="closed">Closed (banned)</option>
        </select>
      </div>

      <div className="space-y-2">
        {paginatedItems.map(o => (
          <Card key={o.id} className={`border-2 hover:shadow-sm transition-all ${o.status === 'closed' ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
            <CardContent className="p-3 flex items-center gap-3">
              {o.hospital?.logoUrl ? (
                <img src={o.hospital.logoUrl} alt="Hospital logo" className="size-10 rounded-lg object-cover" />
              ) : (
                <Avatar className="size-10"><AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{o.hospital?.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{o.title}</span>
                  {o.urgent && <Badge className="bg-rose-500 text-white text-[10px]">Urgent</Badge>}
                  <Badge variant="outline" className="text-[10px] capitalize">{o.type}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${o.status === 'published' ? 'border-emerald-300 text-emerald-700' : o.status === 'filled' ? 'border-teal-300 text-teal-700' : o.status === 'closed' ? 'border-rose-400 text-rose-600' : ''}`}>{o.status === 'closed' ? 'BANNED' : o.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{o.hospital?.name} · {o.specialty || '—'} · {o._count.applications} applicants · {timeAgo(o.createdAt)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {o.status === 'closed' ? (
                  <Button variant="ghost" size="sm" onClick={() => changeOfferStatus(o, 'published')} title="Restore (republish)">
                    <PlayCircle className="size-4 text-emerald-600" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => changeOfferStatus(o, 'closed')} title="Ban (close offer)">
                    <Ban className="size-4 text-rose-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(o); setDeleteConfirm(false) }} title="Delete">
                  <Trash2 className="size-4 text-rose-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-3 text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Delete Offer Dialog with checkbox */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirm(false) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><Trash2 className="size-5" /> Delete Offer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Delete <strong>{deleteTarget?.title}</strong>?</p>
            <p className="text-sm text-muted-foreground">This permanently removes the offer and all its applications. Cannot be undone.</p>
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/20">
              <Checkbox checked={deleteConfirm} onCheckedChange={(v) => setDeleteConfirm(v === true)} />
              <span className="text-sm font-medium">I confirm I want to permanently delete this offer.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm(false) }}>Cancel</Button>
            <Button variant="destructive" disabled={!deleteConfirm} onClick={handleDeleteOffer}>
              <Trash2 className="size-4 mr-2" /> Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
