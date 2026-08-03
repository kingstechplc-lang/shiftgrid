'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  HeartPulse, LayoutDashboard, Briefcase, Inbox, Bookmark,
  User, MessageSquare, Bell, Building2, Users, Settings,
  LogOut, Menu, FileText, Search, ShieldCheck, Stethoscope, Globe, Send, ImagePlus, ImageIcon, X,
} from 'lucide-react'
import { SidebarAd, MobileStickyAd } from './ad-slot'
import type { View } from '@/lib/store'
import type { SafeUser } from '@/lib/types'

type NavItem = { view: View; label: string; icon: React.ReactNode }

const STAFF_NAV: NavItem[] = [
  { view: 'home', label: 'Home', icon: <LayoutDashboard className="size-4" /> },
  { view: 'browse', label: 'Browse offers', icon: <Search className="size-4" /> },
  { view: 'applications', label: 'My applications', icon: <Inbox className="size-4" /> },
  { view: 'saved', label: 'Saved offers', icon: <Bookmark className="size-4" /> },
  { view: 'messages', label: 'Messages', icon: <MessageSquare className="size-4" /> },
  { view: 'profile', label: 'Profile', icon: <User className="size-4" /> },
  { view: 'credentials', label: 'Credentials', icon: <FileText className="size-4" /> },
  { view: 'notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
  { view: 'settings', label: 'Settings', icon: <Settings className="size-4" /> },
]

const ADMIN_NAV: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
  { view: 'offers', label: 'Offers', icon: <Briefcase className="size-4" /> },
  { view: 'messages', label: 'Messages', icon: <MessageSquare className="size-4" /> },
  { view: 'hospital', label: 'Hospital settings', icon: <Building2 className="size-4" /> },
  { view: 'team', label: 'Team', icon: <Users className="size-4" /> },
  { view: 'notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
  { view: 'settings', label: 'Settings', icon: <Settings className="size-4" /> },
]

const SUPER_ADMIN_NAV: NavItem[] = [
  { view: 'super-dashboard', label: 'Platform Overview', icon: <ShieldCheck className="size-4" /> },
  { view: 'super-hospitals', label: 'Hospitals', icon: <Building2 className="size-4" /> },
  { view: 'super-users', label: 'Users', icon: <Users className="size-4" /> },
  { view: 'super-offers', label: 'All Offers', icon: <Briefcase className="size-4" /> },
  { view: 'super-banners', label: 'Banners', icon: <ImagePlus className="size-4" /> },
  { view: 'super-media', label: 'Media Library', icon: <ImageIcon className="size-4" /> },
  { view: 'super-messages', label: 'Global Messages', icon: <Send className="size-4" /> },
  { view: 'messages', label: 'My Messages', icon: <MessageSquare className="size-4" /> },
  { view: 'notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
  { view: 'settings', label: 'Settings', icon: <Settings className="size-4" /> },
]

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const { view, setView } = useApp()
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = user.role === 'super_admin' ? SUPER_ADMIN_NAV : user.role === 'staff' ? STAFF_NAV : ADMIN_NAV

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const r = await api<{ unreadMessages: number; unreadNotifications: number }>('/api/unread-counts')
        if (cancelled) return
        setUnreadNotifs(r.unreadNotifications || 0)
        setUnreadMsgs(r.unreadMessages || 0)
      } catch {}
    }
    run()
    const i = setInterval(run, 60000)
    return () => { cancelled = true; clearInterval(i) }
  }, [user.id])

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  function initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-5 border-b">
        <div className="size-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
          <HeartPulse className="size-5" />
        </div>
        <div>
          <div className="font-semibold leading-none">ShiftGrid</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'staff' ? 'Healthcare professional' : 'Hospital admin'}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = view === item.view || (view === 'offer' && item.view === 'browse') || (view === 'offer-detail' && item.view === 'offers') || (view === 'offer-edit' && item.view === 'offers') || (view === 'candidate' && item.view === 'offers')
          const badge = item.view === 'notifications' ? unreadNotifs : item.view === 'messages' ? unreadMsgs : 0
          return (
            <button
              key={item.view}
              onClick={() => { setView(item.view); setMobileOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span className="bg-rose-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-semibold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-2 py-2">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="size-9 rounded-full object-cover" />
          ) : (
            <Avatar className="size-9">
              <AvatarFallback className={`text-xs font-semibold ${user.role === 'super_admin' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            {user.registrationId && (
              <div className="text-[10px] font-mono text-muted-foreground truncate">{user.registrationId}</div>
            )}
          </div>
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start mt-1 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="size-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  )

  // Only show ads to staff users (not admins/super admins)
  const showAds = user.role === 'staff'
  const [adDismissed, setAdDismissed] = useState(false)

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-background border-r sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="size-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
              <HeartPulse className="size-4" />
            </div>
            <span className="font-semibold">ShiftGrid</span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setView('notifications')} className="relative">
            <Bell className="size-5" />
            {unreadNotifs > 0 && <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full" />}
          </Button>
        </header>

        <div className="flex flex-1 min-h-0">
          <main className={`flex-1 min-w-0 ${showAds ? 'pb-16 lg:pb-0' : ''}`}>{children}</main>

          {/* Right sidebar ad — desktop only, staff only */}
          {showAds && (
            <aside className="hidden xl:block w-48 shrink-0 p-4 border-l bg-background/50">
              <SidebarAd />
            </aside>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom ad — mobile only, staff only, dismissible */}
      {showAds && !adDismissed && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border flex items-center justify-center relative">
          <button
            onClick={() => setAdDismissed(true)}
            className="absolute top-1 right-1 size-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
            aria-label="Dismiss ad"
          >
            <X className="size-3" />
          </button>
          <MobileStickyAd />
        </div>
      )}
    </div>
  )
}
