'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, Inbox, Bookmark, Bell, FileWarning, ArrowRight, Sparkles, Building2 } from 'lucide-react'
import { OfferCard } from './offer-card'
import { formatCurrency, timeAgo } from '@/lib/types'

type DashboardData = {
  role: string
  stats: any
  statusCounts?: Record<string, number>
  recommended?: any[]
}

export function StaffHome() {
  const { user, setView, openOffer } = useApp()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<DashboardData>('/api/dashboard').then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!data) return null

  const s = data.stats
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.specialty ? `${user.specialty} · ` : ''}Here&apos;s what&apos;s happening with your search today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Inbox className="size-5" />} label="Active applications" value={s.applications ?? 0} accent="emerald" onClick={() => setView('applications')} />
        <StatCard icon={<Bookmark className="size-5" />} label="Saved offers" value={s.savedOffers ?? 0} accent="violet" onClick={() => setView('saved')} />
        <StatCard icon={<FileWarning className="size-5" />} label="Expiring credentials" value={s.expiringCreds ?? 0} accent={s.expiringCreds > 0 ? 'rose' : 'slate'} onClick={() => setView('credentials')} />
        <StatCard icon={<Bell className="size-5" />} label="Unread notifications" value={s.unreadNotifications ?? 0} accent={s.unreadNotifications > 0 ? 'amber' : 'slate'} onClick={() => setView('notifications')} />
      </div>

      {data.recommended && data.recommended.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">Recommended for you</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('browse')}>
              Browse all <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.recommended.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </div>
      )}

      {s.expiringCreds > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-5 flex items-start gap-3">
            <FileWarning className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900 dark:text-amber-200">Credential expiring soon</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                You have {s.expiringCreds} credential{s.expiringCreds === 1 ? '' : 's'} expiring within 30 days. Keep your profile current to maintain eligibility for active applications.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300" onClick={() => setView('credentials')}>
                Review credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function AdminDashboard() {
  const { user, setView, openOfferDetail, openOfferEdit } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/dashboard').then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!data) return null

  const s = data.stats
  const pipeline = data.pipeline || {}
  const pipelineTotal = Object.values(pipeline).reduce((a: number, b: any) => a + Number(b), 0) as number

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Building2 className="size-4" />
            {user?.hospital?.name}
            {!user?.hospital?.verified && (
              <Badge variant="outline" className="ml-1 text-amber-700 border-amber-400">Pending verification</Badge>
            )}
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openOfferEdit(null)}>
          <Briefcase className="size-4 mr-1" /> New offer
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="size-5" />} label="Open offers" value={s.openOffers ?? 0} accent="emerald" onClick={() => setView('offers')} />
        <StatCard icon={<Inbox className="size-5" />} label="Total applicants" value={s.applicants ?? 0} accent="violet" onClick={() => setView('offers')} />
        <StatCard icon={<Bell className="size-5" />} label="Upcoming shifts (7d)" value={s.upcomingShifts ?? 0} accent="amber" onClick={() => setView('offers')} />
        <StatCard icon={<Sparkles className="size-5" />} label="Filled roles" value={s.filledRoles ?? 0} accent="teal" onClick={() => setView('offers')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applicant pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineTotal === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No applicants yet.</p>
            ) : (
              <div className="space-y-2">
                {['applied','under_review','shortlisted','offered','accepted','declined','withdrawn'].map((stage) => {
                  const count = pipeline[stage] ?? 0
                  const pct = pipelineTotal ? Math.round((count / pipelineTotal) * 100) : 0
                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize">{stage.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">{count} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${pipelineBarColor(stage)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent offers */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent offers</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView('offers')}>View all</Button>
          </CardHeader>
          <CardContent>
            {data.recentOffers?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No offers yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentOffers?.map((o: any) => (
                  <button key={o.id} onClick={() => openOfferDetail(o.id)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{o.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{o.type}</Badge>
                        <span>{o._count.applications} applicant{o._count.applications === 1 ? '' : 's'}</span>
                        <span>· {timeAgo(o.updatedAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 text-[10px]">{o.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.recentApplicants?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentApplicants.map((a: any) => (
                <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{a.user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.user.specialty} · {a.user.experienceYears ?? 0} yrs exp · applied to <span className="text-foreground">{a.offer.title}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent, onClick }: { icon: React.ReactNode; label: string; value: number; accent: string; onClick?: () => void }) {
  const accentClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
  return (
    <button onClick={onClick} className="text-left">
      <Card className="hover:shadow-sm transition-shadow h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`size-9 rounded-lg flex items-center justify-center ${accentClasses[accent] ?? accentClasses.slate}`}>
              {icon}
            </div>
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </button>
  )
}

function pipelineBarColor(stage: string): string {
  const map: Record<string, string> = {
    applied: 'bg-slate-400',
    under_review: 'bg-amber-400',
    shortlisted: 'bg-violet-400',
    offered: 'bg-teal-400',
    accepted: 'bg-emerald-500',
    declined: 'bg-rose-400',
    withdrawn: 'bg-slate-300',
  }
  return map[stage] ?? 'bg-slate-300'
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
