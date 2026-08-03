'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, Inbox, Bookmark, Bell, FileWarning, ArrowRight, Sparkles, Building2, Clock, TrendingUp, Zap, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { OfferCard } from './offer-card'
import { InlineBannerAd } from './ad-slot'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<DashboardData>('/api/dashboard')
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error || !data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="size-16 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-8 text-rose-600" />
          </div>
          <h3 className="font-medium text-lg mb-1">Unable to load dashboard</h3>
          <p className="text-sm text-muted-foreground mb-4">{error || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="size-4 mr-2" /> Refresh page
          </Button>
        </div>
      </div>
    )
  }

  const s = data.stats
  const recommended = data.recommended || []
  const statusCounts = data.statusCounts || {}

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-0 right-0 size-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5" />
            <span className="text-sm font-medium text-white/80">Welcome back</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/80 text-sm lg:text-base">
            {user?.specialty ? `${user.specialty} · ` : ''}Here&apos;s what&apos;s happening with your search today.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <StatCard icon={<Inbox className="size-5" />} label="Active applications" value={s.applications ?? 0} accent="emerald" onClick={() => setView('applications')} />
        <StatCard icon={<Bookmark className="size-5" />} label="Saved offers" value={s.savedOffers ?? 0} accent="violet" onClick={() => setView('saved')} />
        <StatCard icon={<FileWarning className="size-5" />} label="Expiring credentials" value={s.expiringCreds ?? 0} accent={s.expiringCreds > 0 ? 'rose' : 'slate'} onClick={() => setView('credentials')} />
        <StatCard icon={<Bell className="size-5" />} label="Unread notifications" value={s.unreadNotifications ?? 0} accent={s.unreadNotifications > 0 ? 'amber' : 'slate'} onClick={() => setView('notifications')} />
      </div>

      {/* Application status overview */}
      {(statusCounts.applied || statusCounts.under_review || statusCounts.shortlisted || statusCounts.offered || statusCounts.accepted) > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Application pipeline
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView('applications')}>
              View all <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Applied', value: statusCounts.applied, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                { label: 'Under Review', value: statusCounts.under_review, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
                { label: 'Shortlisted', value: statusCounts.shortlisted, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
                { label: 'Offered', value: statusCounts.offered, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
                { label: 'Accepted', value: statusCounts.accepted, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
              ].map(stage => (
                stage.value > 0 && (
                  <button
                    key={stage.label}
                    onClick={() => setView('applications')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${stage.color}`}
                  >
                    {stage.label}: <span className="font-bold">{stage.value}</span>
                  </button>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended offers */}
      {recommended.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Sparkles className="size-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold">Recommended for you</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('browse')}>
              Browse all <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommended.map((o, i) => (
              <div key={o.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${250 + i * 50}ms` }}>
                <OfferCard offer={o} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline banner ad — between recommended offers and quick actions */}
      <InlineBannerAd />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <QuickActionCard
          icon={<Briefcase className="size-5" />}
          title="Browse offers"
          description="Find locum and permanent roles"
          accent="emerald"
          onClick={() => setView('browse')}
        />
        <QuickActionCard
          icon={<Calendar className="size-5" />}
          title="My applications"
          description="Track your application status"
          accent="violet"
          onClick={() => setView('applications')}
        />
        <QuickActionCard
          icon={<FileWarning className="size-5" />}
          title="Update profile"
          description="Complete your profile for better matches"
          accent="amber"
          onClick={() => setView('profile')}
        />
      </div>

      {/* Credential expiry alert */}
      {s.expiringCreds > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <FileWarning className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-amber-900 dark:text-amber-200">Credential expiring soon</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                You have {s.expiringCreds} credential{s.expiringCreds === 1 ? '' : 's'} expiring within 30 days. Keep your profile current to maintain eligibility for active applications.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300" onClick={() => setView('credentials')}>
                Review credentials <ArrowRight className="size-3.5 ml-1" />
              </Button>
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
    <button onClick={onClick} className="text-left group">
      <Card className="hover:shadow-md hover:border-emerald-200 transition-all duration-300 hover:scale-[1.02] h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`size-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${accentClasses[accent] ?? accentClasses.slate}`}>
              {icon}
            </div>
            {value > 0 && accent !== 'slate' && (
              <span className={`size-2 rounded-full ${accentClasses[accent] ?? accentClasses.slate} animate-pulse`} />
            )}
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </button>
  )
}

function QuickActionCard({ icon, title, description, accent, onClick }: { icon: React.ReactNode; title: string; description: string; accent: string; onClick: () => void }) {
  const accentClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  }
  return (
    <button onClick={onClick} className="text-left group">
      <Card className="hover:shadow-md hover:border-emerald-200 transition-all duration-300 hover:scale-[1.02] h-full">
        <CardContent className="p-5 flex items-start gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${accentClasses[accent]}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hero skeleton */}
      <div className="h-32 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 animate-pulse" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="size-9 rounded-lg mb-2" />
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Recommended skeleton */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard (kept in same file for simplicity)
// ─────────────────────────────────────────────────────────────────────────────

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
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-0 right-0 size-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="size-5" />
              <span className="text-sm font-medium text-white/80">{user?.hospital?.name}</span>
              {!user?.hospital?.verified && (
                <Badge variant="outline" className="bg-amber-500/20 border-amber-300 text-amber-100 text-[10px]">Pending verification</Badge>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <Button className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => openOfferEdit(null)}>
            <Briefcase className="size-4 mr-1" /> New offer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <StatCard icon={<Briefcase className="size-5" />} label="Open offers" value={s.openOffers ?? 0} accent="emerald" onClick={() => setView('offers')} />
        <StatCard icon={<Inbox className="size-5" />} label="Total applicants" value={s.applicants ?? 0} accent="violet" onClick={() => setView('offers')} />
        <StatCard icon={<Clock className="size-5" />} label="Upcoming shifts (7d)" value={s.upcomingShifts ?? 0} accent="amber" onClick={() => setView('offers')} />
        <StatCard icon={<Sparkles className="size-5" />} label="Filled roles" value={s.filledRoles ?? 0} accent="teal" onClick={() => setView('offers')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline summary */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Applicant pipeline
            </CardTitle>
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
                        <div className={`h-full transition-all duration-500 ${pipelineBarColor(stage)}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent offers */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
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
                  <button key={o.id} onClick={() => openOfferDetail(o.id)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left transition-colors">
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
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
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
