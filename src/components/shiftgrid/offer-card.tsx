'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Clock, DollarSign, BookmarkCheck, Bookmark, Zap, CalendarDays } from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate, statusColor, labelize } from '@/lib/types'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'

type Offer = any

export function OfferCard({ offer, onOpen, statusBadge }: { offer: Offer; onOpen?: () => void; statusBadge?: string }) {
  const { user, openOffer } = useApp()
  const isLocum = offer.type === 'locum'
  const isUrgent = !!offer.urgent
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${isUrgent ? 'ring-1 ring-rose-300 dark:ring-rose-800' : ''}`} onClick={() => onOpen ? onOpen() : openOffer(offer.id)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={isLocum ? 'border-teal-300 text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300' : 'border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300'}>
              {isLocum ? 'Locum' : 'Permanent'}
            </Badge>
            {isUrgent && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
                <Zap className="size-3 mr-1" /> Urgent
              </Badge>
            )}
            {statusBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(statusBadge)}`}>
                {labelize(statusBadge)}
              </span>
            )}
            {offer.status && offer.status !== 'published' && !statusBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(offer.status)}`}>
                {labelize(offer.status)}
              </span>
            )}
          </div>
          {user?.role === 'staff' && <SaveButton offerId={offer.id} />}
        </div>

        <h3 className="font-semibold text-base leading-tight mb-1 group-hover:text-emerald-700 line-clamp-2">
          {offer.title}
        </h3>
        {offer.specialty && (
          <div className="text-sm text-muted-foreground mb-2">{offer.specialty}</div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Building2 className="size-3.5" />
          <span className="truncate">{offer.hospital?.name}</span>
          {offer.hospital?.verified && (
            <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1.5 h-4 border-emerald-300 text-emerald-700">
              Verified
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          {offer.location && (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{offer.location.split(',')[0]}</span>
            </div>
          )}
          {isLocum ? (
            <>
              <div className="flex items-center gap-1 truncate">
                <CalendarDays className="size-3.5 shrink-0" />
                <span className="truncate">{offer.shiftStart ? formatDateTime(offer.shiftStart) : 'TBD'}</span>
              </div>
              {offer.rate != null && (
                <div className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <DollarSign className="size-3.5" />
                  {formatCurrency(offer.rate)}/{offer.rateUnit === 'daily' ? 'day' : 'hr'}
                </div>
              )}
            </>
          ) : (
            <>
              {offer.employmentType && (
                <div className="flex items-center gap-1 truncate">
                  <Clock className="size-3.5 shrink-0" />
                  <span className="truncate capitalize">{offer.employmentType.replace('-', ' ')}</span>
                </div>
              )}
              {offer.salaryMin != null && (
                <div className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <DollarSign className="size-3.5" />
                  {formatCurrency(offer.salaryMin)}–{formatCurrency(offer.salaryMax)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{offer._count?.applications ?? 0} applicant{(offer._count?.applications ?? 0) === 1 ? '' : 's'}</span>
          {offer.deadline && <span>Apply by {formatDate(offer.deadline)}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function SaveButton({ offerId }: { offerId: string }) {
  const { refreshKey } = useApp()
  const [saved, setSaved] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api<{ items: any[] }>('/api/saved').then((r) => {
      if (!cancelled) setSaved(r.items.some((o) => o.id === offerId))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [offerId, refreshKey])

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    try {
      if (saved) {
        await api(`/api/saved/${offerId}`, { method: 'DELETE' })
        setSaved(false)
      } else {
        await api('/api/saved', { method: 'POST', body: JSON.stringify({ offerId }) })
        setSaved(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      disabled={loading || saved === null}
      onClick={toggle}
      aria-label={saved ? 'Remove from saved' : 'Save offer'}
    >
      {saved ? <BookmarkCheck className="size-4 text-emerald-600" /> : <Bookmark className="size-4" />}
    </Button>
  )
}
