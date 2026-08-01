'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Pencil, MapPin, Calendar, DollarSign, Clock,
  Building2, Briefcase, Zap, FileDown, MessageSquare,
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, statusColor, labelize, parseRequirements, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const PIPELINE = ['applied', 'under_review', 'shortlisted', 'offered', 'accepted', 'declined', 'withdrawn'] as const

export function AdminOfferDetail({ offerId }: { offerId: string }) {
  const { openOfferEdit, setView, openCandidate, openConversation, refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [offer, setOffer] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<{ offer: any }>(`/api/offers/${offerId}`),
      api<{ items: any[] }>(`/api/applications?offerId=${offerId}`),
    ]).then(([o, a]) => {
      setOffer(o.offer)
      setApps(a.items)
    }).finally(() => setLoading(false))
  }, [offerId, refreshKey])

  async function moveStage(app: any, newStatus: string) {
    try {
      await api(`/api/applications/${app.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a))
      toast({ title: `Moved to ${labelize(newStatus)}` })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  function exportApplicantsCsv() {
    if (apps.length === 0) return
    const rows = [
      ['Name', 'Email', 'Specialty', 'Experience', 'Status', 'Applied', 'Cover note'],
      ...apps.map(a => [
        a.user.name, a.user.email, a.user.specialty ?? '',
        String(a.user.experienceYears ?? ''),
        a.status, formatDate(a.appliedAt),
        (a.coverNote ?? '').replace(/[\r\n]+/g, ' '),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `applicants-${offer?.title?.slice(0, 30) ?? 'offer'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>
  if (!offer) return <div className="p-6"><p>Offer not found.</p></div>

  const isLocum = offer.type === 'locum'
  const requirements = parseRequirements(offer.requirements)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setView('offers')}>
        <ArrowLeft className="size-4 mr-1" /> Back to offers
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={isLocum ? 'border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300' : 'border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300'}>
              {isLocum ? 'Locum' : 'Permanent'}
            </Badge>
            {offer.urgent && <Badge className="bg-rose-500 hover:bg-rose-600 text-white"><Zap className="size-3 mr-1" /> Urgent</Badge>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(offer.status)}`}>{labelize(offer.status)}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{offer.title}</h1>
          {offer.specialty && <p className="text-muted-foreground mt-1">{offer.specialty}</p>}
        </div>
        <Button variant="outline" onClick={() => openOfferEdit(offer)}>
          <Pencil className="size-4 mr-1" /> Edit offer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {offer.location && <KeyFact icon={<MapPin className="size-4" />} label="Location" value={offer.location.split(',')[0]} />}
              {isLocum ? (
                <>
                  <KeyFact icon={<Calendar className="size-4" />} label="Shift start" value={formatDateTime(offer.shiftStart)} />
                  <KeyFact icon={<Clock className="size-4" />} label="Shift end" value={formatDateTime(offer.shiftEnd)} />
                  <KeyFact icon={<DollarSign className="size-4" />} label="Rate" value={offer.rate != null ? `${formatCurrency(offer.rate)}/${offer.rateUnit === 'daily' ? 'day' : 'hr'}` : '—'} />
                </>
              ) : (
                <>
                  <KeyFact icon={<Briefcase className="size-4" />} label="Employment" value={offer.employmentType?.replace('-', ' ') ?? '—'} />
                  <KeyFact icon={<DollarSign className="size-4" />} label="Salary" value={offer.salaryMin != null ? `${formatCurrency(offer.salaryMin)}–${formatCurrency(offer.salaryMax)}` : '—'} />
                  <KeyFact icon={<Calendar className="size-4" />} label="Deadline" value={formatDate(offer.deadline)} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total applicants</span>
              <span className="text-2xl font-bold">{apps.length}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={exportApplicantsCsv} disabled={apps.length === 0}>
              <FileDown className="size-4 mr-1" /> Export to CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Applicant pipeline</h2>
        <span className="text-xs text-muted-foreground">Click a card to view candidate profile · use dropdown to change stage</span>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No applicants yet</h3>
            <p className="text-sm text-muted-foreground mt-1">When candidates apply, they&apos;ll appear here organized by stage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto">
          {PIPELINE.map(stage => {
            const stageApps = apps.filter(a => a.status === stage)
            return (
              <div key={stage} className="min-w-44">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {labelize(stage)}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageApps.length}</span>
                </div>
                <div className="space-y-2">
                  {stageApps.map(a => (
                    <Card key={a.id} className="hover:shadow-sm transition-shadow cursor-pointer" >
                      <CardContent className="p-3" onClick={() => openCandidate(a.id)}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                              {a.user.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{a.user.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{a.user.specialty ?? '—'}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-2">
                          {a.user.experienceYears ?? 0} yrs · {timeAgo(a.appliedAt)}
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="flex gap-1">
                          <Select value={a.status} onValueChange={(v) => moveStage(a, v)}>
                            <SelectTrigger className="h-7 text-xs px-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PIPELINE.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{labelize(s)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); openConversation(a.user.id, offer.id) }}>
                            <MessageSquare className="size-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageApps.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-lg">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {requirements.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KeyFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">{icon}{label}</div>
      <div className="text-sm font-medium capitalize">{value}</div>
    </div>
  )
}
