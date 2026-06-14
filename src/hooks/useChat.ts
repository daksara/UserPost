// src/hooks/useChat.ts
// Logika streaming percakapan: kirim pesan, streaming jawaban, regenerasi,
// batalkan. Pesan (turns) dikelola di luar (useConversations) agar bisa
// dipersistenkan — hook ini hanya menulis lewat `setTurns`.
import { useCallback, useRef, useState } from 'react'
import { streamChat } from '../ai/providers'
import { uid } from '../chat/types'
import type { ChatTurn } from '../chat/types'
import type { ChatMessage, Provider } from '../ai/types'

export type { ChatTurn } from '../chat/types'

// Batas jumlah turn (user+asisten) yang dikirim ke provider tiap request.
// Mencegah percakapan panjang membengkak melewati context window / boros token;
// pesan system selalu dikirim terpisah di luar batas ini.
export const MAX_CONTEXT_TURNS = 24

interface UseChatArgs {
  provider: Provider
  apiKey: string
  model: string
  /** Instruksi sistem (base + template aktif). */
  system: string
  /** Pesan percakapan aktif (dikontrol oleh pemanggil). */
  turns: ChatTurn[]
  setTurns: (updater: (prev: ChatTurn[]) => ChatTurn[]) => void
}

export function useChat({ provider, apiKey, model, system, turns, setTurns }: UseChatArgs) {
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Inti streaming: kirim `history` ke provider, alirkan token ke turn `aiId`.
  const runStream = useCallback(
    async (history: ChatTurn[], aiId: string) => {
      // Hanya kirim potongan terakhir agar tetap di dalam context window.
      const recent = history.slice(-MAX_CONTEXT_TURNS)
      const messages: ChatMessage[] = [
        { role: 'system', content: system },
        ...recent.map((t) => ({ role: t.role, content: t.content })),
      ]

      const ac = new AbortController()
      abortRef.current = ac
      setStreaming(true)

      try {
        await streamChat({ provider, apiKey, model, messages }, (tok) => {
          setTurns((prev) =>
            prev.map((t) => (t.id === aiId ? { ...t, content: t.content + tok } : t)),
          )
        }, ac.signal)
      } catch (e) {
        // Hanya tampilkan error bila bukan pembatalan yang disengaja user.
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        // Buang turn asisten yang masih kosong (gagal maupun di-stop sebelum
        // token pertama) agar tak menyisakan bubble hampa.
        setTurns((prev) => prev.filter((t) => !(t.id === aiId && t.content === '')))
        setStreaming(false)
        abortRef.current = null
      }
    },
    [provider, apiKey, model, system, setTurns],
  )

  const send = useCallback(
    (text: string) => {
      const content = text.trim()
      if (!content || streaming) return
      setError(null)

      const userTurn: ChatTurn = { id: uid(), role: 'user', content }
      const aiTurn: ChatTurn = { id: uid(), role: 'assistant', content: '' }
      const history = [...turns, userTurn]
      setTurns(() => [...history, aiTurn])
      void runStream(history, aiTurn.id)
    },
    [turns, streaming, setTurns, runStream],
  )

  // Ulangi jawaban terakhir: buang turn asisten di ujung, stream ulang dari
  // pesan user terakhir.
  const regenerate = useCallback(() => {
    if (streaming) return
    let i = turns.length - 1
    while (i >= 0 && turns[i].role === 'assistant') i--
    if (i < 0) return
    setError(null)

    const history = turns.slice(0, i + 1)
    const aiTurn: ChatTurn = { id: uid(), role: 'assistant', content: '' }
    setTurns(() => [...history, aiTurn])
    void runStream(history, aiTurn.id)
  }, [turns, streaming, setTurns, runStream])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const canRegenerate =
    !streaming && turns.length > 0 && turns[turns.length - 1].role === 'assistant'

  return { streaming, error, send, regenerate, stop, canRegenerate }
}
