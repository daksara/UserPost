// src/components/Markdown.tsx
// Render jawaban AI dari blok markdown (lihat ai/markdown.ts) menjadi elemen
// React rapi ala Claude: heading, paragraf, daftar, kutipan, garis, tabel, dan
// blok kode dengan tombol salin. Hanya elemen React — tanpa HTML mentah,
// sehingga aman dari injeksi. Caret kedip diselipkan saat streaming.
import { Fragment, useState } from 'react'
import { parseInline, parseMarkdown } from '../ai/markdown'
import type { Align, Block, InlineToken } from '../ai/markdown'
import { useI18n } from '../i18n/i18n'

function Inline({ text }: { text: string }) {
  const tokens = parseInline(text)
  return (
    <>
      {tokens.map((tok: InlineToken, i) => {
        switch (tok.type) {
          case 'strong':
            return <strong key={i}>{tok.value}</strong>
          case 'em':
            return <em key={i}>{tok.value}</em>
          case 'strike':
            return <s key={i}>{tok.value}</s>
          case 'code':
            return (
              <code key={i} className="md-code-inline">
                {tok.value}
              </code>
            )
          case 'link':
            return (
              <a key={i} href={tok.href} target="_blank" rel="noopener noreferrer" className="md-link">
                {tok.value}
              </a>
            )
          default:
            return <Fragment key={i}>{tok.value}</Fragment>
        }
      })}
    </>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard tidak tersedia */
    }
  }
  return (
    <div className="md-codeblock">
      <div className="md-codeblock__head">
        <span className="md-codeblock__lang">{lang || 'code'}</span>
        <button className="md-codeblock__copy" onClick={copy}>
          {copied ? t('msg.copied') : t('msg.copyCode')}
        </button>
      </div>
      <pre className="md-codeblock__pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function colStyle(align: Align): React.CSSProperties | undefined {
  return align ? { textAlign: align } : undefined
}

export function Markdown({ text, streaming }: { text: string; streaming: boolean }) {
  const blocks = parseMarkdown(text)
  if (blocks.length === 0) return streaming ? <span className="msg__caret" /> : null

  const last = blocks.length - 1
  const caretAt = (i: number) =>
    streaming && i === last ? <span className="msg__caret" /> : null

  return (
    <>
      {blocks.map((b: Block, i) => {
        switch (b.type) {
          case 'heading': {
            const H = `h${Math.min(b.level + 2, 6)}` as 'h3'
            return (
              <H key={i} className="md-h">
                <Inline text={b.text} />
                {caretAt(i)}
              </H>
            )
          }
          case 'code':
            return (
              <Fragment key={i}>
                <CodeBlock lang={b.lang} code={b.code} />
                {caretAt(i)}
              </Fragment>
            )
          case 'ul':
            return (
              <ul key={i} className="rt-ul">
                {b.items.map((it, j) => (
                  <li key={j} className="rt-li">
                    <Inline text={it} />
                    {j === b.items.length - 1 ? caretAt(i) : null}
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="rt-ol" start={b.start}>
                {b.items.map((it, j) => (
                  <li key={j} className="rt-li">
                    <Inline text={it} />
                    {j === b.items.length - 1 ? caretAt(i) : null}
                  </li>
                ))}
              </ol>
            )
          case 'quote':
            return (
              <blockquote key={i} className="md-quote">
                <Inline text={b.text} />
                {caretAt(i)}
              </blockquote>
            )
          case 'hr':
            return <hr key={i} className="md-hr" />
          case 'table':
            return (
              <div key={i} className="md-table-wrap">
                <table className="md-table">
                  <thead>
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} style={colStyle(b.align[j] ?? null)}>
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} style={colStyle(b.align[c] ?? null)}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {caretAt(i)}
              </div>
            )
          default:
            return (
              <p key={i} className="rt-p">
                <Inline text={b.text} />
                {caretAt(i)}
              </p>
            )
        }
      })}
    </>
  )
}
