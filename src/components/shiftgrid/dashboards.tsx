'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, Inbox, Bookmark, Bell, FileWarning, ArrowRight, Sparkles, Building2, User } from 'lucide-react'
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
  const hasRecommended = data.recommended && data.recommended.length > 0
  const profileComplete = user?.phoneNumber && user?.region && user?.townCity
  const totalApps = s.applications ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome hero */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{user?.name.split(' ')[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.specialty && user.specialty !== 'Other' ? `${user.specialty} · ` : user?.specialtyOther ? `${user.specialtyOther} · ` : ''}
          Here&apos;s what&apos;s happening with your search today.
        </p>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800 animate-fade-in-up" >
          <CardContent className="p-5 flex items-start gap-3">
            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-emerald-900 dark:text-emerald-200">Complete your profile</h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                Add your phone number and address to apply for offers faster. Hospitals prefer complete profiles.
              </p>
              <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => setView('profile')}>
                Complete profile <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
        <StatCard icon={<Inbox className="size-5" />} label="Active applications" value={s.applications ?? 0} accent="emerald" onClick={() => setView('applications')} />
        <StatCard icon={<Bookmark className="size-5" />} label="Saved offers" value={s.savedOffers ?? 0} accent="violet" onClick={() => setView('saved')} />
        <StatCard icon={<FileWarning className="size-5" />} label="Expiring credentials" value={s.expiringCreds ?? 0} accent={s.expiringCreds > 0 ? 'rose' : 'slate'} onClick={() => setView('credentials')} />
        <StatCard icon={<Bell className="size-5" />} label="Unread notifications" value={s.unreadNotifications ?? 0} accent={s.unreadNotifications > 0 ? 'amber' : 'slate'} onClick={() => setView('notifications')} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <QuickAction icon={<Briefcase className="size-5" />} label="Browse offers" description="Find your next role" onClick={() => setView('browse')} />
        <QuickAction icon={<Bookmark className="size-5" />} label="Saved offers" description="Review bookmarked" onClick={() => setView('saved')} />
        <QuickAction icon={<Inbox className="size-5" />} label="My applications" description="Track status" onClick={() => setView('applications')} />
        <QuickAction icon={<User className="size-5" />} label="Edit profile" description="Update your info" onClick={() => setView('profile')} />
      </div>

      {/* Recommended offers */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Recommended for you</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView('browse')}>
            Browse all <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
        {hasRecommended ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.recommended!.map((o, i) => (
              <div key={o.id} className="animate-fade-in-up" style={{ animationDelay: `${0.2 + i * 0.05}s`, opacity: 0 }}>
                <OfferCard offer={o} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4 animate-float">
                <Briefcase className="size-8 text-emerald-600" />
              </div>
              <h3 className="font-medium text-lg">No recommended offers yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {user?.specialty
                  ? `We couldn't find offers matching your specialty (${user.specialty}). Try browsing all available offers.`
                  : 'Add your specialty to your profile and we\'ll surface matching offers here.'}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setView('browse')}>
                  Browse all offers <ArrowRight className="size-4 ml-1" />
                </Button>
                {!user?.specialty && (
                  <Button variant="outline" onClick={() => setView('profile')}>
                    Update profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Application status overview */}
      {totalApps > 0 && data.statusCounts && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <h2 className="text-lg font-semibold mb-4">Application overview</h2>
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {['applied','under_review','shortlisted','offered','accepted','declined','withdrawn'].map(stage => {
                  const count = data.statusCounts![stage] ?? 0
                  const pct = totalApps ? Math.round((count / totalApps) * 100) : 0
                  return (
                    <button key={stage} onClick={() => setView('applications')} className="text-left p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">{stage.replace('_', ' ')}</div>
                      <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credential warning */}
      {s.expiringCreds > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
          <CardContent className="p-5 flex items-start gap-3">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
              <FileWarning className="size-5 text-amber-600" />
            </div>
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

      {/* Tips section */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
        <h2 className="text-lg font-semibold mb-4">Tips for success</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TipCard
            icon={<Sparkles className="size-5" />}
            title="Complete your profile"
            body="Hospitals are 3x more likely to shortlist candidates with complete profiles, including credentials and a bio."
            action={() => setView('profile')}
            actionLabel="Update profile"
          />
          <TipCard
            icon={<Bell className="size-5" />}
            title="Stay responsive"
            body="Respond to messages from hospital admins within 24 hours to improve your chances of getting offers."
            action={() => setView('messages')}
            actionLabel="Check messages"
          />
          <TipCard
            icon={<FileWarning className="size-5" />}
            title="Keep credentials current"
            body="Expired licenses can pause your applications. Upload renewals as soon as you receive them."
            action={() => setView('credentials')}
            actionLabel="Add credentials"
          />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left p-4 rounded-xl border bg-background hover:bg-muted/50 hover:shadow-md transition-all card-hover-lift group">
      <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  )
}

function TipCard({ icon, title, body, action, actionLabel }: { icon: React.ReactNode; title: string; body: string; action: () => void; actionLabel: string }) {
  return (
    <Card className="card-hover-lift">
      <CardContent className="p-5">
        <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
          {icon}
        </div>
        <h3 className="font-medium text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{body}</p>
        <button onClick={action} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          {actionLabel} <ArrowRight className="size-3" />
        </button>
      </CardContent>
    </Card>
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
      <div className="space-y-2">
        <div className="h-9 w-72 shimmer-skeleton rounded-lg" />
        <div className="h-4 w-96 shimmer-skeleton rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="h-28 shimmer-skeleton rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="h-20 shimmer-skeleton rounded-xl" />)}
      </div>
      <div className="space-y-2">
        <div className="h-6 w-48 shimmer-skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-44 shimmer-skeleton rounded-xl" />)}
      </div>
    </div>
  )
}
