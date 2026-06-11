// src/pages/FeedPage.tsx
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  getPosts, createPost, deletePost, addComment, deleteComment,
  getComments, subscribeToActivePosts,
  grantBadge, revokeBadge, getUserByUsername,
  type Post, type Comment, type Profile, type BadgeGrantType, type QuoteRef,
} from '../lib/firebase'
import { expiresIn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { UserAvatar } from '../components/Avatar'
import { BadgeChip, BADGE_GRANT_TYPES, badgeLabel } from '../components/Badge'

function CACard({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div className="ca-card" onClick={copy}>
      <span className="ca-card__addr">{address}</span>
      <span className="ca-card__copy-btn">
        {copied
          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>}
      </span>
    </div>
  )
}

function LinkCard({ url }: { url: string }) {
  let domain: string
  try { domain = new URL(url).hostname.replace('www.', '') } catch { domain = url }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xs)', textDecoration: 'none', transition: 'background 0.12s',
      }}
      onClick={e => e.stopPropagation()}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 1 }}>{domain}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  )
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="sheet" style={{ gap: 16 }}>
        <div className="sheet__handle"/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Delete this post?</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This action cannot be undone.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-cancel" style={{ flex: 1, textAlign: 'center' }} onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, background: 'var(--red)', border: 'none', color: '#fff',
              fontWeight: 700, fontSize: '0.88rem', padding: '10px',
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
            }}
          >Delete</button>
        </div>
      </div>
    </div>
  )
}

function HotIndicator({ commentCount, createdAt }: { commentCount: number; createdAt: string }) {
  const hoursAlive = Math.max(0.25, (Date.now() - new Date(createdAt).getTime()) / 3600000)
  const rate = commentCount / hoursAlive
  if (commentCount < 3 || rate < 1) return null
  const hot = rate >= 5
  const color = hot ? 'var(--red)' : '#f97316'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700, color }}>
      <svg width="9" height="11" viewBox="0 0 10 12" fill={color} stroke="none">
        <path d="M5 0C5 0 1 4 1 7.5a4 4 0 1 0 8 0C9 4 5 0 5 0z"/>
      </svg>
      {rate.toFixed(1)}/h
    </span>
  )
}

function ExpiryBar({ expiresAt, createdAt }: { expiresAt: string; createdAt: string }) {
  const total = new Date(expiresAt).getTime() - new Date(createdAt).getTime()
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  const pct = remaining / total
  const hoursLeft = remaining / 3600000
  const color = hoursLeft > 12 ? 'var(--accent)' : hoursLeft > 4 ? '#f97316' : 'var(--red)'
  return (
    <div style={{ height: 2, background: 'var(--border)', borderRadius: 1, marginTop: 10, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 1, transition: 'width 1s ease' }}/>
    </div>
  )
}

