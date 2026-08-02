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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Building2, MapPin, Save, Briefcase, Calendar, User, Phone, Camera, Trash2, Upload, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GHANA_REGION_NAMES, getDistrictsForRegion, validateGhanaPhone, validateDigitalAddress } from '@/lib/ghana-data'

const SPECIALTIES = [
  'Emergency Medicine', 'Internal Medicine', 'Cardiology', 'ICU Nursing',
  'Pediatric Nursing', 'Anesthesiology', 'Family Medicine', 'Diagnostic Radiology',
  'Obstetrics & Gynecology', 'Physiotherapy', 'Pharmacy', 'Geriatrics',
  'Psychology', 'Surgery', 'Orthopaedics', 'Psychiatry',
  'Dentistry', 'Optometry', 'Midwifery', 'General Nursing',
  'Public Health', 'Nutrition & Dietetics', 'Medical Laboratory Science',
  'Radiography', 'Occupational Therapy', 'Speech Therapy',
  'Biomedical Engineering', 'Health Administration',
  'Other',
]

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function StaffProfile() {
  const { user, setUser } = useApp()
  const { toast } = useToast()
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setForm({
        // Existing fields
        name: user.name ?? '',
        specialty: user.specialty ?? '',
        specialtyOther: user.specialtyOther ?? '',
        experienceYears: user.experienceYears ?? '',
        location: user.location ?? '',
        availability: user.availability ?? '',
        bio: user.bio ?? '',
        preferredTypes: (user.preferredTypes ?? '').split(',').filter(Boolean),
        // Personal info
        profilePhoto: user.profilePhoto ?? '',
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
      setPhotoPreview(user.profilePhoto ?? null)
    }
  }, [user])

  if (!form) {
    return (
      <div className="p-6">
        <Skeleton className="h-9 w-72 mb-4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
    // Clear error when user edits
    if (errors[k as string]) {
      setErrors(prev => { const n = { ...prev }; delete n[k as string]; return n })
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload a JPG, PNG, or WEBP image.' })
      return
    }
    // Validate size
    if (file.size > MAX_PHOTO_SIZE) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 5MB.' })
      return
    }

    setUploadingPhoto(true)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPhotoPreview(dataUrl)
      set('profilePhoto', dataUrl)
      setUploadingPhoto(false)
      toast({ title: 'Photo ready', description: 'Click "Save changes" to persist.' })
    }
    reader.onerror = () => {
      setUploadingPhoto(false)
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not read the file.' })
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhotoPreview(null)
    set('profilePhoto', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast({ title: 'Photo removed', description: 'Click "Save changes" to persist.' })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = 'Full name is required'
    if (!form.phoneNumber?.trim()) e.phoneNumber = 'Phone number is required'
    else {
      const phoneCheck = validateGhanaPhone(form.phoneNumber)
      if (!phoneCheck.valid) e.phoneNumber = phoneCheck.error!
    }
    if (!form.region) e.region = 'Region is required'
    if (!form.townCity?.trim()) e.townCity = 'Town/City is required'
    if (!form.streetAddress?.trim()) e.streetAddress = 'Street address is required'
    if (form.digitalAddress) {
      const addrCheck = validateDigitalAddress(form.digitalAddress)
      if (!addrCheck.valid) e.digitalAddress = addrCheck.error!
    }
    if (form.specialty === 'Other' && !form.specialtyOther?.trim()) {
      e.specialtyOther = 'Please specify your specialty'
    }
    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast({ variant: 'destructive', title: 'Please fix the errors', description: `${Object.keys(e).length} field(s) need attention.` })
    }
    return Object.keys(e).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears !== '' && form.experienceYears != null ? Number(form.experienceYears) : null,
        preferredTypes: form.preferredTypes,
        dateOfBirth: form.dateOfBirth || null,
      }
      const res = await api<{ user: any }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground mt-1">Keep your info current — hospitals see this when you apply.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ────────────── Profile Photo ────────────── */}
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="size-24 border-4 border-background shadow-lg">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt={form.name} />
                  ) : null}
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-semibold">
                    {form.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 size-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                    {uploadingPhoto ? (
                      <><RefreshCw className="size-4 mr-2 animate-spin" /> Uploading…</>
                    ) : photoPreview ? (
                      <><Camera className="size-4 mr-2" /> Change photo</>
                    ) : (
                      <><Upload className="size-4 mr-2" /> Upload photo</>
                    )}
                  </Button>
                  {photoPreview && (
                    <Button type="button" variant="ghost" onClick={removePhoto}>
                      <Trash2 className="size-4 mr-2 text-rose-500" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, JPEG, PNG, or WEBP. Maximum 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────── Personal Information ────────────── */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name"><User className="size-3 inline mr-1" /> Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  className={errors.name ? 'border-rose-400' : ''}
                />
                {errors.name && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber"><Phone className="size-3 inline mr-1" /> Phone Number * <span className="text-muted-foreground">(Ghana +233)</span></Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => set('phoneNumber', e.target.value)}
                  placeholder="0241234567"
                  required
                  className={errors.phoneNumber ? 'border-rose-400' : form.phoneNumber && validateGhanaPhone(form.phoneNumber).valid ? 'border-emerald-400' : ''}
                />
                {errors.phoneNumber && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.phoneNumber}</p>}
                {form.phoneNumber && !errors.phoneNumber && validateGhanaPhone(form.phoneNumber).valid && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" />Valid Ghana number</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user!.email}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth"><Calendar className="size-3 inline mr-1" /> Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender || '__none__'} onValueChange={(v) => set('gender', v === '__none__' ? '' : v)}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────── Professional Info ────────────── */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <CardHeader><CardTitle className="text-base">Professional Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty"><Briefcase className="size-3 inline mr-1" /> Specialty / Role</Label>
                <Select value={form.specialty || '__none__'} onValueChange={(v) => set('specialty', v === '__none__' ? '' : v)}>
                  <SelectTrigger id="specialty"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Years of experience</Label>
                <Input id="exp" type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
              </div>
            </div>
            {form.specialty === 'Other' && (
              <div className="space-y-2 animate-fade-in-up">
                <Label htmlFor="specialtyOther">Please specify your specialty</Label>
                <Input
                  id="specialtyOther"
                  value={form.specialtyOther}
                  onChange={(e) => set('specialtyOther', e.target.value)}
                  placeholder="e.g. Nuclear Medicine"
                  className={errors.specialtyOther ? 'border-rose-400' : ''}
                />
                {errors.specialtyOther && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.specialtyOther}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="avail"><Calendar className="size-3 inline mr-1" /> Availability</Label>
              <Input id="avail" value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="e.g. Weekends, evenings" />
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
              <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief summary of your background, specialty interests, and what you're looking for..." />
            </div>
          </CardContent>
        </Card>

        {/* ────────────── Address Information (Ghana) ────────────── */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4" /> Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region * <span className="text-muted-foreground">(Ghana)</span></Label>
                <Select
                  value={form.region || '__none__'}
                  onValueChange={(v) => {
                    const region = v === '__none__' ? '' : v
                    setForm((f: any) => ({ ...f, region, district: '' })) // reset district when region changes
                  }}
                >
                  <SelectTrigger id="region" className={errors.region ? 'border-rose-400' : ''}><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {GHANA_REGION_NAMES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.region}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District / Municipality</Label>
                <Select
                  value={form.district || '__none__'}
                  onValueChange={(v) => set('district', v === '__none__' ? '' : v)}
                  disabled={!form.region}
                >
                  <SelectTrigger id="district" disabled={!form.region}>
                    <SelectValue placeholder={form.region ? 'Select district' : 'Select region first'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {form.region ? `${districts.length} districts available` : 'Select a region to enable districts'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="townCity">Town / City *</Label>
                <Input
                  id="townCity"
                  value={form.townCity}
                  onChange={(e) => set('townCity', e.target.value)}
                  placeholder="e.g. Kumasi"
                  required
                  className={errors.townCity ? 'border-rose-400' : ''}
                />
                {errors.townCity && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.townCity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <Input
                  id="streetAddress"
                  value={form.streetAddress}
                  onChange={(e) => set('streetAddress', e.target.value)}
                  placeholder="e.g. 12 Adum Road"
                  required
                  className={errors.streetAddress ? 'border-rose-400' : ''}
                />
                {errors.streetAddress && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.streetAddress}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="landmark"
                  value={form.landmark}
                  onChange={(e) => set('landmark', e.target.value)}
                  placeholder="e.g. Near Adum Market"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digitalAddress">Digital Address <span className="text-muted-foreground">(GhanaPost GPS)</span></Label>
                <Input
                  id="digitalAddress"
                  value={form.digitalAddress}
                  onChange={(e) => set('digitalAddress', e.target.value.toUpperCase())}
                  placeholder="GA-123-4567"
                  className={errors.digitalAddress ? 'border-rose-400' : form.digitalAddress && validateDigitalAddress(form.digitalAddress).valid ? 'border-emerald-400' : ''}
                />
                {errors.digitalAddress && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="size-3" />{errors.digitalAddress}</p>}
                {form.digitalAddress && !errors.digitalAddress && validateDigitalAddress(form.digitalAddress).valid && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" />Valid format</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ────────────── Save Button ────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sticky bottom-4 z-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg border p-3 flex items-center justify-between gap-4 shadow-lg w-full sm:w-auto">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {Object.keys(errors).length > 0 ? `${Object.keys(errors).length} field(s) need attention` : 'All required fields filled'}
            </p>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              {saving ? (
                <><RefreshCw className="size-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="size-4 mr-2" /> Save changes</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// End of component
