// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  increment,
  query,
  where,
  orderBy,
  limit,
  documentId,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import { convoId, chunk, isEmail } from './utils'

// ── Firebase Config ────────────────────────────────────────────────
// Ganti dengan config dari Firebase Console → Project Settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// ── Profile cache (TTL so other users' edits eventually show up) ───
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000
const profileCache = new Map<string, { profile: Profile; cachedAt: number }>()

function cacheGet(userId: string): Profile | null {
  const entry = profileCache.get(userId)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > PROFILE_CACHE_TTL_MS) {
    profileCache.delete(userId)
    return null
  }
  return entry.profile
}

function cacheSet(profile: Profile) {
  profileCache.set(profile.id, { profile, cachedAt: Date.now() })
}

// ── Types ──────────────────────────────────────────────────────────

export type BadgeGrantType = 'partner' | 'contributor' | 'verified' | 'og'

export interface Profile {
  id: string
  username: string
  created_at: string
  is_verified?: boolean
  badge_type?: BadgeGrantType | null
  photo_url?: string | null
  bio?: string | null
  twitter?: string | null
  telegram?: string | null
  tip_ca?: string | null
}

export interface Post {
  id: string
  user_id: string
  body: string
  contract_address: string | null
  link_url: string | null
  expires_at: string
  created_at: string
  like_count: number
  comment_count: number
  profiles: Profile
  comments: Comment[]
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  profiles: Profile
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  body: string
  reply_to_id: string | null
  read_at: string | null
  deleted_at: string | null
  created_at: string
  from_profile: Profile
  to_profile: Profile
  reply_to?: Message | null
}

// ── Helpers ────────────────────────────────────────────────────────

function tsToISO(ts: Timestamp | null | undefined): string {
  if (!ts) return new Date().toISOString()
  return ts.toDate().toISOString()
}

function docToProfile(id: string, d: Record<string, any>): Profile {
  return {
    id,
    username: d.username,
    created_at: tsToISO(d.created_at),
    is_verified: d.is_verified ?? false,
    badge_type: d.badge_type ?? null,
    photo_url: d.photo_url ?? null,
    bio: d.bio ?? null,
    twitter: d.twitter ?? null,
    telegram: d.telegram ?? null,
    tip_ca: d.tip_ca ?? null,
  }
}

// Placeholder shown for content whose author deleted their account
function deletedProfile(userId: string): Profile {
  return { id: userId, username: 'deleted', created_at: new Date(0).toISOString() }
}

async function getProfileById(userId: string): Promise<Profile | null> {
  const cached = cacheGet(userId)
  if (cached) return cached
  const snap = await getDoc(doc(db, 'profiles', userId))
  if (!snap.exists()) return null
  const profile = docToProfile(snap.id, snap.data())
  cacheSet(profile)
  return profile
}

// Batch-fetch profiles ('in' queries on documentId, max 30 ids per query)
// instead of one read per author. Missing profiles (deleted accounts) get a
// placeholder so callers never crash on null.
async function getProfilesByIds(userIds: string[]): Promise<Map<string, Profile>> {
  const result = new Map<string, Profile>()
  const missing: string[] = []
  for (const id of new Set(userIds)) {
    const cached = cacheGet(id)
    if (cached) result.set(id, cached)
    else missing.push(id)
  }
  await Promise.all(
    chunk(missing, 30).map(async (ids) => {
      const snap = await getDocs(
        query(collection(db, 'profiles'), where(documentId(), 'in', ids))
      )
      for (const d of snap.docs) {
        const profile = docToProfile(d.id, d.data())
        cacheSet(profile)
        result.set(d.id, profile)
      }
    })
  )
  for (const id of missing) {
    if (!result.has(id)) result.set(id, deletedProfile(id))
  }
  return result
}

// ── Auth ───────────────────────────────────────────────────────────

