import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getConversationList, getConversation, sendMessage, markMessagesRead, getUserByUsername, type Message, type Profile
} from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function hashStr(s: string) {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff; return h
}

function Avatar({ username, size = 36 }: { username: string; size?: number }) {
  return (
    <div className="avatar" style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hashStr(username) % 360},60%,65%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, color: '#fff'
    }}>
      {username[0].toUpperCase()}
    </div>
  )
}

// ── Thread View ────────────────────────────────────────────────────
function ThreadView({ partner, myId, onBack }: { partner: Profile; myId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const data = await getConversation(myId, partner.id)
    setMessages(data)
    markMessagesRead(myId, partner.id)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [myId, partner.id])

  useEffect(() => { fetchMessages() }, [fetchMessages])
  useRealtime('messages', fetchMessages)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = await sendMessage(myId, partner.id, text.trim(), replyTo?.id)
    setMessages(prev => [...prev, msg])
    setText('')
    setReplyTo(null)
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="page page--thread">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <Avatar username={partner.username} size={32}/>
        <span className="page-header__title">{partner.username}</span>
      </header>

      <div className="thread-messages">
        {messages.map(msg => {
          const isOwn = msg.from_id === myId
          return (
            <div key={msg.id} className={`bubble-wrap ${isOwn ? 'bubble-wrap--own' : ''}`}>
              {msg.reply_to && (
                <div className="bubble-reply">
                  {msg.reply_to.body.slice(0, 60)}{msg.reply_to.body.length > 60 ? '…' : ''}
                </div>
              )}
              <div
                className={`bubble ${isOwn ? 'bubble--own' : 'bubble--them'}`}
                onClick={() => setReplyTo(msg)}
              >
                {msg.body}
              </div>
              <span className="bubble-time">{timeAgo(msg.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {replyTo && (
        <div className="reply-preview">
          <span className="reply-preview__text">↩ {replyTo.body.slice(0, 50)}{replyTo.body.length > 50 ? '…' : ''}</span>
          <button className="reply-preview__close" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <div className="thread-composer">
        <input
          className="thread-composer__input"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value.slice(0, 1000))}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <button className="thread-composer__send" onClick={handleSend} disabled={!text.trim() || sending}>
          {sending
            ? <span className="spinner spinner--sm"/>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
        </button>
      </div>
    </div>
  )
}

// ── New Message Sheet ──────────────────────────────────────────────
function NewMessageSheet({ myId, onStart, onClose }: { myId: string; onStart: (profile: Profile) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Profile | null | 'not-found'>('not-found')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResult('not-found'); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const p = await getUserByUsername(query.trim())
      setResult(p && p.id !== myId ? p : 'not-found')
      setSearching(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query, myId])

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="sheet__handle"/>
        <div className="sheet__title">New Message</div>
        <input className="auth-input" placeholder="Search username…" value={query} onChange={e => setQuery(e.target.value)} autoFocus autoCapitalize="none"/>
        {searching && <div style={{ padding: '12px', textAlign: 'center' }}><span className="spinner"/></div>}
        {!searching && query && result === 'not-found' && (
          <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>User not found.</p>
        )}
        {!searching && result && result !== 'not-found' && (
          <button className="user-result" onClick={() => onStart(result)}>
            <Avatar username={result.username} size={36}/>
            <span>{result.username}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Messages Page ──────────────────────────────────────────────────
export default function MessagesPage({ initialDM }: { initialDM?: string }) {
  const { profile } = useAuth()
  const [convos, setConvos] = useState<Message[]>([])
  const [activePartner, setActivePartner] = useState<Profile | null>(null)
  const [composingDM, setComposingDM] = useState(false)

  const fetchConvos = useCallback(async () => {
    if (!profile) return
    const data = await getConversationList(profile.id)
    setConvos(data)
  }, [profile])

  useEffect(() => { fetchConvos() }, [fetchConvos])
  useRealtime('messages', fetchConvos)

  // Open DM directly if navigated from feed
  useEffect(() => {
    if (!initialDM || !profile) return
    setActivePartner(null)
    getUserByUsername(initialDM).then(p => { 
      if (p && p.id && p.username) setActivePartner(p)
    })
  }, [initialDM, profile])

  if (!profile) return null

  if (activePartner && activePartner.username) {
    return <ThreadView partner={activePartner} myId={profile.id} onBack={() => setActivePartner(null)}/>
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Messages</h1>
        <button className="icon-btn" onClick={() => setComposingDM(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </header>

      <div className="convo-list">
        {convos.length === 0 && (
          <div className="feed__empty">No messages yet.</div>
        )}
        {convos.map(msg => {
          const partner = msg.from_id === profile.id ? msg.to_profile : msg.from_profile
          const unread = msg.to_id === profile.id && !msg.read_at
          return (
            <button key={msg.id} className="convo-item" onClick={async () => {
              setActivePartner(partner)
            }}>
              <Avatar username={partner.username}/>
              <div className="convo-item__info">
                <div className="convo-item__top">
                  <span className="convo-item__name">{partner.username}</span>
                  <span className="convo-item__time">{timeAgo(msg.created_at)}</span>
                </div>
                <div className="convo-item__preview">
                  {msg.from_id === profile.id && <span style={{ color: 'var(--text-muted)' }}>You: </span>}
                  {msg.body.slice(0, 50)}{msg.body.length > 50 ? '…' : ''}
                </div>
              </div>
              {unread && <span className="convo-item__badge"/>}
            </button>
          )
        })}
      </div>

      {composingDM && (
        <NewMessageSheet
          myId={profile.id}
          onStart={p => { setComposingDM(false); setActivePartner(p) }}
          onClose={() => setComposingDM(false)}
        />
      )}
    </div>
  )
}
