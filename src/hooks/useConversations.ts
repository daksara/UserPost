// src/hooks/useConversations.ts
// Sumber kebenaran untuk riwayat percakapan. Menyimpan banyak percakapan di
// localStorage, melacak mana yang aktif, dan menyediakan aksi (baru, pilih,
// hapus) plus updater untuk pesan & template percakapan aktif.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChatTurn, Conversation } from '../chat/types'
import {
  MAX_CONVERSATIONS,
  deriveTitle,
  isEmpty,
  makeConversation,
  sanitizeConversations,
} from '../chat/types'

const STORAGE_KEY = 'pendar-conversations'

interface Persisted {
  conversations: Conversation[]
  activeId: string
}

function load(): Persisted {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const conversations = sanitizeConversations(saved.conversations)
    if (conversations.length) {
      const activeId = conversations.some((c) => c.id === saved.activeId)
        ? saved.activeId
        : conversations[0].id
      return { conversations, activeId }
    }
  } catch {
    /* state korup — mulai bersih */
  }
  const fresh = makeConversation()
  return { conversations: [fresh], activeId: fresh.id }
}

export function useConversations() {
  const [{ conversations, activeId }, setState] = useState<Persisted>(load)

  // Tulis ke localStorage tertunda agar streaming token tidak memicu badai write.
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId }))
      } catch {
        /* kuota penuh — abaikan dengan aman */
      }
    }, 300)
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current)
    }
  }, [conversations, activeId])

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId],
  )

  /** Ubah percakapan aktif via fungsi; otomatis perbarui updatedAt. */
  const patchActive = useCallback(
    (fn: (conv: Conversation) => Conversation) => {
      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === s.activeId ? { ...fn(c), updatedAt: Date.now() } : c,
        ),
      }))
    },
    [],
  )

  const setActiveTurns = useCallback(
    (updater: (prev: ChatTurn[]) => ChatTurn[]) => {
      patchActive((c) => {
        const turns = updater(c.turns)
        // Beri judul saat pesan pertama user muncul.
        const firstUser = turns.find((t) => t.role === 'user')
        const title =
          c.title === 'Percakapan baru' && firstUser ? deriveTitle(firstUser.content) : c.title
        return { ...c, turns, title }
      })
    },
    [patchActive],
  )

  const setActiveTemplate = useCallback(
    (templateId: string | null) => patchActive((c) => ({ ...c, templateId })),
    [patchActive],
  )

  const select = useCallback((id: string) => setState((s) => ({ ...s, activeId: id })), [])

  /** Buat percakapan baru — pakai ulang yang aktif bila masih kosong. */
  const newConversation = useCallback(
    (templateId: string | null = null, lessonId: string | null = null, scenarioId: string | null = null) => {
      setState((s) => {
        const current = s.conversations.find((c) => c.id === s.activeId)
        if (current && isEmpty(current)) {
          return {
            activeId: current.id,
            conversations: s.conversations.map((c) =>
              c.id === current.id ? { ...c, templateId, lessonId, scenarioId, updatedAt: Date.now() } : c,
            ),
          }
        }
        const fresh = makeConversation(templateId, lessonId, scenarioId)
        return {
          activeId: fresh.id,
          conversations: [fresh, ...s.conversations].slice(0, MAX_CONVERSATIONS),
        }
      })
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setState((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id)
      if (!remaining.length) {
        const fresh = makeConversation()
        return { conversations: [fresh], activeId: fresh.id }
      }
      const activeId = s.activeId === id ? remaining[0].id : s.activeId
      return { conversations: remaining, activeId }
    })
  }, [])

  return {
    conversations,
    active,
    setActiveTurns,
    setActiveTemplate,
    select,
    newConversation,
    remove,
  }
}
