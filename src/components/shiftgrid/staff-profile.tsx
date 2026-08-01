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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, MapPin, Save, Briefcase, Calendar, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function StaffProfile() {
  const { user, setUser } = useApp()
  const { toast } = useToast()
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        specialty: user.specialty ?? '',
        experienceYears: user.experienceYears ?? '',
        location: user.location ?? '',
        availability: user.availability ?? '',
        bio: user.bio ?? '',
        preferredTypes: (user.preferredTypes ?? '').split(',').filter(Boolean),
      })
    }
  }, [user])

  if (!form) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api<{ user: any }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          preferredTypes: form.preferredTypes,
        }),
      })
      setUser({ ...user!, ...res.user })
      toast({ title: 'Profile updated' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground mt-1">Keep your info current — hospitals see this when you apply.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-semibold">
                  {user!.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-lg">{user!.name}</div>
                <div className="text-sm text-muted-foreground">{user!.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name"><User className="size-3 inline mr-1" /> Full name</Label>
                <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty"><Briefcase className="size-3 inline mr-1" /> Specialty / Role</Label>
                <Input id="specialty" value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="e.g. Emergency Medicine" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Years of experience</Label>
                <Input id="exp" type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc"><MapPin className="size-3 inline mr-1" /> Location</Label>
                <Input id="loc" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City, Province" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avail"><Calendar className="size-3 inline mr-1" /> Availability</Label>
                <Input id="avail" value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="e.g. Weekends, evenings" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred offer types</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.preferredTypes.includes('locum')}
                    onCheckedChange={(v) => {
                      if (v) set('preferredTypes', [...form.preferredTypes, 'locum'])
                      else set('preferredTypes', form.preferredTypes.filter((t: string) => t !== 'locum'))
                    }}
                  />
                  <span>Locum (temporary / shift-based)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.preferredTypes.includes('permanent')}
                    onCheckedChange={(v) => {
                      if (v) set('preferredTypes', [...form.preferredTypes, 'permanent'])
                      else set('preferredTypes', form.preferredTypes.filter((t: string) => t !== 'permanent'))
                    }}
                  />
                  <span>Permanent</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={5} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief summary of your background, specialty interests, and what you're looking for..." />
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
