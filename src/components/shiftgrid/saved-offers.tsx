'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, ArrowRight } from 'lucide-react'
import { OfferCard } from './offer-card'

export function SavedOffers() {
  const { setView, refreshKey } = useApp()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ items: any[] }>('/api/saved').then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[0,1,2].map(i => <Skeleton key={i} className="h-44" />)}</div></div>

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Saved offers</h1>
        <p className="text-muted-foreground mt-1">Offers you&apos;ve bookmarked to revisit later.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bookmark className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">No saved offers</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Tap the bookmark icon on any offer to save it here.</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setView('browse')}>
            Browse offers <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(o => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}
    </div>
  )
}
