import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  body: string
  contract_address: string | null
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

// ── Auth ───────────────────────────────────────────────────────────

export async function signUp(username: string, password: string) {
  // Use username as email prefix — Supabase requires email format
  const email = `up.${username.toLowerCase()}@gmail.com`
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  return data
}

export async function signIn(username: string, password: string) {
  const email = `up.${username.toLowerCase()}@gmail.com`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return !data
}

// ── Posts ──────────────────────────────────────────────────────────

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey(*),
      comments(*, profiles!comments_user_id_fkey(*))
    `)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Post[]
}

export async function createPost(
  userId: string,
  body: string,
  contractAddress?: string
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, body, contract_address: contractAddress ?? null })
    .select(`*, profiles!posts_user_id_fkey(*), comments(*, profiles!comments_user_id_fkey(*))`)
    .single()
  if (error) throw error
  return data as Post
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function addComment(postId: string, userId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select('*, profiles!comments_user_id_fkey(*)')
    .single()
  if (error) throw error
  return data as Comment
}

// ── Messages ───────────────────────────────────────────────────────

export async function getConversation(myId: string, otherId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_id_fkey(*),
      to_profile:profiles!messages_to_id_fkey(*)
    `)
    .or(`and(from_id.eq.${myId},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${myId})`)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function getConversationList(myId: string) {
  // Get latest message per conversation partner
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_id_fkey(*),
      to_profile:profiles!messages_to_id_fkey(*)
    `)
    .or(`from_id.eq.${myId},to_id.eq.${myId}`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  // Dedupe by conversation partner
  const seen = new Set<string>()
  const convos: Message[] = []
  for (const msg of (data ?? []) as Message[]) {
    const partnerId = msg.from_id === myId ? msg.to_id : msg.from_id
    if (!seen.has(partnerId)) {
      seen.add(partnerId)
      convos.push(msg)
    }
  }
  return convos
}

export async function sendMessage(
  fromId: string,
  toId: string,
  body: string,
  replyToId?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ from_id: fromId, to_id: toId, body, reply_to_id: replyToId ?? null })
    .select(`
      *,
      from_profile:profiles!messages_from_id_fkey(*),
      to_profile:profiles!messages_to_id_fkey(*)
    `)
    .single()
  if (error) throw error
  return data as Message
}

export async function markMessagesRead(myId: string, fromId: string) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('to_id', myId)
    .eq('from_id', fromId)
    .is('read_at', null)
}

export async function softDeleteMessage(messageId: string) {
  await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
}

export async function getUnreadCount(myId: string): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_id', myId)
    .is('read_at', null)
    .is('deleted_at', null)
  return count ?? 0
}

export async function getUserByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  return data
}
