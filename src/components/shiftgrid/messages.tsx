'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, ArrowLeft, Building2 } from 'lucide-react'
import { timeAgo } from '@/lib/types'

export function Messages() {
  const { user, selectedConversationUserId, selectedConversationOfferId, setView } = useApp()
  const [threads, setThreads] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(selectedConversationUserId)
  const [activeOfferId, setActiveOfferId] = useState<string | null>(selectedConversationOfferId)
  const [messages, setMessages] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(activePartner ? 'thread' : 'list')
  const endRef = useRef<HTMLDivElement>(null)

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
      const url = activeOfferId ? `/api/messages?withUserId=${activePartner}&offerId=${activeOfferId}` : `/api/messages?withUserId=${activePartner}`
      api<{ items: any[] }>(url).then(r => {
        setMessages(r.items)
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      // Refresh thread list
      api<{ items: any[] }>('/api/messages').then(r => setThreads(r.items))
    }
  }, [activePartner, activeOfferId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || !activePartner) return
    setSending(true)
    try {
      await api('/api/messages', { method: 'POST', body: JSON.stringify({ recipientId: activePartner, body: draft, offerId: activeOfferId }) })
      setDraft('')
      const url = activeOfferId ? `/api/messages?withUserId=${activePartner}&offerId=${activeOfferId}` : `/api/messages?withUserId=${activePartner}`
      const r = await api<{ items: any[] }>(url)
      setMessages(r.items)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      const t = await api<{ items: any[] }>('/api/messages')
      setThreads(t.items)
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

  // Combine thread list (most recent first) with partners who have no thread yet
  const threadPartnerIds = new Set(threads.map(t => t.partnerId))
  const partnerNoThread = partners.filter(p => !threadPartnerIds.has(p.id))

  return (
    <div className="h-[calc(100vh-0px)] lg:h-screen flex flex-col">
      <div className="p-4 lg:p-6 border-b bg-background">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Messages</h1>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Thread list */}
        <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-80 border-r bg-background overflow-y-auto`}>
          {threads.length === 0 && partnerNoThread.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet.</p>
              <p className="mt-1">Start one from an offer or application.</p>
            </div>
          ) : (
            <div className="divide-y">
              {threads.map(t => (
                <button
                  key={`${t.partnerId}:${t.offerId ?? ''}`}
                  onClick={() => openThread(t.partnerId, t.offerId)}
                  className={`w-full p-3 text-left hover:bg-muted ${activePartner === t.partnerId && activeOfferId === (t.offerId ?? null) ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                        {t.partnerName.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{t.partnerName}</div>
                      {t.partnerHospital && <div className="text-xs text-muted-foreground truncate">{t.partnerHospital}</div>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(t.lastAt).replace(' ago', '')}</span>
                  </div>
                  {t.offerTitle && <div className="text-xs text-muted-foreground mb-0.5 truncate">Re: {t.offerTitle}</div>}
                  <div className="text-xs text-muted-foreground truncate">{t.mine ? 'You: ' : ''}{t.preview}</div>
                </button>
              ))}
              {partnerNoThread.map(p => (
                <button
                  key={p.id}
                  onClick={() => openThread(p.id, null)}
                  className="w-full p-3 text-left hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs bg-slate-100 text-slate-700">
                        {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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
                  const hospital = partner?.hospital?.name ?? thread?.partnerHospital
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                          {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{name}</div>
                        {hospital && <div className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="size-3" />{hospital}</div>}
                      </div>
                    </div>
                  )
                })()}
                {activeOfferId && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {threads.find(t => t.partnerId === activePartner && t.offerId === activeOfferId)?.offerTitle ?? 'Offer'}
                  </Badge>
                )}
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation.</p>
                ) : messages.map(m => {
                  const mine = m.senderId === user!.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-background border rounded-bl-sm'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <div className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-muted-foreground'}`}>{timeAgo(m.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t bg-background flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={sending || !draft.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageSquare className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
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
