'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Settings, Moon, Sun, Monitor, Bell, Globe, LogOut, User, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export function SettingsView() {
  const { user } = useApp()
  const { toast } = useToast()
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(false)
  const [language, setLanguage] = useState('en')

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-7" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="size-4" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred color scheme</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive emails about your applications and offers</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">In-app notifications for messages and updates</p>
              </div>
              <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SMS notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Text alerts for urgent shifts (charges may apply)</p>
              </div>
              <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" /> Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Language</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select your preferred language</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tw">Twi</SelectItem>
                  <SelectItem value="ga">Ga</SelectItem>
                  <SelectItem value="ee">Ewe</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {user?.authProvider === 'google' ? 'Google' : 'Email'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
              {user?.emailVerified && <ShieldCheck className="size-4 text-emerald-600" />}
            </div>
            <Separator />
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
