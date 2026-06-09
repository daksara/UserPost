// src/pages/MessagesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  getConversationList, getConversation, sendMessage, markMessagesRead,
  softDeleteMessage, getUserByUsername, type Message, type Profile
} from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import { UserAvatar } from '../components/Avatar'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ username, size = 36 }: { username: string; size?: number }) {
  return <UserAvatar username={username} size={size} />
}

// ── Thread View ────────────────────────────────────────────────────
function ThreadView({ partner, myId, onBack }: { partner: Profile; myId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const data = await getConversation(myId, partner.id)
    setMessages(data)
    markMessagesRead(myId, partner.id)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [myId, partner.id])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  useEffect(() => {
    const convPath = [myId, partner.id].sort().join('_')
    const unsubscribe = onSnapshot(
      collection(db, 'conversations', convPath, 'messages'),
      () => { fetchMessages() }
    )
    return () => unsubscribe()
  }, [myId, partner.id, fetchMessages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const trimmed = text.trim()
    setText('')
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      await sendMessage(myId, partner.id, trimmed)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (msgId: string) => {
    setSelectedMsgId(null)
    try {
      await softDeleteMessage(msgId, myId, partner.id)
    } catch (e) {
      console.error(e)
    }
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
          const isSelected = selectedMsgId === msg.id
          return (
            <div key={msg.id} className={`bubble-wrap ${isOwn ? 'bubble-wrap--own' : ''}`}>
              <div
                className={`bubble ${isOwn ? 'bubble--own' : 'bubble--them'} ${isSelected ? 'bubble--selected' : ''}`}
                onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {msg.body}
              </div>
              {isSelected && isOwn && (
                <button
                  className="bubble-delete-btn"
                  onClick={() => handleDelete(msg.id)}
                  style={{
                    marginTop: '4px',
                    alignSelf: 'flex-end',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              )}
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

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

// ── Swipeable Convo Item ───────────────────────────────────────────
function SwipeableConvoItem({
  msg, profileId, onOpen, onDelete
}: {
  msg: Message
  profileId: string
  onOpen: () => void
  onDelete: () => void
}) {
  const partner = msg.from_id === profileId ? msg.to_profile : msg.from_profile
  const unread = msg.to_id === profileId && !msg.read_at
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const startX = useRef(0)
  const DELETE_THRESHOLD = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffsetX(Math.max(dx, -120))
  }
  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offsetX <= -DELETE_THRESHOLD) {
      setOffsetX(-80)
    } else {
      setOffsetX(0)
    }
  }

  const handleClick = () => {
    if (offsetX < -20) { setOffsetX(0); return }
    onOpen()
  }

  if (showConfirm) {
    return (
      <div style={{
        padding: '16px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Delete conversation with {partner.username}?</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>This will only remove it from your inbox. Their copy is unaffected.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setShowConfirm(false); setOffsetX(0) }}
            style={{ flex: 1, padding: '9px', borderRadius: 'var(--radius-xs)', border: '1.5px solid var(--border)', background: 'none', fontWeight: 600, fontSize: '0.85rem' }}
          >Cancel</button>
          <button
            onClick={onDelete}
            style={{ flex: 1, padding: '9px', borderRadius: 'var(--radius-xs)', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}
          >Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
      {/* Delete button behind */}
      <div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '80px', background: 'var(--red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setShowConfirm(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
      {/* Swipeable row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <Avatar username={partner.username}/>
        <div className="convo-item__info">
          <div className="convo-item__top">
            <span className="convo-item__name">{partner.username}</span>
            <span className="convo-item__time">{timeAgo(msg.created_at)}</span>
          </div>
          <div className="convo-item__preview">
            {msg.from_id === profileId && <span style={{ color: 'var(--text-muted)' }}>You: </span>}
            {msg.body.slice(0, 50)}{msg.body.length > 50 ? '…' : ''}
          </div>
        </div>
        {unread && <span className="convo-item__badge"/>}
      </div>
    </div>
  )
}


export default function MessagesPage({ initialDM }: { initialDM?: string }) {
  const { profile } = useAuth()
  const [convos, setConvos] = useState<Message[]>([])
  const [activePartner, setActivePartner] = useState<Profile | null>(null)
  const [composingDM, setComposingDM] = useState(false)
  const [hiddenConvos, setHiddenConvos] = useState<Set<string>>(new Set())

  const hideConvo = (partnerId: string) => {
    setHiddenConvos(prev => new Set([...prev, partnerId]))
  }

  const fetchConvos = useCallback(async () => {
    if (!profile) return
    const data = await getConversationList(profile.id)
    setConvos(data)
  }, [profile])

  useEffect(() => { fetchConvos() }, [fetchConvos])
  useRealtime('messages', fetchConvos)

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
        {convos.filter(msg => {
          const partner = msg.from_id === profile.id ? msg.to_profile : msg.from_profile
          return !hiddenConvos.has(partner.id)
        }).length === 0 && (
          <div className="feed__empty">No messages yet.</div>
        )}
        {convos
          .filter(msg => {
            const partner = msg.from_id === profile.id ? msg.to_profile : msg.from_profile
            return !hiddenConvos.has(partner.id)
          })
          .map(msg => {
            const partner = msg.from_id === profile.id ? msg.to_profile : msg.from_profile
            return (
              <SwipeableConvoItem
                key={msg.id}
                msg={msg}
                profileId={profile.id}
                onOpen={() => setActivePartner(partner)}
                onDelete={() => hideConvo(partner.id)}
              />
            )
          })
        }
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
