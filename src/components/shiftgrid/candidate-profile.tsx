'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Mail, MapPin, Briefcase, Calendar, FileText,
  ShieldCheck, AlertTriangle, MessageSquare, Clock,
} from 'lucide-react'
import { formatDate, daysUntil, statusColor, labelize, timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const PIPELINE = ['applied', 'under_review', 'shortlisted', 'offered', 'accepted', 'declined', 'withdrawn'] as const

export function CandidateProfile({ applicationId }: { applicationId: string }) {
  const { setView, openConversation, refreshKey, refresh } = useApp()
  const { toast } = useToast()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ application: any }>(`/api/applications/${applicationId}`).then(r => {
      setApp(r.application)
    }).finally(() => setLoading(false))
  }, [applicationId, refreshKey])

  async function moveStage(newStatus: string) {
    try {
      await api(`/api/applications/${applicationId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      setApp({ ...app, status: newStatus })
      toast({ title: `Moved to ${labelize(newStatus)}` })
      refresh()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>
  if (!app) return <div className="p-6"><p>Application not found.</p><Button variant="link" onClick={() => setView('offers')}>Back to offers</Button></div>

  const user = app.user
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setView('offer-detail')}>
        <ArrowLeft className="size-4 mr-1" /> Back to pipeline
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="size-16 rounded-full object-cover border-4 border-emerald-100 dark:border-emerald-950" />
                ) : (
                  <Avatar className="size-16">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-semibold">
                      {user.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold">{user.name}</h1>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    {user.specialty && <div className="flex items-center gap-1.5"><Briefcase className="size-3.5" /> {user.specialty}</div>}
                    <div className="flex items-center gap-1.5"><Mail className="size-3.5" /> {user.email}</div>
                    {user.location && <div className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {user.location}</div>}
                  </div>
                </div>
              </div>

              {user.bio && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-1">About</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className="font-medium">{user.experienceYears ?? 0} years</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Availability</div>
                  <div className="font-medium">{user.availability ?? 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Applied</div>
                  <div className="font-medium">{timeAgo(app.appliedAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current stage</div>
                  <Badge className={`mt-0.5 ${statusColor(app.status)}`}>{labelize(app.status)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover note */}
          {app.coverNote && (
            <Card>
              <CardHeader><CardTitle className="text-base">Cover note</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm italic whitespace-pre-wrap">&ldquo;{app.coverNote}&rdquo;</p>
              </CardContent>
            </Card>
          )}

          {/* Credentials */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="size-4" /> Credentials</CardTitle></CardHeader>
            <CardContent>
              {user.credentials && user.credentials.length > 0 ? (
                <div className="space-y-2">
                  {user.credentials.map((c: any) => {
                    const days = daysUntil(c.expiryDate)
                    const expiringSoon = days !== null && days <= 30 && days >= 0
                    const expired = days !== null && days < 0
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                          expired ? 'bg-rose-100 text-rose-700' : expiringSoon ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {expired || expiringSoon ? <AlertTriangle className="size-4" /> : <ShieldCheck className="size-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">{c.type}</Badge>
                            {c.expiryDate && (
                              <span className={expired ? 'text-rose-700 font-medium' : expiringSoon ? 'text-amber-700 font-medium' : ''}>
                                <Calendar className="size-3 inline mr-0.5" />
                                {expired ? 'Expired ' : 'Expires '}{formatDate(c.expiryDate)}
                                {days !== null && days >= 0 && days <= 30 && ` (${days}d)`}
                              </span>
                            )}
                            {c.verified && <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Verified</Badge>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No credentials uploaded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — actions */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardHeader><CardTitle className="text-base">Move stage</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={app.status} onValueChange={moveStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE.map(s => <SelectItem key={s} value={s}>{labelize(s)}</SelectItem>)}
                </SelectContent>
              </Select>

              <Separator />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => openConversation(user.id, app.offerId)}
              >
                <MessageSquare className="size-4 mr-2" /> Message candidate
              </Button>

              <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Application ID</span>
                  <code className="font-mono">{app.id.slice(0, 8)}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Applied</span>
                  <span>{formatDate(app.appliedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last updated</span>
                  <span>{formatDate(app.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
