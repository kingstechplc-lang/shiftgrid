'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Plus, X, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const SPECIALTIES = [
  'Emergency Medicine', 'Internal Medicine', 'Cardiology', 'ICU Nursing',
  'Pediatric Nursing', 'Anesthesiology', 'Family Medicine', 'Diagnostic Radiology',
  'Obstetrics & Gynecology', 'Physiotherapy', 'Pharmacy', 'Geriatrics',
  'Psychology', 'Surgery', 'Orthopaedics', 'Other',
]

export function OfferForm() {
  const { editingOffer, setView, refresh } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    type: 'locum',
    title: '',
    specialty: '',
    description: '',
    requirements: ['Active provincial license', 'Minimum 2 years relevant experience'],
    location: '',
    status: 'draft',
    visibility: 'public',
    deadline: '',
    // locum
    shiftStart: '',
    shiftEnd: '',
    rate: '',
    rateUnit: 'hourly',
    urgent: false,
    // permanent
    employmentType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    benefits: '',
  })
  const [newReq, setNewReq] = useState('')

  useEffect(() => {
    if (editingOffer) {
      const o = editingOffer
      setForm({
        type: o.type,
        title: o.title ?? '',
        specialty: o.specialty ?? '',
        description: o.description ?? '',
        requirements: (() => { try { return JSON.parse(o.requirements) } catch { return [] } })(),
        location: o.location ?? '',
        status: o.status,
        visibility: o.visibility ?? 'public',
        deadline: o.deadline ? new Date(o.deadline).toISOString().slice(0, 10) : '',
        shiftStart: o.shiftStart ? toLocalInput(o.shiftStart) : '',
        shiftEnd: o.shiftEnd ? toLocalInput(o.shiftEnd) : '',
        rate: o.rate ?? '',
        rateUnit: o.rateUnit ?? 'hourly',
        urgent: o.urgent ?? false,
        employmentType: o.employmentType ?? 'full-time',
        salaryMin: o.salaryMin ?? '',
        salaryMax: o.salaryMax ?? '',
        benefits: o.benefits ?? '',
      })
    }
  }, [editingOffer])

  function toLocalInput(d: string | Date): string {
    const date = new Date(d)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function addRequirement() {
    if (!newReq.trim()) return
    set('requirements', [...form.requirements, newReq.trim()])
    setNewReq('')
  }
  function removeRequirement(i: number) {
    set('requirements', form.requirements.filter((_: any, idx: number) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent, publish = false) {
    e.preventDefault()
    if (!form.title) {
      toast({ variant: 'destructive', title: 'Title required' })
      return
    }
    setSaving(true)
    const payload = { ...form, status: publish ? 'published' : form.status, requirements: form.requirements }
    try {
      if (editingOffer) {
        await api(`/api/offers/${editingOffer.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        toast({ title: publish ? 'Offer published' : 'Offer updated' })
      } else {
        await api('/api/offers', { method: 'POST', body: JSON.stringify(payload) })
        toast({ title: publish ? 'Offer published' : 'Draft saved' })
      }
      refresh()
      setView('offers')
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const isLocum = form.type === 'locum'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setView('offers')}>
        <ArrowLeft className="size-4 mr-1" /> Back to offers
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {editingOffer ? 'Edit offer' : 'New offer'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {editingOffer ? 'Update the details below.' : 'Create a new locum or permanent offer for your hospital.'}
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Offer type & basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Offer type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set('type', 'locum')}
                  className={`p-4 rounded-lg border text-left transition-colors ${isLocum ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:bg-muted'}`}
                >
                  <div className="font-medium">Locum (temporary)</div>
                  <div className="text-xs text-muted-foreground mt-1">Shift-based, hourly or daily rate</div>
                </button>
                <button
                  type="button"
                  onClick={() => set('type', 'permanent')}
                  className={`p-4 rounded-lg border text-left transition-colors ${!isLocum ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:bg-muted'}`}
                >
                  <div className="font-medium">Permanent</div>
                  <div className="text-xs text-muted-foreground mt-1">Full-time / part-time / contract role</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Locum ER Physician — Weekend Coverage" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty / Department</Label>
                <Select value={form.specialty} onValueChange={(v) => set('specialty', v === '__none__' ? '' : v)}>
                  <SelectTrigger id="specialty"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Hospital address or city" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the role, team, and what the candidate will do..." />
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="space-y-2">
                {form.requirements.map((r: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={r} onChange={(e) => set('requirements', form.requirements.map((x: string, idx: number) => idx === i ? e.target.value : x))} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRequirement(i)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newReq} onChange={(e) => setNewReq(e.target.value)} placeholder="Add a requirement..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement() } }} />
                  <Button type="button" variant="outline" onClick={addRequirement}><Plus className="size-4" /></Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application deadline</Label>
                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vis">Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => set('visibility', v)}>
                  <SelectTrigger id="vis"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (anyone can apply)</SelectItem>
                    <SelectItem value="internal">Internal (invite only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Type-specific fields */}
        {isLocum ? (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">Locum details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shiftStart">Shift start</Label>
                  <Input id="shiftStart" type="datetime-local" value={form.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftEnd">Shift end</Label>
                  <Input id="shiftEnd" type="datetime-local" value={form.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="rate">Rate</Label>
                  <Input id="rate" type="number" min={0} step={0.01} value={form.rate} onChange={(e) => set('rate', e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="rateUnit">Rate unit</Label>
                  <Select value={form.rateUnit} onValueChange={(v) => set('rateUnit', v)}>
                    <SelectTrigger id="rateUnit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">per hour</SelectItem>
                      <SelectItem value="daily">per day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-1 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <Switch checked={form.urgent} onCheckedChange={(v) => set('urgent', v)} />
                    <span className="text-sm flex items-center gap-1">
                      <Zap className="size-3 text-rose-500" /> Urgent / ASAP
                    </span>
                  </label>
                </div>
              </div>
              {form.urgent && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Marked urgent — will appear highlighted in candidate search and trigger ASAP notifications.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Permanent role details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emp">Employment type</Label>
                <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v)}>
                  <SelectTrigger id="emp"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salMin">Salary min (CAD)</Label>
                  <Input id="salMin" type="number" min={0} value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salMax">Salary max (CAD)</Label>
                  <Input id="salMax" type="number" min={0} value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits summary</Label>
                <Textarea id="benefits" rows={3} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} placeholder="Pension, health/dental, vacation, CME stipend, etc." />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setView('offers')}>Cancel</Button>
          <Button type="submit" variant="outline" disabled={saving}>
            <Save className="size-4 mr-1" /> {saving ? 'Saving...' : 'Save as draft'}
          </Button>
          <Button type="button" disabled={saving} onClick={(e) => handleSubmit(e as any, true)} className="bg-emerald-600 hover:bg-emerald-700">
            {editingOffer ? 'Publish changes' : 'Publish offer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
