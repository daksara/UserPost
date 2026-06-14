// src/components/MessageBubble.tsx
import { useState } from 'react'
import type { ChatTurn } from '../hooks/useChat'
import { cleanText } from '../ai/clean'
import { Logo } from './Logo'

export function MessageBubble({ turn, streaming }: { turn: ChatTurn; streaming: boolean }) {
  const [copied, setCopied] = useState(false)
  const isUser = turn.role === 'user'
  const text = isUser ? turn.content : cleanText(turn.content)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div className={`msg${isUser ? ' msg--user' : ' msg--ai'}`}>
      {!isUser && (
        <div className="msg__avatar" aria-hidden>
          <Logo size={17} color="#fff" />
        </div>
      )}
      <div className="msg__col">
        <div className="msg__bubble">
          {text}
          {streaming && !isUser && <span className="msg__caret" />}
        </div>
        {!isUser && turn.content && (
          <button className="msg__copy pdr-link" onClick={copy}>
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        )}
      </div>
    </div>
  )
}
