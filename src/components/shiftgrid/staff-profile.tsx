'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Building2, MapPin, Save, Briefcase, Calendar, User, Phone, Camera, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GHANA_REGIONS, getDistrictsForRegion, validateGhanaPhone, validateDigitalAddress, SPECIALTIES } from '@/lib/ghana-data'

export function StaffProfile() {
  const { user, setUser } = useApp()
  const { toast } = useToast()
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        specialty: user.specialty ?? '',
        specialtyOther: user.specialtyOther ?? '',
        experienceYears: user.experienceYears ?? '',
        location: user.location ?? '',
        availability: user.availability ?? '',
        bio: user.bio ?? '',
        preferredTypes: (user.preferredTypes ?? '').split(',').filter(Boolean),
        // Personal info
        profilePhoto: user.profilePhoto ?? null,
        phoneNumber: user.phoneNumber ?? '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: user.gender ?? '',
        // Address info
        region: user.region ?? '',
        district: user.district ?? '',
        townCity: user.townCity ?? '',
        streetAddress: user.streetAddress ?? '',
        landmark: user.landmark ?? '',
        digitalAddress: user.digitalAddress ?? '',
      })
    }
  }, [user])

  if (!form) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
    // Clear error for this field
    if (errors[k as string]) {
      setErrors(prev => { const n = { ...prev }; delete n[k as string]; return n })
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'

    // Phone validation (required)
    if (!form.phoneNumber) {
      e.phoneNumber = 'Phone number is required'
    } else {
      const phoneCheck = validateGhanaPhone(form.phoneNumber)
      if (!phoneCheck.valid) e.phoneNumber = phoneCheck.error!
    }

    // Address validation
    if (!form.region) e.region = 'Region is required'
    if (!form.townCity.trim()) e.townCity = 'Town/City is required'
    if (!form.streetAddress.trim()) e.streetAddress = 'Street address is required'

    // Digital address validation (optional)
    if (form.digitalAddress) {
      const addrCheck = validateDigitalAddress(form.digitalAddress)
      if (!addrCheck.valid) e.digitalAddress = addrCheck.error!
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload JPG, JPEG, PNG, or WEBP.' })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 5MB.' })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      set('profilePhoto', data.url)
      toast({ title: 'Photo uploaded', description: 'Your profile photo has been updated.' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRemovePhoto() {
    set('profilePhoto', null)
    // Also save to backend
    api('/api/profile', { method: 'PATCH', body: JSON.stringify({ profilePhoto: null }) }).catch(() => {})
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast({ variant: 'destructive', title: 'Please fix the errors', description: 'Some required fields are missing or invalid.' })
      return
    }
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
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const districts = form.region ? getDistrictsForRegion(form.region) : []

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground mt-1">Keep your info current — hospitals see this when you apply.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ────────────── PROFILE PHOTO ────────────── */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-50">
          <CardHeader><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                {form.profilePhoto ? (
                  <img
                    src={form.profilePhoto}
                    alt="Profile"
                    className="size-24 rounded-full object-cover border-4 border-emerald-100 dark:border-emerald-950"
                  />
                ) : (
                  <Avatar className="size-24 border-4 border-emerald-100 dark:border-emerald-950">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-semibold">
                      {user!.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Camera className="size-4 mr-1" /> {form.profilePhoto ? 'Change photo' : 'Upload photo'}
                  </Button>
                  {form.profilePhoto && (
                    <Button type="button" variant="outline" size="sm" onClick={handleRemovePhoto} className="text-rose-600 hover:bg-rose-50">
                      <X className="size-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, JPEG, PNG, or WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────── PERSONAL INFORMATION ────────────── */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name"><User className="size-3 inline mr-1" /> Full Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  className={errors.name ? 'border-rose-400' : ''}
                />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone"><Phone className="size-3 inline mr-1" /> Phone Number <span className="text-rose-500">*</span></Label>
                <Input
                  id="phone"
                  value={form.phoneNumber}
                  onChange={(e) => set('phoneNumber', e.target.value)}
                  placeholder="0244123456"
                  className={errors.phoneNumber ? 'border-rose-400' : ''}
                />
                {errors.phoneNumber ? (
                  <p className="text-xs text-rose-500">{errors.phoneNumber}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Ghana format: 0244123456 or +233244123456</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user!.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set('gender', v === '__none__' ? '' : v)}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Years of Experience</Label>
                <Input id="exp" type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty"><Briefcase className="size-3 inline mr-1" /> Specialty / Role</Label>
                <Select value={form.specialty || '__none__'} onValueChange={(v) => set('specialty', v === '__none__' ? '' : v)}>
                  <SelectTrigger id="specialty"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avail"><Calendar className="size-3 inline mr-1" /> Availability</Label>
                <Input id="avail" value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="e.g. Weekends, evenings" />
              </div>
            </div>

            {form.specialty === 'Other' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="specialtyOther">Please specify your specialty</Label>
                <Input
                  id="specialtyOther"
                  value={form.specialtyOther}
                  onChange={(e) => set('specialtyOther', e.target.value)}
                  placeholder="e.g. Cardiothoracic Surgery"
                />
              </div>
            )}

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
              <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief summary of your background, specialty interests, and what you're looking for..." />
            </div>
          </CardContent>
        </Card>

        {/* ────────────── ADDRESS INFORMATION ────────────── */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="size-4" /> Address Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region <span className="text-rose-500">*</span></Label>
                <Select
                  value={form.region || '__none__'}
                  onValueChange={(v) => {
                    set('region', v === '__none__' ? '' : v)
                    set('district', '') // Reset district when region changes
                  }}
                >
                  <SelectTrigger id="region" className={errors.region ? 'border-rose-400' : ''}>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {GHANA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-xs text-rose-500">{errors.region}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District / Municipality</Label>
                <Select
                  value={form.district || '__none__'}
                  onValueChange={(v) => set('district', v === '__none__' ? '' : v)}
                  disabled={!form.region}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder={form.region ? 'Select district' : 'Select region first'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!form.region && <p className="text-xs text-muted-foreground">Select a region first</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="townCity">Town / City <span className="text-rose-500">*</span></Label>
                <Input
                  id="townCity"
                  value={form.townCity}
                  onChange={(e) => set('townCity', e.target.value)}
                  placeholder="e.g. Kumasi"
                  className={errors.townCity ? 'border-rose-400' : ''}
                />
                {errors.townCity && <p className="text-xs text-rose-500">{errors.townCity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address <span className="text-rose-500">*</span></Label>
                <Input
                  id="streetAddress"
                  value={form.streetAddress}
                  onChange={(e) => set('streetAddress', e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  className={errors.streetAddress ? 'border-rose-400' : ''}
                />
                {errors.streetAddress && <p className="text-xs text-rose-500">{errors.streetAddress}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="landmark"
                  value={form.landmark}
                  onChange={(e) => set('landmark', e.target.value)}
                  placeholder="e.g. Near Central Mosque"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digitalAddress">Digital Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="digitalAddress"
                  value={form.digitalAddress}
                  onChange={(e) => set('digitalAddress', e.target.value.toUpperCase())}
                  placeholder="GA-123-4567"
                  className={errors.digitalAddress ? 'border-rose-400' : ''}
                />
                {errors.digitalAddress ? (
                  <p className="text-xs text-rose-500">{errors.digitalAddress}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">GhanaPost GPS format: GA-123-4567</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8">
            {saving ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Save className="size-4 mr-2" /> Save changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
