'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import type { SafeUser } from '@/lib/types'
import { AuthScreen } from '@/components/shiftgrid/auth-screen'
import { AppShell } from '@/components/shiftgrid/app-shell'
import { StaffHome, AdminDashboard } from '@/components/shiftgrid/dashboards'
import { BrowseOffers } from '@/components/shiftgrid/browse'
import { OfferDetail } from '@/components/shiftgrid/offer-detail'
import { MyApplications } from '@/components/shiftgrid/my-applications'
import { SavedOffers } from '@/components/shiftgrid/saved-offers'
import { StaffProfile } from '@/components/shiftgrid/staff-profile'
import { Credentials } from '@/components/shiftgrid/credentials'
import { Messages } from '@/components/shiftgrid/messages'
import { Notifications } from '@/components/shiftgrid/notifications'
import { OfferForm } from '@/components/shiftgrid/offer-form'
import { AdminOffersList } from '@/components/shiftgrid/admin-offers-list'
import { AdminOfferDetail } from '@/components/shiftgrid/admin-offer-detail'
import { CandidateProfile } from '@/components/shiftgrid/candidate-profile'
import { HospitalSettings } from '@/components/shiftgrid/hospital-settings'
import { TeamManagement } from '@/components/shiftgrid/team-management'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user, setUser, view, selectedOfferId, selectedApplicationId } = useApp()
  const [booting, setBooting] = useState(true)

  // Boot — fetch current user
  useEffect(() => {
    api<{ user: SafeUser | null }>('/api/auth/me').then(r => {
      if (r.user) setUser(r.user)
    }).finally(() => setBooting(false))
  }, [setUser])

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <AppShell user={user}>
      <ViewRouter view={view} user={user} selectedOfferId={selectedOfferId} selectedApplicationId={selectedApplicationId} />
    </AppShell>
  )
}

function ViewRouter({ view, user, selectedOfferId, selectedApplicationId }: { view: string; user: SafeUser; selectedOfferId: string | null; selectedApplicationId: string | null }) {
  // Staff views
  if (user.role === 'staff') {
    switch (view) {
      case 'home': return <StaffHome />
      case 'browse': return <BrowseOffers />
      case 'offer': return selectedOfferId ? <OfferDetail offerId={selectedOfferId} /> : <BrowseOffers />
      case 'applications': return <MyApplications />
      case 'saved': return <SavedOffers />
      case 'profile': return <StaffProfile />
      case 'credentials': return <Credentials />
      case 'messages': return <Messages />
      case 'notifications': return <Notifications />
      default: return <StaffHome />
    }
  }

  // Admin views
  if (user.role === 'hospital_admin' || user.role === 'super_admin') {
    switch (view) {
      case 'dashboard': return <AdminDashboard />
      case 'offers': return <AdminOffersList />
      case 'offer-edit': return <OfferForm />
      case 'offer-detail': return selectedOfferId ? <AdminOfferDetail offerId={selectedOfferId} /> : <AdminOffersList />
      case 'candidate': return selectedApplicationId ? <CandidateProfile applicationId={selectedApplicationId} /> : <AdminOffersList />
      case 'messages': return <Messages />
      case 'notifications': return <Notifications />
      case 'hospital': return <HospitalSettings />
      case 'team': return <TeamManagement />
      default: return <AdminDashboard />
    }
  }

  return null
}
