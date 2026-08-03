// Client-side store for ShiftGrid using Zustand
'use client'

import { create } from 'zustand'
import type { SafeUser } from '@/lib/types'

export type View =
  | 'home'
  | 'browse'
  | 'offer'
  | 'applications'
  | 'saved'
  | 'profile'
  | 'credentials'
  | 'messages'
  | 'notifications'
  | 'dashboard'
  | 'offers'
  | 'offer-edit'
  | 'offer-detail'
  | 'candidate'
  | 'hospital'
  | 'team'
  | 'settings'
  // Super admin views
  | 'super-dashboard'
  | 'super-hospitals'
  | 'super-users'
  | 'super-offers'
  | 'super-messages'
  | 'super-banners'
  | 'super-media'
  | 'super-ads'

type AppState = {
  user: SafeUser | null
  setUser: (u: SafeUser | null) => void
  view: View
  setView: (v: View) => void
  // Selected entity IDs for sub-views
  selectedOfferId: string | null
  selectedApplicationId: string | null
  selectedConversationUserId: string | null
  selectedConversationOfferId: string | null
  // Editing state for offer form
  editingOffer: any | null  // null = creating new
  setEditingOffer: (o: any | null) => void
  // Navigation helpers
  openOffer: (id: string) => void
  openOfferDetail: (id: string) => void  // admin view (with pipeline)
  openOfferEdit: (offer?: any | null) => void  // null = new
  openCandidate: (applicationId: string) => void
  openConversation: (userId: string, offerId?: string | null) => void
  // Refresh key — bump to trigger refetch on data screens
  refreshKey: number
  refresh: () => void
}

export const useApp = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  view: 'home',
  setView: (v) => set({ view: v }),
  selectedOfferId: null,
  selectedApplicationId: null,
  selectedConversationUserId: null,
  selectedConversationOfferId: null,
  editingOffer: null,
  setEditingOffer: (o) => set({ editingOffer: o }),
  openOffer: (id) => set({ selectedOfferId: id, view: 'offer' }),
  openOfferDetail: (id) => set({ selectedOfferId: id, view: 'offer-detail' }),
  openOfferEdit: (offer = null) => set({ editingOffer: offer, view: 'offer-edit' }),
  openCandidate: (applicationId) => set({ selectedApplicationId: applicationId, view: 'candidate' }),
  openConversation: (userId, offerId = null) => set({ selectedConversationUserId: userId, selectedConversationOfferId: offerId, view: 'messages' }),
  refreshKey: 0,
  refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}))
