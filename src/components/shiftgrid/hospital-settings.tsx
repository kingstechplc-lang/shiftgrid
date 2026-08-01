'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, MapPin, Save, ShieldCheck, Briefcase } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function HospitalSettings() {
  const { user, refreshKey } = useApp()
  const { toast } = useToast()
  const [hospital, setHospital] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.hospitalId) { setLoading(false); return }
    api<{ hospital: any }>(`/api/hospitals/${user.hospitalId}`).then(r => {
      setHospital(r.hospital)
      setForm({
        name: r.hospital.name ?? '',
        description: r.hospital.description ?? '',
        address: r.hospital.address ?? '',
        logoUrl: r.hospital.logoUrl ?? '',
      })
    }).finally(() => setLoading(false))
  }, [user?.hospitalId, refreshKey])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api<{ hospital: any }>(`/api/hospitals/${user!.hospitalId}`, {
        method: 'PATCH', body: JSON.stringify(form),
      })
      setHospital(res.hospital)
      toast({ title: 'Hospital profile updated' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>
  if (!hospital || !form) return <div className="p-6"><p>No hospital associated with your account.</p></div>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Hospital settings</h1>
        <p className="text-muted-foreground mt-1">Manage your hospital&apos;s public profile.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                {hospital.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-lg">{hospital.name}</h2>
                {hospital.verified ? (
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    <ShieldCheck className="size-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-400 text-amber-700">Pending verification</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Building2 className="size-3.5" /> {hospital.members?.length ?? 0} admin{(hospital.members?.length ?? 0) === 1 ? '' : 's'}</span>
                <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {hospital._count?.offers ?? 0} offers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hname"><Building2 className="size-3 inline mr-1" /> Hospital name</Label>
              <Input id="hname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="haddr"><MapPin className="size-3 inline mr-1" /> Address</Label>
              <Textarea id="haddr" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdesc">Description</Label>
              <Textarea id="hdesc" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief overview of your hospital, its specialties, and culture..." />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="size-4 mr-1" /> {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
