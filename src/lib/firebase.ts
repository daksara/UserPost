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
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'

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

// ── Profile cache ──────────────────────────────────────────────────
const profileCache = new Map<string, Profile>()

// ── Types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  created_at: string
  is_verified?: boolean
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

async function getProfileById(userId: string): Promise<Profile | null> {
  if (profileCache.has(userId)) return profileCache.get(userId)!
  const snap = await getDoc(doc(db, 'profiles', userId))
  if (!snap.exists()) return null
  const d = snap.data()
  const profile: Profile = {
    id: snap.id,
    username: d.username,
    created_at: tsToISO(d.created_at),
    is_verified: d.is_verified ?? false,
    photo_url: d.photo_url ?? null,
    bio: d.bio ?? null,
    twitter: d.twitter ?? null,
    telegram: d.telegram ?? null,
    tip_ca: d.tip_ca ?? null,
  }
  profileCache.set(userId, profile)
  return profile
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
    // Atomically claim username (now authenticated)
    await runTransaction(db, async (t) => {
      const snap = await t.get(usernameRef)
      if (snap.exists()) throw new Error('Username already taken')
      t.set(usernameRef, { uid: user.uid, email })
    })
    await setDoc(doc(db, 'profiles', user.uid), {
      username,
      created_at: serverTimestamp(),
      is_verified: false,
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

export async function signIn(username: string, password: string) {
  const indexSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  // Fall back to legacy email pattern for accounts created before email was required
  const email = (indexSnap.exists() && indexSnap.data().email)
    ? indexSnap.data().email
    : `up.${username.toLowerCase()}@userpost.app`
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function forgotPassword(username: string): Promise<void> {
  const indexSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (!indexSnap.exists()) throw new Error('Username not found')
  const { email } = indexSnap.data()
  if (!email) throw new Error('No recovery email on file for this account')
  await sendPasswordResetEmail(auth, email)
}

export async function signOut() {
  await firebaseSignOut(auth)
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

async function hydratePost(postId: string, data: Record<string, any>): Promise<Post> {
  const profile = await getProfileById(data.user_id)
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
    profiles: profile!,
    comments: [],
  }
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
  const posts = await Promise.all(snap.docs.map((d) => hydratePost(d.id, d.data())))
  return posts
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
  return Promise.all(
    snap.docs.map(async (c) => {
      const cd = c.data()
      const cp = await getProfileById(cd.user_id)
      return {
        id: c.id,
        post_id: postId,
        user_id: cd.user_id,
        body: cd.body,
        created_at: tsToISO(cd.created_at),
        profiles: cp!,
      }
    })
  )
}

export async function addComment(postId: string, userId: string, body: string): Promise<Comment> {
  const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
    user_id: userId,
    body,
    created_at: serverTimestamp(),
  })
  await updateDoc(doc(db, 'posts', postId), { comment_count: increment(1) })
  const profile = await getProfileById(userId)
  return {
    id: ref.id,
    post_id: postId,
    user_id: userId,
    body,
    created_at: new Date().toISOString(),
    profiles: profile!,
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
  await updateDoc(doc(db, 'posts', postId), { comment_count: increment(-1) })
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

export function subscribeToCollection(
  collectionPath: string,
  callback: () => void
): Unsubscribe {
  return onSnapshot(collection(db, collectionPath), callback)
}

export function subscribeToActivePosts(
  onPosts: (posts: Post[]) => void
): Unsubscribe {
  const now = Timestamp.now()
  let version = 0
  return onSnapshot(
    query(
      collection(db, 'posts'),
      where('expires_at', '>', now),
      orderBy('expires_at', 'desc'),
      orderBy('created_at', 'desc'),
      limit(50)
    ),
    async (snap) => {
      const v = ++version
      const posts = await Promise.all(snap.docs.map((d) => hydratePost(d.id, d.data())))
      if (v === version) onPosts(posts)
    }
  )
}

export function subscribeToAllComments(onUpdate: () => void): Unsubscribe {
  let ready = false
  return onSnapshot(collectionGroup(db, 'comments'), (snap) => {
    if (!ready) { ready = true; return }
    if (snap.docChanges().length > 0) onUpdate()
  })
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

// Conversation ID: sorted pair of user IDs joined by '_'
function convoId(a: string, b: string) {
  return [a, b].sort().join('_')
}

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
  const messages: Message[] = []
  for (const d of snap.docs) {
    const data = d.data()
    const partnerId = data.partner_id
    const fromProfile = await getProfileById(myId)
    const toProfile = await getProfileById(partnerId)
    if (!fromProfile || !toProfile) continue
    const msgSnap = await getDoc(
      doc(db, 'conversations', convoId(myId, partnerId), 'messages', data.last_message_id)
    )
    if (!msgSnap.exists()) continue
    const msg = await hydrateMessage(
      msgSnap.id,
      { ...msgSnap.data(), conversation_id: convoId(myId, partnerId) },
      data.last_from_id === myId ? fromProfile : toProfile,
      data.last_from_id === myId ? toProfile : fromProfile
    )
    messages.push(msg)
  }
  return messages
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
  await setDoc(doc(db, 'users', fromId, 'inbox', toId), inboxData)
  await setDoc(doc(db, 'users', toId, 'inbox', fromId), {
    ...inboxData,
    partner_id: fromId,
    unread: true,
  })

  const fromProfile = await getProfileById(fromId)
  const toProfile = await getProfileById(toId)
  return hydrateMessage(ref.id, { ...msgData, created_at: Timestamp.now() }, fromProfile!, toProfile!)
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
  await Promise.all(
    snap.docs.map((d) => updateDoc(d.ref, { read_at: serverTimestamp() }))
  )
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
