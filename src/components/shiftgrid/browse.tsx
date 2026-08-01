'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Search, SlidersHorizontal, X, Bookmark } from 'lucide-react'
import { OfferCard } from './offer-card'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

type Filters = {
  q: string
  type: string         // 'all' | 'locum' | 'permanent'
  specialty: string
  urgent: boolean
  saved: boolean
  sort: string
  page: number
}

const DEFAULT_FILTERS: Filters = { q: '', type: 'all', specialty: '', urgent: false, saved: false, sort: 'newest', page: 1 }

export function BrowseOffers({ mine = false }: { mine?: boolean }) {
  const { refreshKey } = useApp()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ items: string[] }>('/api/specialties').then(r => setSpecialties(r.items)).catch(() => {})
  }, [])

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.specialty) params.set('specialty', filters.specialty)
      if (filters.urgent) params.set('urgent', 'true')
      if (filters.saved) params.set('saved', 'true')
      if (mine) params.set('mine', 'true')
      params.set('sort', filters.sort)
      params.set('page', String(filters.page))
      params.set('pageSize', '12')
      const r = await api<{ items: any[]; total: number; totalPages: number }>(`/api/offers?${params}`)
      setData(r)
    } finally {
      setLoading(false)
    }
  }, [filters, mine])

  useEffect(() => { fetchOffers() }, [fetchOffers, refreshKey])

  function update(patch: Partial<Filters>) {
    setFilters(f => ({ ...f, ...patch, page: 1 }))
  }

  function reset() {
    setFilters(DEFAULT_FILTERS)
  }

  const activeFilterCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.specialty ? 1 : 0) +
    (filters.urgent ? 1 : 0) +
    (filters.saved ? 1 : 0) +
    (filters.sort !== 'newest' ? 1 : 0)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{mine ? 'Our offers' : 'Browse offers'}</h1>
          <p className="text-muted-foreground mt-1">
            {mine ? 'Manage all offers posted by your hospital.' : 'Find locum shifts and permanent roles across all hospitals.'}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, specialty, or keyword..."
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" />
                {activeFilterCount > 0 && <Badge className="ml-1.5 bg-emerald-600">{activeFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <FilterPanel filters={filters} update={update} reset={reset} specialties={specialties} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filters</h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-xs h-7">Reset</Button>
              )}
            </div>
            <FilterPanel filters={filters} update={update} reset={reset} specialties={specialties} />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${data?.total ?? 0} offer${(data?.total ?? 0) === 1 ? '' : 's'} found`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-44" />)}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.items.map(o => <OfferCard key={o.id} offer={o} />)}
              </div>
              {(data.totalPages ?? 1) > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    {filters.page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <span className="text-sm">Page {filters.page} of {data.totalPages}</span>
                    </PaginationItem>
                    {filters.page < (data.totalPages ?? 1) && (
                      <PaginationItem>
                        <PaginationNext onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <EmptyState filters={filters} reset={reset} />
          )}
        </div>
      </div>
    </div>
  )
}

function FilterPanel({ filters, update, reset, specialties }: { filters: Filters; update: (p: Partial<Filters>) => void; reset: () => void; specialties: string[] }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Offer type</Label>
        <Select value={filters.type} onValueChange={(v) => update({ type: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="locum">Locum (temporary)</SelectItem>
            <SelectItem value="permanent">Permanent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Specialty</Label>
        <Select value={filters.specialty || 'all'} onValueChange={(v) => update({ specialty: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Any specialty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any specialty</SelectItem>
            {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Sort by</Label>
        <Select value={filters.sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="urgent">Urgent first</SelectItem>
            <SelectItem value="rate_high">Highest rate (locum)</SelectItem>
            <SelectItem value="salary_high">Highest salary (permanent)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Quick filters</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={filters.urgent} onCheckedChange={(v) => update({ urgent: v === true })} />
            <span>Urgent / ASAP only</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={filters.saved} onCheckedChange={(v) => update({ saved: v === true })} />
            <span>Saved offers only</span>
          </label>
        </div>
      </div>

      {(filters.urgent || filters.saved || filters.specialty || filters.type !== 'all') && (
        <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
          <X className="size-3 mr-1" /> Clear filters
        </Button>
      )}
    </div>
  )
}

function EmptyState({ filters, reset }: { filters: Filters; reset: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        {filters.saved ? <Bookmark className="size-7 text-muted-foreground" /> : <Search className="size-7 text-muted-foreground" />}
      </div>
      <h3 className="font-medium text-lg">No offers found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {filters.saved ? 'You haven\u2019t saved any offers matching these filters yet.' : 'Try adjusting your search or filters.'}
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>Reset filters</Button>
    </div>
  )
}
