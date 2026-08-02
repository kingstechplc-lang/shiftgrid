'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Building2, Users, Briefcase, Inbox, ShieldCheck, Clock, TrendingUp, Search, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function SuperAdminDashboard() {
  const { refreshKey } = useApp()
  const { toast } = useToast()
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
      {/* Hero */}
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <SuperStatCard icon={<Building2 className="size-5" />} label="Hospitals" value={s.hospitals} sub={`${s.pendingHospitals} pending`} accent="violet" />
        <SuperStatCard icon={<Users className="size-5" />} label="Total users" value={s.users} sub={`${s.staffUsers} staff, ${s.adminUsers} admins`} accent="emerald" />
        <SuperStatCard icon={<Briefcase className="size-5" />} label="Total offers" value={s.offers} sub={`${s.publishedOffers} published`} accent="teal" />
        <SuperStatCard icon={<Inbox className="size-5" />} label="Applications" value={s.applications} sub={`${s.filledRoles} filled`} accent="amber" />
      </div>

      {/* Offer type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="size-4 text-violet-600" /> Offer Distribution</CardTitle>
          </CardHeader>
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

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="size-4 text-amber-600" /> Pending Hospital Verifications</CardTitle>
          </CardHeader>
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

      {/* Recent hospitals */}
      {data.recentHospitals?.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardHeader><CardTitle className="text-base">Recent Hospitals</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentHospitals.map((h: any) => (
                <div key={h.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {h.logoUrl ? (
                      <img src={h.logoUrl} alt="" className="size-10 rounded-lg object-cover" />
                    ) : (
                      <Avatar className="size-10"><AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{h.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{h.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{h.address || 'No address'} · {h._count.offers} offers · {h._count.members} admins</div>
                    </div>
                  </div>
                  {h.verified ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]"><CheckCircle2 className="size-3 mr-1" /> Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 text-[10px]"><Clock className="size-3 mr-1" /> Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent users */}
      {data.recentUsers?.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <CardHeader><CardTitle className="text-base">Recent User Signups</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentUsers.map((u: any) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.profilePhoto ? (
                      <img src={u.profilePhoto} alt="" className="size-9 rounded-full object-cover" />
                    ) : (
                      <Avatar className="size-9"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{u.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email} · {u.hospital?.name || u.specialty || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Hospitals management
// ─────────────────────────────────────────────────────────────────────────────

export function SuperHospitals() {
  const { refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ items: any[] }>('/api/super/hospitals').then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey])

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

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Hospitals</h1>
        <p className="text-muted-foreground mt-1">{items.length} hospitals on the platform.</p>
      </div>
      <div className="space-y-3">
        {items.map(h => (
          <Card key={h.id} className="border-2 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              {h.logoUrl ? (
                <img src={h.logoUrl} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <Avatar className="size-14"><AvatarFallback className="bg-violet-100 text-violet-700">{h.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{h.name}</span>
                  {h.verified ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]"><CheckCircle2 className="size-3 mr-1" /> Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 text-[10px]"><Clock className="size-3 mr-1" /> Pending</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{h.address || 'No address'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{h._count.offers} offers · {h._count.members} admins · Joined {formatDate(h.createdAt)}</div>
              </div>
              <Button variant={h.verified ? 'outline' : 'default'} size="sm" onClick={() => toggleVerify(h)} className={h.verified ? 'text-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}>
                {h.verified ? <><XCircle className="size-4 mr-1" /> Unverify</> : <><CheckCircle2 className="size-4 mr-1" /> Verify</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Users management
// ─────────────────────────────────────────────────────────────────────────────

export function SuperUsers() {
  const { refreshKey } = useApp()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (roleFilter) params.set('role', roleFilter)
    api<{ items: any[] }>(`/api/super/users?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey, q, roleFilter])

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">{items.length} users on the platform.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
          <option value="">All roles</option>
          <option value="staff">Staff</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="space-y-2">
        {items.map(u => (
          <Card key={u.id} className="border-2 hover:shadow-sm transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              {u.profilePhoto ? (
                <img src={u.profilePhoto} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <Avatar className="size-10"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{u.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{u.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{u.role.replace('_', ' ')}</Badge>
                  {u.authProvider === 'google' && <Badge variant="outline" className="text-[10px]">Google</Badge>}
                  {u.emailVerified ? <CheckCircle2 className="size-3 text-emerald-600" /> : <Clock className="size-3 text-amber-500" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.email} · {u.hospital?.name || u.specialty || '—'}</div>
              </div>
              <div className="text-xs text-muted-foreground text-right shrink-0">
                <div>{u._count.applications} apps</div>
                <div>{u._count.offersCreated} offers</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin — Offers management
// ─────────────────────────────────────────────────────────────────────────────

export function SuperOffers() {
  const { refreshKey } = useApp()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    api<{ items: any[] }>(`/api/super/offers?${params}`).then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey, statusFilter])

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Offers</h1>
        <p className="text-muted-foreground mt-1">{items.length} offers across all hospitals.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="filled">Filled</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="space-y-2">
        {items.map(o => (
          <Card key={o.id} className="border-2 hover:shadow-sm transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              {o.hospital?.logoUrl ? (
                <img src={o.hospital.logoUrl} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <Avatar className="size-10"><AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{o.hospital?.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{o.title}</span>
                  {o.urgent && <Badge className="bg-rose-500 text-white text-[10px]">Urgent</Badge>}
                  <Badge variant="outline" className="text-[10px] capitalize">{o.type}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${o.status === 'published' ? 'border-emerald-300 text-emerald-700' : o.status === 'filled' ? 'border-teal-300 text-teal-700' : ''}`}>{o.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{o.hospital?.name} · {o.specialty || '—'} · {o._count.applications} applicants · {timeAgo(o.createdAt)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Need to import useApp
import { useApp } from '@/lib/store'
