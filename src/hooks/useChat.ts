// src/hooks/useChat.ts
// Mengelola percakapan: kirim pesan, streaming jawaban, batalkan, dan reset.
import { useCallback, useRef, useState } from 'react'
import { streamChat } from '../ai/providers'
import type { ChatMessage, Provider } from '../ai/types'

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UseChatArgs {
  provider: Provider
  apiKey: string
  model: string
  /** Instruksi sistem (base + template aktif). */
  system: string
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function useChat({ provider, apiKey, model, system }: UseChatArgs) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || streaming) return
      setError(null)

      const userTurn: ChatTurn = { id: uid(), role: 'user', content }
      const aiTurn: ChatTurn = { id: uid(), role: 'assistant', content: '' }
      const history = [...turns, userTurn]
      setTurns([...history, aiTurn])
      setStreaming(true)

      const messages: ChatMessage[] = [
        { role: 'system', content: system },
        ...history.map((t) => ({ role: t.role, content: t.content })),
      ]

      const ac = new AbortController()
      abortRef.current = ac

      try {
        await streamChat({ provider, apiKey, model, messages }, (tok) => {
          setTurns((prev) =>
            prev.map((t) => (t.id === aiTurn.id ? { ...t, content: t.content + tok } : t)),
          )
        }, ac.signal)
      } catch (e) {
        if (!ac.signal.aborted) {
          setError(e instanceof Error ? e.message : String(e))
          // Buang gelembung asisten kosong agar tidak menyisakan bubble hampa.
          setTurns((prev) => prev.filter((t) => !(t.id === aiTurn.id && t.content === '')))
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [turns, streaming, provider, apiKey, model, system],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])
  const reset = useCallback(() => {
    abortRef.current?.abort()
    setTurns([])
    setError(null)
  }, [])

  return { turns, streaming, error, send, stop, reset }
}
