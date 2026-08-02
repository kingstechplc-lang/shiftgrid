'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Building2, MapPin, Save, ShieldCheck, Briefcase, Camera, ImageIcon, X, Loader2, Globe } from "lucide-react"
import { useToast } from '@/hooks/use-toast'

export function HospitalSettings() {
  const { user, refreshKey } = useApp()
  const { toast } = useToast()
  const [hospital, setHospital] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.hospitalId) { setLoading(false); return }
    api<{ hospital: any }>(`/api/hospitals/${user.hospitalId}`).then(r => {
      setHospital(r.hospital)
      setForm({
        name: r.hospital.name ?? '',
        description: r.hospital.description ?? '',
        address: r.hospital.address ?? '',
        logoUrl: r.hospital.logoUrl ?? '',
        bannerUrl: r.hospital.bannerUrl ?? '',
        website: r.hospital.website ?? '',
      })
    }).finally(() => setLoading(false))
  }, [user?.hospitalId, refreshKey])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'JPG, JPEG, PNG, or WEBP only.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 5MB.' })
      return
    }
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/hospital-logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f: any) => ({ ...f, logoUrl: data.url }))
      toast({ title: 'Logo uploaded' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message })
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'JPG, JPEG, PNG, or WEBP only.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 10MB.' })
      return
    }
    setUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/hospital-banner', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f: any) => ({ ...f, bannerUrl: data.url }))
      toast({ title: 'Banner uploaded' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message })
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

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
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Hospital Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your hospital&apos;s public profile.</p>
      </div>

      {/* Banner preview */}
      {form.bannerUrl && (
        <div className="relative rounded-2xl overflow-hidden mb-6 h-40 lg:h-48 animate-in fade-in zoom-in duration-500">
          <img src={form.bannerUrl} alt="Hospital banner" className="w-full h-full object-cover" />
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo + Banner uploads */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-50">
          <CardHeader><CardTitle className="text-base">Hospital Branding</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="size-20 rounded-xl object-cover border-4 border-emerald-100 dark:border-emerald-950" />
                ) : (
                  <Avatar className="size-20 rounded-xl border-4 border-emerald-100 dark:border-emerald-950">
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xl font-semibold">
                      {hospital.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleLogoUpload} className="hidden" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Camera className="size-4 mr-1" /> {form.logoUrl ? 'Change logo' : 'Upload logo'}
                  </Button>
                  {form.logoUrl && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm((f: any) => ({ ...f, logoUrl: '' }))} className="text-rose-600">
                      <X className="size-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Square image, max 5MB. JPG, PNG, WEBP.</p>
              </div>
            </div>

            {/* Banner */}
            <div>
              <input ref={bannerInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleBannerUpload} className="hidden" />
              <Label className="text-sm font-medium">Banner Image</Label>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}>
                  {uploadingBanner ? <Loader2 className="size-4 mr-1 animate-spin" /> : <ImageIcon className="size-4 mr-1" />}
                  {form.bannerUrl ? 'Change banner' : 'Upload banner'}
                </Button>
                {form.bannerUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm((f: any) => ({ ...f, bannerUrl: '' }))} className="text-rose-600">
                    <X className="size-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Wide image (e.g. 1600×400), max 10MB. JPG, PNG, WEBP.</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile details */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Hospital logo" className="size-14 rounded-lg object-cover" />
              ) : (
                <Avatar className="size-14"><AvatarFallback className="bg-violet-100 text-violet-700">{hospital.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-lg">{hospital.name}</h2>
                  {hospital.verified ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700"><ShieldCheck className="size-3 mr-1" /> Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400 text-amber-700">Pending verification</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><Building2 className="size-3.5" /> {hospital.members?.length ?? 0} admin{(hospital.members?.length ?? 0) === 1 ? '' : 's'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {hospital._count?.offers ?? 0} offers</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hname"><Building2 className="size-3 inline mr-1" /> Hospital name</Label>
              <Input id="hname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="haddr"><MapPin className="size-3 inline mr-1" /> Address</Label>
              <Textarea id="haddr" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hwebsite"><Globe className="size-3 inline mr-1" /> Website</Label>
              <Input
                id="hwebsite"
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://your-hospital-website.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdesc">Description</Label>
              <Textarea id="hdesc" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief overview of your hospital, its specialties, and culture..." />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <><Loader2 className="size-4 mr-2 animate-spin" /> Saving…</> : <><Save className="size-4 mr-2" /> Save changes</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
