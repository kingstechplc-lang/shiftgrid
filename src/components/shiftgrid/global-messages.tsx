'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Send, Globe, Users, User, Mail, Loader2, CheckCircle2, Search, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function GlobalMessages() {
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [recipientType, setRecipientType] = useState<'all' | 'staff' | 'admins' | 'specific'>('all')
  const [specificUserId, setSpecificUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [allowReplies, setAllowReplies] = useState(true)
  const [lastSent, setLastSent] = useState<{ count: number } | null>(null)

  useEffect(() => {
    api<{ items: any[] }>('/api/super/users').then(r => setUsers(r.items)).catch(() => {})
  }, [])

  // Filter users by search query
  const filteredUsers = userSearch
    ? users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.registrationId || '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : users

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !body) {
      toast({ variant: 'destructive', title: 'Subject and body required' })
      return
    }
    if (recipientType === 'specific' && !specificUserId) {
      toast({ variant: 'destructive', title: 'Select a recipient' })
      return
    }
    setSending(true)
    try {
      const res = await api<{ success: boolean; sentTo: number }>('/api/super/global-message', {
        method: 'POST',
        body: JSON.stringify({
          recipientType,
          recipientId: recipientType === 'specific' ? specificUserId : undefined,
          subject,
          body,
          allowReplies,
        }),
      })
      setLastSent({ count: res.sentTo })
      toast({ title: 'Message sent', description: `Delivered to ${res.sentTo} recipient${res.sentTo === 1 ? '' : 's'}` })
      setSubject('')
      setBody('')
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Send className="size-7" /> Global Messages
        </h1>
        <p className="text-muted-foreground mt-1">Send messages to all users, specific groups, or individual users.</p>
      </div>

      {lastSent && (
        <Card className="mb-6 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 animate-in fade-in zoom-in duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <div>
              <div className="font-medium text-sm">Message delivered successfully</div>
              <div className="text-xs text-muted-foreground">Sent to {lastSent.count} recipient{lastSent.count === 1 ? '' : 's'}</div>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setLastSent(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSend} className="space-y-6">
        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-50">
          <CardHeader><CardTitle className="text-base">Recipients</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><Globe className="size-4 inline mr-2" /> All users (staff + admins)</SelectItem>
                  <SelectItem value="staff"><Users className="size-4 inline mr-2" /> All healthcare staff</SelectItem>
                  <SelectItem value="admins"><Building2 className="size-4 inline mr-2" /> All hospital admins</SelectItem>
                  <SelectItem value="specific"><User className="size-4 inline mr-2" /> Specific user</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === 'specific' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>Select user</Label>
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or registration ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* User dropdown (filtered) */}
                <Select value={specificUserId} onValueChange={setSpecificUserId}>
                  <SelectTrigger><SelectValue placeholder={`${filteredUsers.length} users${userSearch ? ' match' : ' available'}`} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email}){u.registrationId ? ` — ${u.registrationId}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userSearch && filteredUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No users match your search.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
              <Mail className="size-4 text-violet-600 shrink-0" />
              <p className="text-xs text-violet-800 dark:text-violet-300">
                {recipientType === 'all' && 'This message will be sent to ALL active users on the platform.'}
                {recipientType === 'staff' && 'This message will be sent to all active healthcare staff.'}
                {recipientType === 'admins' && 'This message will be sent to all active hospital and super admins.'}
                {recipientType === 'specific' && 'This message will be sent to the selected user only.'}
              </p>
            </div>

            {/* Allow replies toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border-2 border-violet-200 dark:border-violet-800">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="size-4" /> Allow replies
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allowReplies ? 'Recipients can reply to this message.' : 'Recipients cannot reply — this is a one-way notification.'}
                </p>
              </div>
              <Switch checked={allowReplies} onCheckedChange={setAllowReplies} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader><CardTitle className="text-base">Message Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-rose-500">*</span></Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Platform maintenance notice"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message <span className="text-rose-500">*</span></Label>
              <Textarea
                id="body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                required
              />
            </div>
            {!allowReplies && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  ℹ️ A note will be appended to the message indicating replies are disabled.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <Button type="submit" disabled={sending} className="bg-violet-600 hover:bg-violet-700 h-11 px-8">
            {sending ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><Send className="size-4 mr-2" /> Send message</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

import { Building2 } from 'lucide-react'
