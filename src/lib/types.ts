// Shared types & helpers for ShiftGrid
export type SafeUser = {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'hospital_admin' | 'staff'
  authProvider: string
  emailVerified: Date | null
  status: string
  registrationId: string | null
  website: string | null
  canReceiveMessages: string
  hospitalId: string | null
  hospital?: { id: string; name: string; verified: boolean } | null
  specialty: string | null
  specialtyOther: string | null
  experienceYears: number | null
  resumeUrl: string | null
  availability: string | null
  bio: string | null
  location: string | null
  preferredTypes: string | null
  // Personal info
  profilePhoto: string | null
  phoneNumber: string | null
  dateOfBirth: Date | null
  gender: string | null
  // Address info
  region: string | null
  district: string | null
  townCity: string | null
  streetAddress: string | null
  landmark: string | null
  digitalAddress: string | null
  createdAt: Date
}

export type OfferWithRelations = {
  id: string
  hospitalId: string
  createdById: string
  type: 'locum' | 'permanent'
  title: string
  specialty: string | null
  description: string | null
  requirements: string | null
  location: string | null
  status: 'draft' | 'published' | 'closed' | 'filled'
  visibility: 'public' | 'internal'
  deadline: Date | null
  shiftStart: Date | null
  shiftEnd: Date | null
  rate: number | null
  rateUnit: string | null
  urgent: boolean
  employmentType: string | null
  salaryMin: number | null
  salaryMax: number | null
  benefits: string | null
  createdAt: Date
  updatedAt: Date
  hospital: { id: string; name: string; verified: boolean; address: string | null }
  _count?: { applications: number }
}

export type ApplicationWithRelations = {
  id: string
  offerId: string
  userId: string
  status: 'applied' | 'under_review' | 'shortlisted' | 'offered' | 'accepted' | 'declined' | 'withdrawn'
  coverNote: string | null
  appliedAt: Date
  updatedAt: Date
  offer?: OfferWithRelations
  user?: SafeUser & { credentials?: any[] }
}

export function parseRequirements(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export function parsePreferredTypes(raw: string | null): ('locum' | 'permanent')[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean) as any
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  // Ghana Cedis — platform is Ghana-focused
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(n)
}

export function formatDateTime(d: Date | string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(d: Date | string): string {
  const date = new Date(d)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(d)
}

export function daysUntil(d: Date | string | null): number | null {
  if (!d) return null
  const date = new Date(d)
  return Math.ceil((date.getTime() - Date.now()) / (24 * 3600 * 1000))
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    applied: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    shortlisted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    offered: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    declined: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    withdrawn: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    draft: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    closed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    filled: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  }
  return map[status] ?? 'bg-slate-100 text-slate-700'
}

export function labelize(status: string): string {
  return status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}
