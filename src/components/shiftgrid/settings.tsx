'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Settings, Moon, Sun, Monitor, Bell, Globe, LogOut, User, ShieldCheck, MessageSquare, Lock, Eye, EyeOff } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export function SettingsView() {
  const { user, setUser } = useApp()
  const { toast } = useToast()
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(false)
  const [language, setLanguage] = useState('en')
  const [canReceiveMessages, setCanReceiveMessages] = useState(user?.canReceiveMessages !== 'false')
  const [savingMessages, setSavingMessages] = useState(false)

  async function handleToggleMessages(checked: boolean) {
    setCanReceiveMessages(checked)
    setSavingMessages(true)
    try {
      const res = await api<{ user: any }>('/api/settings/messages', {
        method: 'PATCH',
        body: JSON.stringify({ canReceiveMessages: checked }),
      })
      setUser({ ...user!, ...res.user })
      toast({
        title: checked ? 'Messages enabled' : 'Messages locked',
        description: checked
          ? 'Other users can now send you messages.'
          : 'Other users can no longer send you messages.',
      })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
      setCanReceiveMessages(!checked) // revert
    } finally {
      setSavingMessages(false)
    }
  }

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
        {/* Account info card with registration ID */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="size-12 rounded-full object-cover" />
              ) : (
                <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 font-semibold">
                  {user?.name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              {user?.registrationId && (
                <Badge variant="outline" className="font-mono text-xs bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700">
                  {user.registrationId}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div className="font-medium capitalize">{user?.role.replace('_', ' ')}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Auth Provider</Label>
                <div className="font-medium capitalize">{user?.authProvider}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email Verified</Label>
                <div className="font-medium flex items-center gap-1">
                  {user?.emailVerified ? <><ShieldCheck className="size-3 text-emerald-600" /> Yes</> : 'Pending'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Account Status</Label>
                <div className="font-medium capitalize">{user?.status}</div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Super Admin: Message Lock */}
        {user?.role === 'super_admin' && (
          <Card className="border-2 border-violet-300 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <ShieldCheck className="size-4" /> Super Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="size-4" /> Allow incoming messages
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canReceiveMessages
                      ? 'Other users can send you direct messages.'
                      : 'Other users cannot send you messages. You appear as "locked" to them.'}
                  </p>
                </div>
                <Switch
                  checked={canReceiveMessages}
                  onCheckedChange={handleToggleMessages}
                  disabled={savingMessages}
                />
              </div>
              {!canReceiveMessages && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                  <Lock className="size-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Messages are currently locked. Users who try to message you will see a notification that you&apos;re not accepting messages.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Language */}
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
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

        {/* Sign out */}
        <Card className="border-2 border-rose-200 dark:border-rose-900 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardContent className="p-4">
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
