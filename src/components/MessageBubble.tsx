// src/components/MessageBubble.tsx
import { useState } from 'react'
import type { ChatTurn } from '../chat/types'
import { cleanText } from '../ai/clean'
import { Markdown } from './Markdown'
import { useI18n } from '../i18n/i18n'
import { Logo } from './Logo'

interface Props {
  turn: ChatTurn
  streaming: boolean
  /** Tampilkan aksi regenerasi (hanya untuk jawaban AI terakhir, saat idle). */
  onRegenerate?: () => void
}

export function MessageBubble({ turn, streaming, onRegenerate }: Props) {
  const { t } = useI18n()
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
          {isUser ? text : <Markdown text={text} streaming={streaming} />}
        </div>
        {!isUser && turn.content && !streaming && (
          <div className="msg__actions">
            <button className="msg__action pdr-link" onClick={copy}>
              {copied ? t('msg.copied') : t('msg.copy')}
            </button>
            {onRegenerate && (
              <button className="msg__action pdr-link" onClick={onRegenerate}>
                {t('msg.regenerate')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
