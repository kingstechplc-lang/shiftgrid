'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, Trash2, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react'
import { formatDate, daysUntil } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const CRED_TYPES = [
  { value: 'license', label: 'License' },
  { value: 'certification', label: 'Certification' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'id', label: 'Government ID' },
]

export function Credentials() {
  const { refreshKey } = useApp()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ type: 'license', name: '', issueDate: '', expiryDate: '' })

  useEffect(() => {
    api<{ items: any[] }>('/api/credentials').then(r => setItems(r.items)).finally(() => setLoading(false))
  }, [refreshKey])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api('/api/credentials', { method: 'POST', body: JSON.stringify(form) })
      const r = await api<{ items: any[] }>('/api/credentials')
      setItems(r.items)
      setDialogOpen(false)
      setForm({ type: 'license', name: '', issueDate: '', expiryDate: '' })
      toast({ title: 'Credential added' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this credential?')) return
    try {
      await api(`/api/credentials/${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Credential removed' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground mt-1">Licenses, certifications, and documents. We&apos;ll alert you before they expire.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="size-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add credential</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ctype">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger id="ctype"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRED_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CPSO License — Emergency Medicine" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cissue">Issue date</Label>
                  <Input id="cissue" type="date" value={form.issueDate} onChange={(e) => setForm(f => ({ ...f, issueDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cexp">Expiry date</Label>
                  <Input id="cexp" type="date" value={form.expiryDate} onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Add credential</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium">No credentials added</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your licenses and certifications to keep them tracked.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => {
            const days = daysUntil(c.expiryDate)
            const expiringSoon = days !== null && days <= 30 && days >= 0
            const expired = days !== null && days < 0
            return (
              <Card key={c.id} className={expiringSoon ? 'border-amber-300' : expired ? 'border-rose-300' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                    expired ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                    expiringSoon ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    {expired ? <AlertTriangle className="size-5" /> : expiringSoon ? <AlertTriangle className="size-5" /> : <FileText className="size-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{c.name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{c.type}</Badge>
                      {c.verified && (
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
                          <ShieldCheck className="size-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      {c.issueDate && <span>Issued {formatDate(c.issueDate)}</span>}
                      {c.expiryDate && (
                        <span className={`flex items-center gap-1 ${expired ? 'text-rose-700 font-medium' : expiringSoon ? 'text-amber-700 font-medium' : ''}`}>
                          <Calendar className="size-3" />
                          {expired ? 'Expired ' : 'Expires '}
                          {formatDate(c.expiryDate)}
                          {days !== null && days >= 0 && days <= 30 && ` (${days}d)`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