function MentionText({ text, onMentionClick }: { text: string; onMentionClick?: (username: string) => void }) {
  const parts = text.split(/(@\w+)/g)
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? (
            <span
              key={i}
              className={onMentionClick ? 'mention mention--clickable' : 'mention'}
              onClick={onMentionClick ? (e) => { e.stopPropagation(); onMentionClick(part.slice(1)) } : undefined}
            >
              {part}
            </span>
          )
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

function QuoteCard({ quote }: { quote: QuoteRef }) {
  return (
    <div className="quote-card">
      <div className="quote-card__author">
        <UserAvatar username={quote.username} size={14} photoUrl={quote.photo_url ?? null} />
        <span className="quote-card__username">@{quote.username}</span>
      </div>
      <p className="quote-card__body">
        {quote.body.length > 140 ? quote.body.slice(0, 140) + '…' : quote.body}
      </p>
    </div>
  )
}

function UserSheet({
  target, isGranter, onDM, onClose, onGranted,
}: {
  target: Profile
  isGranter: boolean
  onDM: () => void
  onClose: () => void
  onGranted: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [localBadge, setLocalBadge] = useState(target.badge_type)

  const handleGrant = async (type: BadgeGrantType) => {
    setBusy(type)
    try {
      await grantBadge(target.id, type)
      setLocalBadge(type)
      onGranted()
    } catch { /* silently ignore */ }
    finally { setBusy(null) }
  }

  const handleRevoke = async () => {
    setBusy('revoke')
    try {
      await revokeBadge(target.id)
      setLocalBadge(null)
      onGranted()
    } catch { /* silently ignore */ }
    finally { setBusy(null) }
  }

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" style={{ gap: 14 }}>
        <div className="sheet__handle"/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserAvatar username={target.username} size={46} photoUrl={target.photo_url}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              {target.username}
              {target.is_verified && <BadgeChip type="official"/>}
              {localBadge && <BadgeChip type={localBadge}/>}
            </div>
            {target.bio && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {target.bio}
              </div>
            )}
          </div>
        </div>

        <button className="btn-post" style={{ width: '100%' }} onClick={() => { onDM(); onClose() }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Send DM to {target.username}
        </button>

        {isGranter && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Grant Badge
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BADGE_GRANT_TYPES.map(type => (
                <button
                  key={type}
                  className={`badge-${type}`}
                  onClick={() => handleGrant(type)}
                  disabled={busy !== null}
                  style={{ padding: '5px 12px', fontSize: '0.72rem', opacity: busy === type ? 0.5 : 1 }}
                >
                  {busy === type ? '…' : badgeLabel(type)}
                </button>
              ))}
            </div>
            {localBadge && (
              <button
                onClick={handleRevoke}
                disabled={busy !== null}
                style={{
                  marginTop: 10, background: 'none', border: '1.5px solid var(--border)',
                  color: 'var(--red)', borderRadius: 'var(--radius-full)',
                  padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', opacity: busy === 'revoke' ? 0.5 : 1,
                }}
              >
                {busy === 'revoke' ? 'Removing…' : 'Revoke Badge'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, myId, myProfile, onDelete, onComment, onDeleteComment, onDMClick, onRefreshPosts, onQuote, feedProfiles }: {
  post: Post
  myId: string
  myProfile: Profile | null
  onDelete: (id: string) => void
  onComment: (postId: string, body: string) => Promise<Comment>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
  onDMClick: (profile: Profile) => void
  onRefreshPosts: () => void
  onQuote: (post: Post) => void
  feedProfiles: Profile[]
}) {
  const [showComments, setShowComments] = useState(false)
  const [localComments, setLocalComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const prevCommentCountRef = useRef(post.comment_count)
  const [sheetOpen, setSheetOpen] = useState(false)
  const isOwn = post.user_id === myId
  const isBot = post.profiles.badge_type === 'bot'
  const isGranter = myProfile?.is_verified === true
  const [, setTick] = useState(0)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionTarget, setMentionTarget] = useState<Profile | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const knownUsers = useMemo(() => {
    const map = new Map<string, Profile>()
    feedProfiles.forEach(p => map.set(p.username, p))
    map.set(post.profiles.username, post.profiles)
    localComments.forEach(c => map.set(c.profiles.username, c.profiles))
    map.delete(myProfile?.username ?? '')
    return [...map.values()]
  }, [post.profiles, localComments, myProfile, feedProfiles])

  const mentionMatches = mentionQuery !== null
    ? knownUsers.filter(u => u.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 4)
    : []

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 280)
    setCommentText(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match && match.index !== undefined) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
    }
  }

  const insertMention = (username: string) => {
    const cursor = commentInputRef.current?.selectionStart ?? commentText.length
    const before = commentText.slice(0, cursor)
    const after = commentText.slice(cursor)
    const match = before.match(/@(\w*)$/)
    if (match && match.index !== undefined) {
      const newText = (before.slice(0, match.index) + '@' + username + ' ' + after).slice(0, 280)
      setCommentText(newText)
    }
    setMentionQuery(null)
    setTimeout(() => commentInputRef.current?.focus(), 0)
  }

  const handleMentionClick = async (username: string) => {
    if (username === myProfile?.username) return
    setSheetOpen(false)
    const allKnown = [post.profiles, ...localComments.map(c => c.profiles), ...feedProfiles]
    const found = allKnown.find(p => p.username === username)
    if (found) { setMentionTarget(found); return }
    const fetched = await getUserByUsername(username)
    if (fetched) setMentionTarget(fetched)
  }

  // Force re-render every 30s so expiry bar and hot counter stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // Re-fetch comments if the section is open and comment_count changed externally
  useEffect(() => {
    const prev = prevCommentCountRef.current
    prevCommentCountRef.current = post.comment_count
    setCommentCount(post.comment_count)
    if (showComments && commentsLoaded && post.comment_count !== prev) {
      getComments(post.id).then(setLocalComments)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.comment_count])

  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      setShowComments(true)
      setLoadingComments(true)
      try {
        const comments = await getComments(post.id)
        setLocalComments(comments)
        setCommentsLoaded(true)
      } finally {
        setLoadingComments(false)
      }
    } else {
      setShowComments(v => !v)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || sending) return
    setSending(true)
    try {
      const comment = await onComment(post.id, commentText.trim())
      // The realtime post subscription may have already refetched the list
      // (comment_count changed) — only append if it isn't there yet
      setLocalComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment])
      setCommentCount(prev => prev + 1)
      setCommentText('')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId))
    setCommentCount(prev => Math.max(0, prev - 1))
    try {
      await onDeleteComment(post.id, commentId)
    } catch {
      getComments(post.id).then(c => { setLocalComments(c); setCommentCount(c.length) })
    }
  }

  const expiry = expiresIn(post.expires_at)
  const expiringSoon = expiry ? (expiry.includes('m') || (expiry.includes('h') && parseInt(expiry) <= 2)) : false

  return (
    <div className="post-card">
      {confirmDelete && (
        <DeleteConfirm
          onConfirm={() => { setConfirmDelete(false); onDelete(post.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {sheetOpen && !isOwn && !isBot && (
        <UserSheet
          target={post.profiles}
          isGranter={isGranter}
          onDM={() => onDMClick(post.profiles)}
          onClose={() => setSheetOpen(false)}
          onGranted={() => { setSheetOpen(false); onRefreshPosts() }}
        />
      )}
      {mentionTarget && (
        <UserSheet
          target={mentionTarget}
          isGranter={isGranter}
          onDM={() => { onDMClick(mentionTarget.username); setMentionTarget(null) }}
          onClose={() => setMentionTarget(null)}
          onGranted={() => { setMentionTarget(null); onRefreshPosts() }}
        />
      )}

      <div className="post-card__header">
        <UserAvatar username={post.profiles.username} size={36} photoUrl={post.profiles.photo_url} />
        <div className="post-card__meta">
          <button className="post-card__username" onClick={() => { if (!isOwn && !isBot) setSheetOpen(true) }}>
            {post.profiles.username}
            {post.profiles.is_verified && <BadgeChip type="official"/>}
            {post.profiles.badge_type && <BadgeChip type={post.profiles.badge_type}/>}
          </button>
          <span className="post-card__time" style={{ color: expiringSoon ? 'var(--red)' : undefined }}>
            {expiry ?? 'expired'}
          </span>
        </div>
        {isOwn && (
          <button className="post-card__delete" onClick={() => setConfirmDelete(true)} title="Delete post">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      <div className="post-card__body"><MentionText text={post.body} onMentionClick={handleMentionClick} /></div>
      {post.quote && <QuoteCard quote={post.quote} />}
      {post.link_url && <LinkCard url={post.link_url} />}
      {post.contract_address && <CACard address={post.contract_address} />}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="post-card__comments-btn" onClick={handleToggleComments}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount > 0 ? commentCount : ''} Comments
        </button>
        <button className="post-card__quote-btn" onClick={() => onQuote(post)} title="Quote post">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          Quote
        </button>
        <HotIndicator commentCount={commentCount} createdAt={post.created_at}/>
      </div>

      {showComments && (
        <div className="post-card__comments">
          {loadingComments && <div style={{ padding: '8px 0', textAlign: 'center' }}><span className="spinner spinner--sm"/></div>}
          {!loadingComments && localComments.map(c => (
            <div key={c.id} className="comment" style={{ position: 'relative' }}>
              <span className="comment__username">{c.profiles.username}</span>
              <span className="comment__body"><MentionText text={c.body} onMentionClick={handleMentionClick} /></span>
              {c.user_id === myId && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  title="Delete comment"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '0 4px', fontSize: '0.75rem',
                    flexShrink: 0, opacity: 0.7,
                  }}
                >✕</button>
              )}
            </div>
          ))}
          <div style={{ position: 'relative' }}>
            {mentionMatches.length > 0 && (
              <div className="mention-dropdown">
                {mentionMatches.map(u => (
                  <button
                    key={u.id}
                    className="mention-dropdown__item"
                    onMouseDown={e => { e.preventDefault(); insertMention(u.username) }}
                  >
                    <UserAvatar username={u.username} size={20} photoUrl={u.photo_url ?? null} />
                    @{u.username}
                  </button>
                ))}
              </div>
            )}
            <div className="comment-input-row">
              <input
                ref={commentInputRef}
                className="comment-input"
                placeholder="Add a comment…"
                value={commentText}
                onChange={handleCommentInputChange}
                onKeyDown={e => {
                  if (e.key === 'Escape') setMentionQuery(null)
                  else if (e.key === 'Enter') handleComment()
                }}
                onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
              />
              <button className="comment-send" onClick={handleComment} disabled={!commentText.trim() || sending}>
                {sending
                  ? <span className="spinner spinner--sm"/>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExpiryBar expiresAt={post.expires_at} createdAt={post.created_at}/>
    </div>
  )
}

function ComposeSheet({ onPost, onClose, quotePost: initialQuote, feedProfiles = [] }: {
  onPost: (body: string, ca?: string, link?: string, quotePost?: QuoteRef) => Promise<void>
  onClose: () => void
  quotePost?: QuoteRef
  feedProfiles?: Profile[]
}) {
  const [text, setText] = useState('')
  const [ca, setCa] = useState('')
  const [showCA, setShowCA] = useState(false)
  const [caError, setCaError] = useState('')
  const [link, setLink] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [posting, setPosting] = useState(false)
  const [localQuote, setLocalQuote] = useState<QuoteRef | undefined>(initialQuote)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const remaining = 500 - text.length

  const mentionMatches = mentionQuery !== null
    ? feedProfiles.filter(u => u.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 4)
    : []

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 500)
    setText(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match && match.index !== undefined) {
      setMentionQuery(match[1])
    } else {
      setMentionQuery(null)
    }
  }

  const insertComposeMention = (username: string) => {
    const cursor = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, cursor)
    const after = text.slice(cursor)
    const match = before.match(/@(\w*)$/)
    if (match && match.index !== undefined) {
      const newText = (before.slice(0, match.index) + '@' + username + ' ' + after).slice(0, 500)
      setText(newText)
    }
    setMentionQuery(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const isValidCA = (v: string) =>
    /^0x[a-fA-F0-9]{40}$/.test(v.trim()) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.trim())

  const ALLOWED_DOMAINS = [
    'x.com', 'twitter.com', 't.me', 'telegram.me', 'telegram.org',
    'youtube.com', 'youtu.be', 'github.com', 'medium.com',
    'coinmarketcap.com', 'coingecko.com', 'dexscreener.com',
    'dextools.io', 'birdeye.so', 'solscan.io', 'etherscan.io',
    'bscscan.com', 'pump.fun', 'raydium.io', 'uniswap.org',
  ]

  const isAllowedUrl = (v: string): boolean => {
    try {
      const host = new URL(v).hostname.replace('www.', '')
      return ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d))
    } catch { return false }
  }

  const handlePost = async () => {
    if (!text.trim() || posting) return
    if (ca && !isValidCA(ca)) { setCaError('Invalid address'); return }
    if (link && !isAllowedUrl(link)) { setLinkError('Only trusted domains allowed (x.com, t.me, github.com, etc)'); return }
    setPosting(true)
    await onPost(text.trim(), ca.trim() || undefined, link.trim() || undefined, localQuote)
    setPosting(false)
  }

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="sheet__handle"/>
        <div className="sheet__title">{localQuote ? 'Quote Post' : 'New Post'}</div>
        {localQuote && (
          <div className="quote-preview">
            <div className="quote-preview__content">
              <div className="quote-preview__author">@{localQuote.username}</div>
              <div className="quote-preview__body">{localQuote.body}</div>
            </div>
            <button className="quote-preview__remove" onClick={() => setLocalQuote(undefined)} title="Remove quote">✕</button>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          {mentionMatches.length > 0 && (
            <div className="mention-dropdown">
              {mentionMatches.map(u => (
                <button
                  key={u.id}
                  className="mention-dropdown__item"
                  onMouseDown={e => { e.preventDefault(); insertComposeMention(u.username) }}
                >
                  <UserAvatar username={u.username} size={20} photoUrl={u.photo_url ?? null} />
                  @{u.username}
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="compose-textarea"
            placeholder="What's on your mind?"
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => { if (e.key === 'Escape') setMentionQuery(null) }}
            onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
            autoFocus
          />
        </div>
        {!showLink && (
          <button className="ca-attach-btn" onClick={() => setShowLink(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Add link
          </button>
        )}
        {showLink && (
          <div className="ca-input-wrap">
            <div className="ca-input-row">
              <input className={`ca-input${linkError ? ' ca-input--error' : ''}`} placeholder="https://x.com/..." value={link} onChange={e => { setLink(e.target.value); setLinkError('') }} autoComplete="off" spellCheck={false}/>
              <button className="ca-input-remove" onClick={() => { setShowLink(false); setLink(''); setLinkError('') }}>✕</button>
            </div>
            {linkError && <span className="ca-input-error">{linkError}</span>}
            {link && !linkError && isAllowedUrl(link) && <span className="ca-preview__label">✓ Valid URL</span>}
          </div>
        )}
        {!showCA && (
          <button className="ca-attach-btn" onClick={() => setShowCA(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            Add contract address
          </button>
        )}
        {showCA && (
          <div className="ca-input-wrap">
            <div className="ca-input-row">
              <input className={`ca-input${caError ? ' ca-input--error' : ''}`} placeholder="0x… or Solana address" value={ca} onChange={e => { setCa(e.target.value); setCaError('') }} autoComplete="off" spellCheck={false}/>
              <button className="ca-input-remove" onClick={() => { setShowCA(false); setCa(''); setCaError('') }}>✕</button>
            </div>
            {caError && <span className="ca-input-error">{caError}</span>}
            {ca && !caError && isValidCA(ca) && <span className="ca-preview__label">✓ Address valid</span>}
          </div>
        )}
        <div className="compose-footer">
          <span className={`compose-char${remaining < 50 ? ' compose-char--warn' : ''}`}>{remaining} left</span>
          <div className="compose-footer__actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-post" onClick={handlePost} disabled={!text.trim() || posting || !!caError || !!linkError}>
              {posting ? <span className="spinner spinner--sm"/> : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const FEED_CACHE_KEY = 'feed-cache'

function readCachedPosts(): Post[] {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function PostSkeleton() {
  return (
    <div className="post-card post-skeleton" aria-hidden>
      <div className="post-skeleton__header">
        <div className="post-skeleton__avatar"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="post-skeleton__line" style={{ width: '35%' }}/>
          <div className="post-skeleton__line" style={{ width: '20%', height: 10 }}/>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div className="post-skeleton__line" style={{ width: '100%' }}/>
        <div className="post-skeleton__line" style={{ width: '85%' }}/>
        <div className="post-skeleton__line" style={{ width: '60%' }}/>
      </div>
      <div className="post-skeleton__line" style={{ width: '25%', marginTop: 14, height: 10 }}/>
    </div>
  )
}

export default function FeedPage({ onDMClick }: { onDMClick: (profile: Profile) => void }) {
  const { profile } = useAuth()
  const { theme, cycleTheme } = useTheme()
  const [posts, setPosts] = useState<Post[]>(readCachedPosts)
  // Only show loading state when there's no cached data to display
  const [loading, setLoading] = useState(() => readCachedPosts().length === 0)
  const [composing, setComposing] = useState(false)
  const [quotePost, setQuotePost] = useState<QuoteRef | undefined>()

  const refreshPosts = useCallback(async () => {
    const data = await getPosts()
    setPosts(data)
  }, [])

  // Persist latest posts to localStorage for instant display on next load
  useEffect(() => {
    if (posts.length > 0) {
      try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(posts.slice(0, 30))) } catch { /* ignore storage errors */ }
    }
  }, [posts])

  // Comment counts live on the post docs, so this subscription also fires
  // when someone comments — no separate comments listener needed.
  useEffect(() => {
    const unsubPosts = subscribeToActivePosts((updated) => {
      setPosts(updated)
      setLoading(false)
    })
    return () => unsubPosts()
  }, [])

  // Auto-remove expired posts every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setPosts(prev => prev.filter(p => new Date(p.expires_at) > new Date()))
    }, 60_000)
    return () => clearInterval(timer)
  }, [])

  const handlePost = async (body: string, ca?: string, link?: string, quote?: QuoteRef) => {
    if (!profile) return
    await createPost(profile.id, body, ca, link, quote)
    setComposing(false)
    setQuotePost(undefined)
  }

  const feedProfiles = useMemo(() => {
    const map = new Map<string, Profile>()
    posts.forEach(p => map.set(p.profiles.username, p.profiles))
    map.delete(profile?.username ?? '')
    return [...map.values()]
  }, [posts, profile])

  const handleQuote = useCallback((post: Post) => {
    setQuotePost({
      post_id: post.id,
      body: post.body,
      username: post.profiles.username,
      photo_url: post.profiles.photo_url ?? null,
    })
    setComposing(true)
  }, [])

  const handleDelete = async (postId: string) => {
    await deletePost(postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleComment = useCallback(async (postId: string, body: string): Promise<Comment> => {
    if (!profile) throw new Error('Not authenticated')
    return addComment(postId, profile.id, body)
  }, [profile])

  const handleDeleteComment = useCallback(async (postId: string, commentId: string) => {
    await deleteComment(postId, commentId)
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Feed</h1>
        <button
          className="icon-btn"
          onClick={cycleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </header>

      <div className="feed">
        {loading && [0, 1, 2].map(i => <PostSkeleton key={i}/>)}
        {!loading && posts.length === 0 && (
          <div className="feed__empty">No posts yet. Be the first!</div>
        )}
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            myId={profile?.id ?? ''}
            myProfile={profile ?? null}
            onDelete={handleDelete}
            onComment={handleComment}
            onDeleteComment={handleDeleteComment}
            onDMClick={onDMClick}
            onRefreshPosts={refreshPosts}
            onQuote={handleQuote}
            feedProfiles={feedProfiles}
          />
        ))}
      </div>

      <button className="fab" onClick={() => setComposing(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {composing && <ComposeSheet onPost={handlePost} onClose={() => { setComposing(false); setQuotePost(undefined) }} quotePost={quotePost} feedProfiles={feedProfiles}/>}
    </div>
  )
}
