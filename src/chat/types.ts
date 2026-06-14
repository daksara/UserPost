// src/chat/types.ts
// Tipe & helper murni untuk percakapan. Dipisah dari React agar mudah diuji
// dan dipakai ulang oleh hook penyimpanan (useConversations).

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  /** Judul ringkas — diturunkan dari pesan pertama user. */
  title: string
  /** Template freelance yang sedang aktif (null = chat bebas). */
  templateId: string | null
  turns: ChatTurn[]
  createdAt: number
  updatedAt: number
}

/** Berapa banyak percakapan yang disimpan sebelum yang terlama dibuang. */
export const MAX_CONVERSATIONS = 50

const DEFAULT_TITLE = 'Percakapan baru'

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

/**
 * Turunkan judul ringkas dari teks pesan pertama: ambil baris pertama,
 * rapikan spasi, buang tanda kutip pembungkus, dan potong ~48 karakter.
 */
export function deriveTitle(text: string): string {
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  const cleaned = firstLine.replace(/\s+/g, ' ').replace(/^["'"“”]+|["'"“”]+$/g, '').trim()
  if (!cleaned) return DEFAULT_TITLE
  return cleaned.length > 48 ? `${cleaned.slice(0, 47).trimEnd()}…` : cleaned
}

export function makeConversation(templateId: string | null = null): Conversation {
  const now = Date.now()
  return { id: uid(), title: DEFAULT_TITLE, templateId, turns: [], createdAt: now, updatedAt: now }
}

/** True jika percakapan belum punya pesan apa pun. */
export function isEmpty(conv: Conversation): boolean {
  return conv.turns.length === 0
}

/**
 * Validasi data dari localStorage menjadi daftar Conversation yang aman.
 * Membuang entri rusak agar app tidak crash karena state lama/korup.
 */
export function sanitizeConversations(raw: unknown): Conversation[] {
  if (!Array.isArray(raw)) return []
  const out: Conversation[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const c = item as Partial<Conversation>
    if (typeof c.id !== 'string' || !Array.isArray(c.turns)) continue
    const turns = c.turns.filter(
      (t): t is ChatTurn =>
        !!t &&
        typeof (t as ChatTurn).id === 'string' &&
        ((t as ChatTurn).role === 'user' || (t as ChatTurn).role === 'assistant') &&
        typeof (t as ChatTurn).content === 'string',
    )
    out.push({
      id: c.id,
      title: typeof c.title === 'string' && c.title ? c.title : DEFAULT_TITLE,
      templateId: typeof c.templateId === 'string' ? c.templateId : null,
      turns,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
    })
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS)
}
