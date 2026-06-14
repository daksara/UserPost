// src/components/MessageBubble.tsx
import { useState } from 'react'
import type { ChatTurn } from '../chat/types'
import { cleanText } from '../ai/clean'
import { parseBlocks } from '../ai/format'
import { useI18n } from '../i18n/i18n'
import { Logo } from './Logo'

export function MessageBubble({ turn, streaming }: { turn: ChatTurn; streaming: boolean }) {
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
          {isUser ? text : <FormattedText text={text} streaming={streaming} />}
        </div>
        {!isUser && turn.content && (
          <button className="msg__copy pdr-link" onClick={copy}>
            {copied ? t('msg.copied') : t('msg.copy')}
          </button>
        )}
      </div>
    </div>
  )
}

// Render teks jawaban AI sebagai paragraf & daftar rapi. Caret kedip diselipkan
// di akhir blok terakhir saat streaming agar tetap menyatu dengan teks.
function FormattedText({ text, streaming }: { text: string; streaming: boolean }) {
  const blocks = parseBlocks(text)
  if (blocks.length === 0) return streaming ? <span className="msg__caret" /> : null

  const last = blocks.length - 1
  return (
    <>
      {blocks.map((b, i) => {
        const caret = streaming && i === last ? <span className="msg__caret" /> : null
        if (b.type === 'p') {
          return (
            <p key={i} className="rt-p">
              {b.text}
              {caret}
            </p>
          )
        }
        const items = b.items.map((it, j) => (
          <li key={j} className="rt-li">
            {it}
            {j === b.items.length - 1 ? caret : null}
          </li>
        ))
        return b.type === 'ul' ? (
          <ul key={i} className="rt-ul">
            {items}
          </ul>
        ) : (
          <ol key={i} className="rt-ol">
            {items}
          </ol>
        )
      })}
    </>
  )
}
