'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft, Building2, MapPin, Calendar, DollarSign, Clock,
  CheckCircle2, FileText, Zap, MessageSquare, Send, Briefcase,
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, parseRequirements } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function OfferDetail({ offerId }: { offerId: string }) {
  const { user, setView, openConversation } = useApp()
  const { toast } = useToast()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [application, setApplication] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    api<{ offer: any }>(`/api/offers/${offerId}`).then(r => setOffer(r.offer)).finally(() => setLoading(false))
    // Check existing application
    api<{ items: any[] }>('/api/applications?mine=true').then(r => {
      const existing = r.items.find(a => a.offerId === offerId)
      if (existing) setApplication(existing)
    }).catch(() => {})
  }, [offerId])

  if (loading) return <div className="p-6"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64" /></div>
  if (!offer) return <div className="p-6"><p>Offer not found.</p></div>

  const isLocum = offer.type === 'locum'
  const requirements = parseRequirements(offer.requirements)

  async function handleApply() {
    setApplying(true)
    try {
      const res = await api('/api/applications', { method: 'POST', body: JSON.stringify({ offerId, coverNote }) })
      setApplication(res.application)
      setDialogOpen(false)
      setCoverNote('')
      toast({ title: 'Application submitted!', description: 'You can track its status on your dashboard.' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Application failed', description: e.message })
    } finally {
      setApplying(false)
    }
  }

  async function handleWithdraw() {
    if (!application) return
    if (!confirm('Withdraw this application?')) return
    try {
      await api(`/api/applications/${application.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'withdrawn' }) })
      setApplication({ ...application, status: 'withdrawn' })
      toast({ title: 'Application withdrawn' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Withdraw failed', description: e.message })
    }
  }

  async function handleMessageAdmin() {
    if (!offer) return
    // Find the offer's creator (admin)
    const adminId = offer.createdById
    openConversation(adminId, offerId)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setView('browse')}>
        <ArrowLeft className="size-4 mr-1" /> Back to browse
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={isLocum ? 'border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300' : 'border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300'}>
                    {isLocum ? 'Locum' : 'Permanent'}
                  </Badge>
                  {offer.urgent && (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
                      <Zap className="size-3 mr-1" /> Urgent
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Posted {formatDate(offer.createdAt)}</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-2">{offer.title}</h1>
              {offer.specialty && <p className="text-muted-foreground mb-4">{offer.specialty}</p>}

              <div className="flex items-center gap-2 text-sm mb-4">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="font-medium">{offer.hospital?.name}</span>
                {offer.hospital?.verified && (
                  <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Verified</Badge>
                )}
              </div>

              {/* Key facts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t">
                {offer.location && (
                  <KeyFact icon={<MapPin className="size-4" />} label="Location" value={offer.location} />
                )}
                {isLocum ? (
                  <>
                    <KeyFact icon={<Calendar className="size-4" />} label="Shift start" value={formatDateTime(offer.shiftStart)} />
                    <KeyFact icon={<Clock className="size-4" />} label="Shift end" value={formatDateTime(offer.shiftEnd)} />
                    <KeyFact icon={<DollarSign className="size-4" />} label="Rate" value={offer.rate != null ? `${formatCurrency(offer.rate)} / ${offer.rateUnit === 'daily' ? 'day' : 'hr'}` : '—'} />
                  </>
                ) : (
                  <>
                    {offer.employmentType && (
                      <KeyFact icon={<Briefcase className="size-4" />} label="Employment" value={offer.employmentType.replace('-', ' ')} />
                    )}
                    <KeyFact icon={<DollarSign className="size-4" />} label="Salary range" value={offer.salaryMin != null ? `${formatCurrency(offer.salaryMin)} – ${formatCurrency(offer.salaryMax)}` : '—'} />
                  </>
                )}
                {offer.deadline && (
                  <KeyFact icon={<Calendar className="size-4" />} label="Apply by" value={formatDate(offer.deadline)} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {offer.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{offer.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Benefits (permanent) */}
          {offer.benefits && (
            <Card>
              <CardHeader><CardTitle className="text-base">Benefits</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{offer.benefits}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardContent className="p-5 space-y-3">
              {application ? (
                <>
                  <div className="text-center">
                    <Badge variant="outline" className="capitalize">{application.status.replace('_', ' ')}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      You applied on {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  {application.status !== 'withdrawn' && application.status !== 'accepted' && application.status !== 'declined' && (
                    <Button variant="outline" className="w-full" onClick={handleWithdraw}>
                      Withdraw application
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={handleMessageAdmin}>
                    <MessageSquare className="size-4 mr-2" /> Message hospital
                  </Button>
                </>
              ) : offer.status === 'published' ? (
                <>
                  <div className="text-center py-2">
                    {isLocum ? (
                      <p className="text-sm text-muted-foreground">Express interest in this shift with one tap.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Apply with a cover note.</p>
                    )}
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                        <Send className="size-4 mr-2" />
                        {isLocum ? 'Express interest' : 'Apply now'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{isLocum ? 'Express interest' : 'Apply for this role'}</DialogTitle>
                        <DialogDescription>
                          {offer.title} · {offer.hospital?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="cover">Cover note (optional)</Label>
                        <Textarea
                          id="cover"
                          rows={5}
                          value={coverNote}
                          onChange={(e) => setCoverNote(e.target.value)}
                          placeholder={isLocum ? 'Any notes for the hospital admin? e.g. "Available all weekend."' : 'Tell the hospital why you\u2019re a great fit...'}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={applying} className="bg-emerald-600 hover:bg-emerald-700">
                          {applying ? 'Submitting...' : 'Submit'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="outline" className="capitalize">{offer.status}</Badge>
                  <p className="text-sm text-muted-foreground mt-2">This offer is no longer accepting applications.</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Applicants</span>
                  <span className="font-medium">{offer._count?.applications ?? 0}</span>
                </div>
                {offer.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">{formatDate(offer.deadline)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hospital card */}
          {offer.hospital && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                      {offer.hospital.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{offer.hospital.name}</div>
                    {offer.hospital.verified && (
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 mt-0.5">Verified hospital</Badge>
                    )}
                  </div>
                </div>
                {offer.hospital.address && (
                  <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="size-3 shrink-0 mt-0.5" />
                    <span>{offer.hospital.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function KeyFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium capitalize">{value}</div>
    </div>
  )
}
