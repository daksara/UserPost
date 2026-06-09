// src/pages/FeedPage.tsx
import { useState, useCallback, useEffect } from 'react'
import { getPosts, createPost, deletePost, addComment, type Post, type Comment } from '../lib/firebase'
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

// ── Delete Confirm Dialog ──────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="sheet" style={{ gap: 16 }}>
        <div className="sheet__handle"/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗑️</div>
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
              borderRadius: 'var(--radius-full)', cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, myId, onDelete, onComment, onDMClick }: {
  post: Post
  myId: string
  onDelete: (id: string) => void
  onComment: (postId: string, body: string) => Promise<void>
  onDMClick: (username: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isOwn = post.user_id === myId

  const handleComment = async () => {
    if (!commentText.trim() || sending) return
    setSending(true)
    await onComment(post.id, commentText.trim())
    setCommentText('')
    setSending(false)
  }

  return (
    <div className="post-card">
      {confirmDelete && (
        <DeleteConfirm
          onConfirm={() => { setConfirmDelete(false); onDelete(post.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="post-card__header">
        <UserAvatar username={post.profiles.username} size={36} photoUrl={post.profiles.photo_url} />
        <div className="post-card__meta">
          <button className="post-card__username" onClick={() => !isOwn && onDMClick(post.profiles.username)}>
            {post.profiles.username}
            {post.profiles.is_verified && (
              <span className="badge-official">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
                Official
              </span>
            )}
          </button>
          <span className="post-card__time">{timeAgo(post.created_at)}</span>
        </div>
        {isOwn && (
          <button className="post-card__delete" onClick={() => setConfirmDelete(true)} title="Delete post">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      <div className="post-card__body">{post.body}</div>
      {post.contract_address && <CACard address={post.contract_address} />}

      <button className="post-card__comments-btn" onClick={() => setShowComments(v => !v)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {post.comments.length > 0 ? post.comments.length : ''} Comments
      </button>

      {showComments && (
        <div className="post-card__comments">
          {post.comments.map(c => (
            <div key={c.id} className="comment">
              <span className="comment__username">{c.profiles.username}</span>
              <span className="comment__body">{c.body}</span>
              <span className="comment__time">{timeAgo(c.created_at)}</span>
            </div>
          ))}
          <div className="comment-input-row">
            <input
              className="comment-input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value.slice(0, 280))}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button className="comment-send" onClick={handleComment} disabled={!commentText.trim() || sending}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ComposeSheet({ onPost, onClose }: { onPost: (body: string, ca?: string) => Promise<void>; onClose: () => void }) {
  const [text, setText] = useState('')
  const [ca, setCa] = useState('')
  const [showCA, setShowCA] = useState(false)
  const [caError, setCaError] = useState('')
  const [posting, setPosting] = useState(false)
  const remaining = 280 - text.length

  const isValidCA = (v: string) =>
    /^0x[a-fA-F0-9]{40}$/.test(v.trim()) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.trim())

  const handlePost = async () => {
    if (!text.trim() || posting) return
    if (ca && !isValidCA(ca)) { setCaError('Invalid address'); return }
    setPosting(true)
    await onPost(text.trim(), ca.trim() || undefined)
    setPosting(false)
  }

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="sheet__handle"/>
        <div className="sheet__title">New Post</div>
        <textarea
          className="compose-textarea"
          placeholder="What's on your mind?"
          value={text}
          onChange={e => setText(e.target.value.slice(0, 280))}
          autoFocus
        />
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
          <span className={`compose-char${remaining < 20 ? ' compose-char--warn' : ''}`}>{remaining} left</span>
          <div className="compose-footer__actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-post" onClick={handlePost} disabled={!text.trim() || posting || !!caError}>
              {posting ? <span className="spinner spinner--sm"/> : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedPage({ onDMClick }: { onDMClick: (username: string) => void }) {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(false)

  const fetchPosts = useCallback(async () => {
    const data = await getPosts()
    setPosts(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useRealtime('posts', fetchPosts)
  useRealtime('comments', fetchPosts)

  const handlePost = async (body: string, ca?: string) => {
    if (!profile) return
    const newPost = await createPost(profile.id, body, ca)
    setPosts(prev => [newPost, ...prev])
    setComposing(false)
  }

  const handleDelete = async (postId: string) => {
    await deletePost(postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleComment = async (postId: string, body: string) => {
    if (!profile) return
    const comment = await addComment(postId, profile.id, body)
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, comments: [...p.comments, comment as Comment] }
      : p
    ))
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Feed</h1>
      </header>

      <div className="feed">
        {loading && <div className="feed__loading"><span className="spinner"/></div>}
        {!loading && posts.length === 0 && (
          <div className="feed__empty">No posts yet. Be the first!</div>
        )}
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            myId={profile?.id ?? ''}
            onDelete={handleDelete}
            onComment={handleComment}
            onDMClick={onDMClick}
          />
        ))}
      </div>

      <button className="fab" onClick={() => setComposing(true)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {composing && <ComposeSheet onPost={handlePost} onClose={() => setComposing(false)}/>}
    </div>
  )
}