export async function signUp(username: string, email: string, password: string) {
  const usernameKey = username.toLowerCase()
  const usernameRef = doc(db, 'usernames', usernameKey)

  // Create auth user first so Firestore writes run while authenticated
  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  // Force token to be available before Firestore calls
  await user.getIdToken(true)

  try {
    // Atomically claim username (now authenticated).
    // NOTE: never store the email here — username docs are publicly
    // readable for availability checks, so an email would leak.
    await runTransaction(db, async (t) => {
      const snap = await t.get(usernameRef)
      if (snap.exists()) throw new Error('Username already taken')
      t.set(usernameRef, { uid: user.uid })
    })
    await setDoc(doc(db, 'profiles', user.uid), {
      username,
      created_at: serverTimestamp(),
      is_verified: false,
      // User baru otomatis dapat badge OG (early adopter) — satu-satunya
      // badge yang boleh di-set sendiri saat create (lihat firestore.rules)
      badge_type: 'og',
    })
    await sendEmailVerification(user).catch(() => {})
    return user
  } catch (e) {
    console.error('[signUp] Firestore write failed:', e)
    // Clean up: remove username claim and auth account on failure
    await deleteDoc(usernameRef).catch(() => {})
    await deleteUser(user).catch(() => {})
    throw e
  }
}

