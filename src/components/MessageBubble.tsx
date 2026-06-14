// src/components/MessageBubble.tsx
import { useState } from 'react'
import type { ChatTurn } from '../hooks/useChat'

export function MessageBubble({ turn, streaming }: { turn: ChatTurn; streaming: boolean }) {
  const [copied, setCopied] = useState(false)
  const isUser = turn.role === 'user'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(turn.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div className={`msg${isUser ? ' msg--user' : ''}`}>
      <div className="msg__role">{isUser ? 'Kamu' : 'Pendar'}</div>
      <div className="msg__bubble">
        {turn.content}
        {streaming && !isUser && <span className="msg__caret" />}
      </div>
      {!isUser && turn.content && (
        <button className="msg__copy pdr-link" onClick={copy}>
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      )}
    </div>
  )
}
