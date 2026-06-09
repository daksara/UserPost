// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
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
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'

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
  const snap = await getDoc(doc(db, 'profiles', userId))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
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
}

// ── Auth ───────────────────────────────────────────────────────────

export async function signUp(username: string, password: string) {
  // Check username uniqueness first
  const available = await checkUsernameAvailable(username)
  if (!available) throw new Error('Username already taken')

  const email = `up.${username.toLowerCase()}@userpost.app`
  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  // Create profile document
  await setDoc(doc(db, 'profiles', user.uid), {
    username,
    created_at: serverTimestamp(),
    is_verified: false,
  })

  // Create username index for lookup
  await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid })

  return user
}

export async function signIn(username: string, password: string) {
  const email = `up.${username.toLowerCase()}@userpost.app`
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function signOut() {
  await firebaseSignOut(auth)
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
  const commentsSnap = await getDocs(
    query(collection(db, 'posts', postId, 'comments'), orderBy('created_at', 'asc'))
  )
  const comments: Comment[] = await Promise.all(
    commentsSnap.docs.map(async (c) => {
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
  return {
    id: postId,
    user_id: data.user_id,
    body: data.body,
    contract_address: data.contract_address ?? null,
    link_url: data.link_url ?? null,
    expires_at: tsToISO(data.expires_at),
    created_at: tsToISO(data.created_at),
    profiles: profile!,
    comments,
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

export async function addComment(postId: string, userId: string, body: string): Promise<Comment> {
  const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
    user_id: userId,
    body,
    created_at: serverTimestamp(),
  })
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

// ── Realtime (replaces useRealtime hook) ───────────────────────────

export function subscribeToCollection(
  collectionPath: string,
  callback: () => void
): Unsubscribe {
  return onSnapshot(collection(db, collectionPath), callback)
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
}


export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Not authenticated')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export { onAuthStateChanged, type User }