export async function signIn(identifier: string, password: string) {
  let email: string
  if (isEmail(identifier)) {
    email = identifier.toLowerCase()
  } else {
    // Username login is for legacy accounts: use the email stored on older
    // username docs, otherwise the synthetic pre-email pattern. New accounts
    // (no stored email, no synthetic auth user) simply fail credential
    // checks and must sign in with their email.
    const indexSnap = await getDoc(doc(db, 'usernames', identifier.toLowerCase()))
    const legacyEmail = indexSnap.exists() ? indexSnap.data().email : null
    email = legacyEmail ?? `up.${identifier.toLowerCase()}@userpost.app`
  }
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function forgotPassword(identifier: string): Promise<void> {
  if (isEmail(identifier)) {
    await sendPasswordResetEmail(auth, identifier.toLowerCase())
    return
  }
  // Legacy accounts may still have an email on the username index
  const indexSnap = await getDoc(doc(db, 'usernames', identifier.toLowerCase()))
  const legacyEmail = indexSnap.exists() ? indexSnap.data().email : null
  if (!legacyEmail) throw new Error('Enter the email address you registered with')
  await sendPasswordResetEmail(auth, legacyEmail)
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function grantBadge(targetUserId: string, badgeType: BadgeGrantType): Promise<void> {
  if (!auth.currentUser) throw new Error('Not authenticated')
  await updateDoc(doc(db, 'profiles', targetUserId), { badge_type: badgeType })
  profileCache.delete(targetUserId)
}

export async function revokeBadge(targetUserId: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Not authenticated')
  await updateDoc(doc(db, 'profiles', targetUserId), { badge_type: null })
  profileCache.delete(targetUserId)
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  await sendEmailVerification(user)
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return getProfileById(userId)
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  return !snap.exists()
}

export async function getUserByUsername(username: string): Promise<Profile | null> {
  const indexSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (!indexSnap.exists()) return null
  const { uid } = indexSnap.data()
  return getProfileById(uid)
}

// ── Posts ──────────────────────────────────────────────────────────

function buildPost(postId: string, data: Record<string, any>, profile: Profile): Post {
  return {
    id: postId,
    user_id: data.user_id,
    body: data.body,
    contract_address: data.contract_address ?? null,
    link_url: data.link_url ?? null,
    expires_at: tsToISO(data.expires_at),
    created_at: tsToISO(data.created_at),
    like_count: data.like_count ?? 0,
    comment_count: data.comment_count ?? 0,
    profiles: profile,
    comments: [],
  }
}

async function hydratePost(postId: string, data: Record<string, any>): Promise<Post> {
  const profile = (await getProfileById(data.user_id)) ?? deletedProfile(data.user_id)
  return buildPost(postId, data, profile)
}

// Hydrate a snapshot's posts with batched profile reads, dropping posts that
// expired after the query's cutoff was captured.
async function hydratePosts(docs: { id: string; data: () => Record<string, any> }[]): Promise<Post[]> {
  const rows = docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .filter((r) => {
      const exp = r.data.expires_at as Timestamp | null | undefined
      return !exp || exp.toMillis() > Date.now()
    })
  const profiles = await getProfilesByIds(rows.map((r) => r.data.user_id))
  return rows.map((r) => buildPost(r.id, r.data, profiles.get(r.data.user_id)!))
}

export async function getPosts(): Promise<Post[]> {
  const now = Timestamp.now()
  const snap = await getDocs(
    query(
      collection(db, 'posts'),
      where('expires_at', '>', now),
      orderBy('expires_at', 'desc'),
      orderBy('created_at', 'desc'),
      limit(50)
    )
  )
  return hydratePosts(snap.docs)
}

// Post aktif milik satu user (untuk halaman profil). Equality-only query —
// tidak butuh composite index; post kedaluwarsa disaring oleh hydratePosts
// dan sisanya dibersihkan server lewat TTL pada expires_at.
export async function getMyActivePosts(userId: string): Promise<Post[]> {
  const snap = await getDocs(
    query(collection(db, 'posts'), where('user_id', '==', userId), limit(100))
  )
  const posts = await hydratePosts(snap.docs)
  return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function createPost(userId: string, body: string, contractAddress?: string, linkUrl?: string): Promise<Post> {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const ref = await addDoc(collection(db, 'posts'), {
    user_id: userId,
    body,
    contract_address: contractAddress ?? null,
    link_url: linkUrl ?? null,
    expires_at: expiresAt,
    created_at: serverTimestamp(),
  })
  return hydratePost(ref.id, {
    user_id: userId,
    body,
    contract_address: contractAddress ?? null,
    link_url: linkUrl ?? null,
    expires_at: expiresAt,
    created_at: Timestamp.now(),
  })
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(db, 'posts', postId))
}

export async function getComments(postId: string): Promise<Comment[]> {
  const snap = await getDocs(
    query(collection(db, 'posts', postId, 'comments'), orderBy('created_at', 'asc'))
  )
  const rows = snap.docs.map((c) => ({ id: c.id, data: c.data() }))
  const profiles = await getProfilesByIds(rows.map((r) => r.data.user_id))
  return rows.map((r) => ({
    id: r.id,
    post_id: postId,
    user_id: r.data.user_id,
    body: r.data.body,
    created_at: tsToISO(r.data.created_at),
    profiles: profiles.get(r.data.user_id)!,
  }))
}

export async function addComment(postId: string, userId: string, body: string): Promise<Comment> {
  // Write the comment and bump the counter atomically so they can't drift
  const ref = doc(collection(db, 'posts', postId, 'comments'))
  const batch = writeBatch(db)
  batch.set(ref, { user_id: userId, body, created_at: serverTimestamp() })
  batch.update(doc(db, 'posts', postId), { comment_count: increment(1) })
  await batch.commit()
  const profile = (await getProfileById(userId)) ?? deletedProfile(userId)
  return {
    id: ref.id,
    post_id: postId,
    user_id: userId,
    body,
    created_at: new Date().toISOString(),
    profiles: profile,
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'posts', postId, 'comments', commentId))
  batch.update(doc(db, 'posts', postId), { comment_count: increment(-1) })
  await batch.commit()
}

export async function getUserLikes(userId: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', userId, 'liked_posts'))
  return new Set(snap.docs.map(d => d.id))
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  const likeRef = doc(db, 'users', userId, 'liked_posts', postId)
  const postRef = doc(db, 'posts', postId)
  let liked = false
  let count = 0

  await runTransaction(db, async (t) => {
    const [likeSnap, postSnap] = await Promise.all([t.get(likeRef), t.get(postRef)])
    const current = postSnap.data()?.like_count ?? 0
    if (likeSnap.exists()) {
      t.delete(likeRef)
      t.update(postRef, { like_count: Math.max(0, current - 1) })
      liked = false
      count = Math.max(0, current - 1)
    } else {
      t.set(likeRef, { created_at: serverTimestamp() })
      t.update(postRef, { like_count: current + 1 })
      liked = true
      count = current + 1
    }
  })

  return { liked, count }
}

// ── Realtime ───────────────────────────────────────────────────────

// Live feed of active posts. The Firestore query cutoff is fixed at subscribe
// time, so the snapshot handler re-filters by the current clock and the
// subscription is recreated periodically to refresh the cutoff.
export function subscribeToActivePosts(
  onPosts: (posts: Post[]) => void
): Unsubscribe {
  let version = 0
  let unsubSnapshot: Unsubscribe = () => {}

  const attach = () => {
    unsubSnapshot()
    unsubSnapshot = onSnapshot(
      query(
        collection(db, 'posts'),
        where('expires_at', '>', Timestamp.now()),
        orderBy('expires_at', 'desc'),
        orderBy('created_at', 'desc'),
        limit(50)
      ),
      async (snap) => {
        const v = ++version
        const posts = await hydratePosts(snap.docs)
        if (v === version) onPosts(posts)
      }
    )
  }

  attach()
  const refresh = setInterval(attach, 30 * 60 * 1000)
  return () => {
    clearInterval(refresh)
    unsubSnapshot()
  }
}

export function subscribeToConversation(
  myId: string,
  otherId: string,
  onMessages: (msgs: Message[]) => void
): Unsubscribe {
  const convId = convoId(myId, otherId)
  let version = 0
  return onSnapshot(
    query(
      collection(db, 'conversations', convId, 'messages'),
      where('deleted_at', '==', null),
      orderBy('created_at', 'asc')
    ),
    async (snap) => {
      const v = ++version
      const myProfile = await getProfileById(myId)
      const partnerProfile = await getProfileById(otherId)
      if (!myProfile || !partnerProfile) return
      const msgs = await Promise.all(
        snap.docs.map((d) => {
          const data = d.data()
          const from = data.from_id === myId ? myProfile : partnerProfile
          const to = data.from_id === myId ? partnerProfile : myProfile
          return hydrateMessage(d.id, { ...data, conversation_id: convId }, from, to)
        })
      )
      if (v === version) onMessages(msgs)
    }
  )
}

export function subscribeToInbox(myId: string, onUpdate: () => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', myId, 'inbox'), onUpdate)
}

// ── Storage ────────────────────────────────────────────────────────

export async function uploadProfilePhoto(userId: string, base64DataUrl: string): Promise<string> {
  const ref = storageRef(storage, `avatars/${userId}.jpg`)
  await uploadString(ref, base64DataUrl, 'data_url')
  return getDownloadURL(ref)
}

// ── Messages ───────────────────────────────────────────────────────

async function hydrateMessage(
  msgId: string,
  data: Record<string, any>,
  fromProfile: Profile,
  toProfile: Profile
): Promise<Message> {
  let reply_to: Message | null = null
  if (data.reply_to_id) {
    const convId = data.conversation_id
    const replySnap = await getDoc(doc(db, 'conversations', convId, 'messages', data.reply_to_id))
    if (replySnap.exists()) {
      const rd = replySnap.data()
      reply_to = {
        id: replySnap.id,
        from_id: rd.from_id,
        to_id: rd.to_id,
        body: rd.body,
        reply_to_id: null,
        read_at: null,
        deleted_at: null,
        created_at: tsToISO(rd.created_at),
        from_profile: fromProfile,
        to_profile: toProfile,
      }
    }
  }
  return {
    id: msgId,
    from_id: data.from_id,
    to_id: data.to_id,
    body: data.body,
    reply_to_id: data.reply_to_id ?? null,
    read_at: data.read_at ? tsToISO(data.read_at) : null,
    deleted_at: data.deleted_at ? tsToISO(data.deleted_at) : null,
    created_at: tsToISO(data.created_at),
    from_profile: fromProfile,
    to_profile: toProfile,
    reply_to,
  }
}

export async function getConversation(myId: string, otherId: string): Promise<Message[]> {
  const convId = convoId(myId, otherId)
  const fromProfile = await getProfileById(myId)
  const toProfile = await getProfileById(otherId)
  const snap = await getDocs(
    query(
      collection(db, 'conversations', convId, 'messages'),
      where('deleted_at', '==', null),
      orderBy('created_at', 'asc')
    )
  )
  return Promise.all(
    snap.docs.map((d) => hydrateMessage(d.id, { ...d.data(), conversation_id: convId }, fromProfile!, toProfile!))
  )
}

export async function getConversationList(myId: string): Promise<Message[]> {
  // Each user has an 'inbox' collection tracking their latest message per conversation
  const snap = await getDocs(
    query(
      collection(db, 'users', myId, 'inbox'),
      orderBy('updated_at', 'desc'),
      limit(30)
    )
  )
  const rows = snap.docs.map((d) => d.data())
  const profiles = await getProfilesByIds([myId, ...rows.map((r) => r.partner_id)])
  const myProfile = profiles.get(myId)!
  const messages = await Promise.all(
    rows.map(async (data) => {
      const partnerProfile = profiles.get(data.partner_id)!
      const convId = convoId(myId, data.partner_id)
      const msgSnap = await getDoc(
        doc(db, 'conversations', convId, 'messages', data.last_message_id)
      )
      if (!msgSnap.exists()) return null
      return hydrateMessage(
        msgSnap.id,
        { ...msgSnap.data(), conversation_id: convId },
        data.last_from_id === myId ? myProfile : partnerProfile,
        data.last_from_id === myId ? partnerProfile : myProfile
      )
    })
  )
  return messages.filter((m): m is Message => m !== null)
}

export async function sendMessage(
  fromId: string,
  toId: string,
  body: string,
  replyToId?: string
): Promise<Message> {
  const convId = convoId(fromId, toId)
  const msgData = {
    from_id: fromId,
    to_id: toId,
    body,
    reply_to_id: replyToId ?? null,
    read_at: null,
    deleted_at: null,
    created_at: serverTimestamp(),
    conversation_id: convId,
  }
  const ref = await addDoc(collection(db, 'conversations', convId, 'messages'), msgData)

  // Update inbox for both users
  const inboxData = {
    partner_id: toId,
    last_message_id: ref.id,
    last_from_id: fromId,
    updated_at: serverTimestamp(),
    unread: false,
  }
  await Promise.all([
    setDoc(doc(db, 'users', fromId, 'inbox', toId), inboxData),
    setDoc(doc(db, 'users', toId, 'inbox', fromId), {
      ...inboxData,
      partner_id: fromId,
      unread: true,
    }),
  ])

  const profiles = await getProfilesByIds([fromId, toId])
  return hydrateMessage(
    ref.id,
    { ...msgData, created_at: Timestamp.now() },
    profiles.get(fromId)!,
    profiles.get(toId)!
  )
}

export async function markMessagesRead(myId: string, fromId: string) {
  // Mark inbox entry as read
  await updateDoc(doc(db, 'users', myId, 'inbox', fromId), { unread: false })

  // Mark individual messages as read
  const convId = convoId(myId, fromId)
  const snap = await getDocs(
    query(
      collection(db, 'conversations', convId, 'messages'),
      where('to_id', '==', myId),
      where('read_at', '==', null)
    )
  )
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { read_at: serverTimestamp() }))
  await batch.commit()
}

