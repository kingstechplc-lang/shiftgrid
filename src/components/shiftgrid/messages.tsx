'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Send, ArrowLeft, Building2, Search, Lock, ShieldCheck, MessageSquare, X } from 'lucide-react'
import { timeAgo } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export function Messages() {
  const { user, selectedConversationUserId, selectedConversationOfferId } = useApp()
  const [threads, setThreads] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(selectedConversationUserId)
  const [activeOfferId, setActiveOfferId] = useState<string | null>(selectedConversationOfferId)
  const [messages, setMessages] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(activePartner ? 'thread' : 'list')
  const [search, setSearch] = useState('')
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const isSuperAdmin = user?.role === 'super_admin'

  useEffect(() => {
    Promise.all([
      api<{ items: any[] }>('/api/messages'),
      api<{ items: any[] }>('/api/conversations'),
    ]).then(([t, p]) => {
      setThreads(t.items)
      setPartners(p.items)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (activePartner) {
      setMobileView('thread')
      setBlockedMessage(null)
      const url = activeOfferId ? `/api/messages?withUserId=${activePartner}&offerId=${activeOfferId}` : `/api/messages?withUserId=${activePartner}`
      api<{ items: any[] }>(url).then(r => {
        setMessages(r.items)
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      api<{ items: any[] }>('/api/messages').then(r => setThreads(r.items))
    }
  }, [activePartner, activeOfferId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activePartner) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activePartner, body: draft, offerId: activeOfferId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          setBlockedMessage(data.error)
          toast({ variant: 'destructive', title: 'Message blocked', description: data.error })
        } else {
          throw new Error(data.error || 'Failed to send')
        }
        return
      }
      setDraft('')
      const url = activeOfferId ? `/api/messages?withUserId=${activePartner}&offerId=${activeOfferId}` : `/api/messages?withUserId=${activePartner}`
      const r = await api<{ items: any[] }>(url)
      setMessages(r.items)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      const t = await api<{ items: any[] }>('/api/messages')
      setThreads(t.items)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Send failed', description: e.message })
    } finally {
      setSending(false)
    }
  }

  function openThread(partnerId: string, offerId?: string | null) {
    setActivePartner(partnerId)
    setActiveOfferId(offerId ?? null)
    setMobileView('thread')
  }

  if (loading) return <div className="p-6"><Skeleton className="h-9 w-72 mb-4" /><Skeleton className="h-96" /></div>

  const threadPartnerIds = new Set(threads.map(t => t.partnerId))
  const partnerNoThread = partners.filter(p => !threadPartnerIds.has(p.id))

  // Filter threads by search
  const filteredThreads = search
    ? threads.filter(t =>
        t.partnerName?.toLowerCase().includes(search.toLowerCase()) ||
        t.preview?.toLowerCase().includes(search.toLowerCase())
      )
    : threads

  // Super admin gets a unique purple/gold themed design
  const themeClass = isSuperAdmin
    ? 'from-violet-600 via-purple-600 to-fuchsia-600'
    : 'from-emerald-600 via-teal-600 to-emerald-700'

  const accentClass = isSuperAdmin ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'
  const bubbleClass = isSuperAdmin ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${themeClass} text-white`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSuperAdmin && <ShieldCheck className="size-5" />}
            <h1 className="text-xl font-bold">
              {isSuperAdmin ? 'Super Admin Messages' : 'Messages'}
            </h1>
            {isSuperAdmin && (
              <Badge className="bg-white/20 text-white border-0 ml-2">PLATFORM-WIDE</Badge>
            )}
          </div>
          {isSuperAdmin && user?.canReceiveMessages === 'false' && (
            <Badge className="bg-amber-500/30 text-amber-100 border border-amber-300/50">
              <Lock className="size-3 mr-1" /> Messages locked
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 max-w-6xl mx-auto w-full">
        {/* Thread list */}
        <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-80 border-r bg-background overflow-y-auto`}>
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {filteredThreads.length === 0 && partnerNoThread.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet.</p>
              <p className="mt-1 text-xs">Start one from an offer or application.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredThreads.map(t => (
                <button
                  key={`${t.partnerId}:${t.offerId ?? ''}`}
                  onClick={() => openThread(t.partnerId, t.offerId)}
                  className={`w-full p-3 text-left hover:bg-muted transition-colors ${activePartner === t.partnerId && activeOfferId === (t.offerId ?? null) ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.partnerPhoto ? (
                      <img src={t.partnerPhoto} alt={t.partnerName} className="size-9 rounded-full object-cover" />
                    ) : (
                      <Avatar className="size-9">
                        <AvatarFallback className={`text-xs ${isSuperAdmin ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {t.partnerName?.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">{t.partnerName}</span>
                        {t.partnerRole === 'super_admin' && <ShieldCheck className="size-3 text-violet-600 shrink-0" />}
                      </div>
                      {t.partnerHospital && <div className="text-xs text-muted-foreground truncate">{t.partnerHospital}</div>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(t.lastAt).replace(' ago', '')}</span>
                  </div>
                  {t.offerTitle && <div className="text-xs text-muted-foreground mb-0.5 truncate">Re: {t.offerTitle}</div>}
                  <div className="text-xs text-muted-foreground truncate">{t.mine ? 'You: ' : ''}{t.preview}</div>
                </button>
              ))}
              {partnerNoThread.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase())).map(p => (
                <button
                  key={p.id}
                  onClick={() => openThread(p.id, null)}
                  className="w-full p-3 text-left hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    {p.profilePhoto ? (
                      <img src={p.profilePhoto} alt={p.name} className="size-9 rounded-full object-cover" />
                    ) : (
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs bg-slate-100 text-slate-700">
                          {p.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      {p.hospital?.name && <div className="text-xs text-muted-foreground truncate">{p.hospital.name}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Active conversation */}
        <section className={`${mobileView === 'thread' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-w-0`}>
          {activePartner ? (
            <>
              <header className="p-3 border-b bg-background flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileView('list')}>
                  <ArrowLeft className="size-4" />
                </Button>
                {(() => {
                  const partner = partners.find(p => p.id === activePartner)
                  const thread = threads.find(t => t.partnerId === activePartner && (t.offerId ?? null) === (activeOfferId ?? null))
                  const name = partner?.name ?? thread?.partnerName ?? 'Conversation'
                  const photo = partner?.profilePhoto ?? thread?.partnerPhoto
                  const hospital = partner?.hospital?.name ?? thread?.partnerHospital
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      {photo ? (
                        <img src={photo} alt={name} className="size-9 rounded-full object-cover" />
                      ) : (
                        <Avatar className="size-9">
                          <AvatarFallback className={`text-xs ${isSuperAdmin ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate flex items-center gap-1">
                          {name}
                          {partner?.role === 'super_admin' && <ShieldCheck className="size-3 text-violet-600" />}
                        </div>
                        {hospital && <div className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="size-3" />{hospital}</div>}
                      </div>
                    </div>
                  )
                })()}
                {activeOfferId && (
                  <Badge variant="outline" className="ml-auto text-[10px] max-w-48 truncate">
                    {threads.find(t => t.partnerId === activePartner && t.offerId === activeOfferId)?.offerTitle ?? 'Offer'}
                  </Badge>
                )}
              </header>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${isSuperAdmin ? 'bg-gradient-to-b from-violet-50/50 to-background dark:from-violet-950/10' : 'bg-muted/30'}`}>
                {blockedMessage && (
                  <div className="flex justify-center mb-3">
                    <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Lock className="size-4" />
                      {blockedMessage}
                    </div>
                  </div>
                )}
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation.</p>
                ) : messages.map(m => {
                  const mine = m.senderId === user!.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? `${bubbleClass} rounded-br-md` : 'bg-background border rounded-bl-md'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>{timeAgo(m.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>

              {/* Send box */}
              <form onSubmit={handleSend} className="p-3 border-t bg-background flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={blockedMessage ? 'Messages are locked' : 'Type a message...'}
                  className="flex-1"
                  disabled={!!blockedMessage}
                />
                <Button type="submit" size="icon" disabled={sending || !draft.trim() || !!blockedMessage} className={accentClass}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageSquare className={`size-12 mx-auto mb-3 opacity-50 ${isSuperAdmin ? 'text-violet-400' : 'text-muted-foreground'}`} />
                <h3 className="font-medium">Select a conversation</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a thread from the left to view messages.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
