// src/pages/MessagesPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getConversationList, sendMessage, markMessagesRead,
  softDeleteMessage, getUserByUsername, subscribeToConversation, subscribeToInbox,
  type Message, type Profile
} from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { UserAvatar } from '../components/Avatar'
import { BadgeChip } from '../components/Badge'

function ProfileBadges({ profile }: { profile: Profile }) {
  if (!profile.is_verified && !profile.badge_type) return null
  return (
    <>
      {profile.is_verified && <BadgeChip type="official"/>}
      {profile.badge_type && <BadgeChip type={profile.badge_type}/>}
    </>
  )
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ username, size = 36, photoUrl }: { username: string; size?: number; photoUrl?: string | null }) {
  return <UserAvatar username={username} size={size} photoUrl={photoUrl} />
}

// ── Thread View ────────────────────────────────────────────────────
function ThreadView({ partner, myProfile, onBack }: {
  partner: Profile
  myProfile: Profile
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const isNearBottom = () => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  useEffect(() => {
    initializedRef.current = false
    const unsub = subscribeToConversation(myProfile.id, partner.id, (msgs) => {
      setMessages(prev => {
        // Keep optimistic messages only until a matching real message arrives.
        // Match by sender + body + close timestamp (ids never match), so the
        // optimistic twin is dropped the moment Firestore confirms it.
        const pendingOptimistic = prev.filter(m => {
          if (!m.id.startsWith('opt-')) return false
          const confirmed = msgs.some(r =>
            r.from_id === m.from_id &&
            r.body === m.body &&
            Math.abs(new Date(r.created_at).getTime() - new Date(m.created_at).getTime()) < 60_000
          )
          return !confirmed
        })
        return [...msgs, ...pendingOptimistic].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
      markMessagesRead(myProfile.id, partner.id)
      if (!initializedRef.current) {
        initializedRef.current = true
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 100)
      } else if (isNearBottom()) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    })
    return () => unsub()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile.id, partner.id])

  const handleSend = async () => {
    if (!text.trim()) return
    const trimmed = text.trim()
    const replyToMsg = replyTo
    setText('')
    setReplyTo(null)

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      from_id: myProfile.id,
      to_id: partner.id,
      body: trimmed,
      reply_to_id: replyToMsg?.id ?? null,
      read_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      from_profile: myProfile,
      to_profile: partner,
      reply_to: replyToMsg ?? null,
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      await sendMessage(myProfile.id, partner.id, trimmed, replyToMsg?.id)
    } catch {
      // Rollback on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      setReplyTo(replyToMsg)
    }
  }

  const handleDelete = async (msgId: string) => {
    setSelectedMsgId(null)
    setMessages(prev => prev.filter(m => m.id !== msgId))
    try {
      await softDeleteMessage(msgId, myProfile.id, partner.id)
    } catch {
      // Subscription will re-sync on failure
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
        <Avatar username={partner.username} size={32} photoUrl={partner.photo_url}/>
        <span className="page-header__title" style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {partner.username}
          <ProfileBadges profile={partner}/>
        </span>
      </header>

      <div className="thread-messages" ref={containerRef}>
        {messages.map(msg => {
          const isOwn = msg.from_id === myProfile.id
          const isSelected = selectedMsgId === msg.id
          const isOptimistic = msg.id.startsWith('opt-')
          return (
            <div key={msg.id} className={`bubble-wrap ${isOwn ? 'bubble-wrap--own' : ''}`}>
              <div
                className={`bubble ${isOwn ? 'bubble--own' : 'bubble--them'} ${isSelected ? 'bubble--selected' : ''}`}
                onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
                style={{ cursor: 'pointer', userSelect: 'none', opacity: isOptimistic ? 0.65 : 1 }}
              >
                {msg.reply_to && (
                  <div style={{
                    fontSize: '0.72rem',
                    color: isOwn ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                    borderLeft: `2px solid ${isOwn ? 'rgba(255,255,255,0.45)' : 'var(--accent)'}`,
                    paddingLeft: '7px',
                    marginBottom: '5px',
                    overflow: 'hidden',
                    maxHeight: '36px',
                  }}>
                    <span style={{ fontWeight: 700 }}>{msg.reply_to.from_profile.username}</span>
                    {': '}{msg.reply_to.body.slice(0, 70)}{msg.reply_to.body.length > 70 ? '…' : ''}
                  </div>
                )}
                {msg.body}
              </div>
              {isSelected && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isOptimistic && (
                    <button
                      onClick={() => { setReplyTo(msg); setSelectedMsgId(null) }}
                      style={{
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        border: '1px solid var(--accent)', borderRadius: 'var(--radius-xs)',
                        padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                      }}
                    >Reply</button>
                  )}
                  {isOwn && !isOptimistic && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      style={{
                        background: '#ef4444', color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-xs)',
                        padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700,
                      }}
                    >Delete</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {replyTo && (
        <div style={{
          padding: '8px 14px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Replying to {replyTo.from_profile.username}:</span>{' '}
            {replyTo.body.slice(0, 80)}{replyTo.body.length > 80 ? '…' : ''}
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      <div className="thread-composer">
        <input
          className="thread-composer__input"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value.slice(0, 1000))}
          onKeyDown={e => {
            // Guard against IME composition (mobile keyboards): committing the
            // composed word fires Enter but shouldn't send / re-fill the input
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button className="thread-composer__send" onClick={handleSend} disabled={!text.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
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
            <Avatar username={result.username} size={36} photoUrl={result.photo_url}/>
            <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
              {result.username}
              <ProfileBadges profile={result}/>
            </span>
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
        <Avatar username={partner.username} photoUrl={partner.photo_url}/>
        <div className="convo-item__info">
          <div className="convo-item__top">
            <span className="convo-item__name" style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partner.username}</span>
              <ProfileBadges profile={partner}/>
            </span>
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
  const [hiddenConvos, setHiddenConvos] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('hiddenConvos')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const hideConvo = (partnerId: string) => {
    setHiddenConvos(prev => {
      const next = new Set([...prev, partnerId])
      localStorage.setItem('hiddenConvos', JSON.stringify([...next]))
      return next
    })
  }

  const fetchConvos = useCallback(async () => {
    if (!profile) return
    const data = await getConversationList(profile.id)
    setConvos(data)
  }, [profile])

  // Subscribe to inbox — fires when any message is sent/received
  useEffect(() => {
    if (!profile) return
    const unsub = subscribeToInbox(profile.id, fetchConvos)
    return () => unsub()
  }, [profile, fetchConvos])

  useEffect(() => {
    if (!initialDM || !profile) return
    setActivePartner(null)
    getUserByUsername(initialDM).then(p => {
      if (p && p.id && p.username) setActivePartner(p)
    })
  }, [initialDM, profile])

  if (!profile) return null

  if (activePartner && activePartner.username) {
    return <ThreadView partner={activePartner} myProfile={profile} onBack={() => setActivePartner(null)}/>
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