export async function softDeleteMessage(messageId: string, myId: string, otherId: string) {
  const convId = convoId(myId, otherId)
  await updateDoc(doc(db, 'conversations', convId, 'messages', messageId), {
    deleted_at: serverTimestamp(),
  })
}

export async function getUnreadCount(myId: string): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'users', myId, 'inbox'), where('unread', '==', true))
  )
  return snap.size
}

export async function updateProfile(
  userId: string,
  data: {
    photo_url?: string | null
    bio?: string | null
    twitter?: string | null
    telegram?: string | null
    tip_ca?: string | null
  }
) {
  await updateDoc(doc(db, 'profiles', userId), {
    ...(data.photo_url !== undefined && { photo_url: data.photo_url }),
    ...(data.bio !== undefined && { bio: data.bio }),
    ...(data.twitter !== undefined && { twitter: data.twitter }),
    ...(data.telegram !== undefined && { telegram: data.telegram }),
    ...(data.tip_ca !== undefined && { tip_ca: data.tip_ca }),
  })
  profileCache.delete(userId)
}


export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export async function deleteAccount(password: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')

  // Re-authenticate first (Firebase requires this for account deletion)
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)

  const uid = user.uid

  // Clean up Firestore data — wrapped so a permission error doesn't block auth deletion
  try {
    const username = (await getProfileById(uid))?.username
    await deleteDoc(doc(db, 'profiles', uid))
    if (username) {
      await deleteDoc(doc(db, 'usernames', username.toLowerCase()))
    }
    // Best-effort: delete inbox entries
    const inboxSnap = await getDocs(collection(db, 'users', uid, 'inbox'))
    await Promise.all(inboxSnap.docs.map((d) => deleteDoc(d.ref)))
  } catch (_) {
    // Firestore cleanup failed — still proceed to delete Auth account
  }

  // Delete Firebase Auth account (must be last)
  await deleteUser(user)
}

export { onAuthStateChanged, type User }
