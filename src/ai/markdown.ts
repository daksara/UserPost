// src/ai/markdown.ts
// Parser markdown ringan & murni (tanpa React, tanpa HTML) untuk jawaban AI agar
// bisa dirender rapi ala Claude: heading, paragraf, daftar, kutipan, garis,
// blok kode, tabel, plus penanda inline (tebal, miring, coret, kode, tautan).
// Hanya menghasilkan data terstruktur — komponen React yang merendernya, jadi
// tidak ada jalur injeksi HTML. Logika di sini dapat diuji terpisah.

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strike'; value: string }
  | { type: 'link'; value: string; href: string }

export type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[]; start: number }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'table'; header: string[]; align: Align[]; rows: string[][] }

export type Align = 'left' | 'center' | 'right' | null

// ── Inline ────────────────────────────────────────────────────────────────
// Penanda inline diproses dari yang paling spesifik ke umum. Kode lebih dulu
// agar isinya tidak ikut ditafsirkan sebagai penanda lain.
interface InlineRule {
  re: RegExp
  make: (m: RegExpExecArray) => InlineToken
}

const INLINE_RULES: InlineRule[] = [
  { re: /`([^`]+)`/, make: (m) => ({ type: 'code', value: m[1] }) },
  {
    re: /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/,
    make: (m) => ({ type: 'link', value: m[1], href: m[2] }),
  },
  { re: /\*\*([^*\n]+?)\*\*/, make: (m) => ({ type: 'strong', value: m[1] }) },
  { re: /__([^_\n]+?)__/, make: (m) => ({ type: 'strong', value: m[1] }) },
  { re: /~~([^~\n]+?)~~/, make: (m) => ({ type: 'strike', value: m[1] }) },
  { re: /(?<![*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/, make: (m) => ({ type: 'em', value: m[1] }) },
  { re: /(?<![_\w])_(?!\s)([^_\n]+?)_(?![_\w])/, make: (m) => ({ type: 'em', value: m[1] }) },
]

/** Pisahkan satu baris teks menjadi token inline. Murni & dapat diuji. */
export function parseInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let rest = input

  while (rest) {
    let best: { index: number; length: number; token: InlineToken } | null = null

    for (const rule of INLINE_RULES) {
      const m = rule.re.exec(rest)
      if (!m) continue
      if (!best || m.index < best.index) {
        best = { index: m.index, length: m[0].length, token: rule.make(m) }
      }
      if (m.index === 0) break // tidak akan ada yang lebih awal
    }

    if (!best) {
      tokens.push({ type: 'text', value: rest })
      break
    }
    if (best.index > 0) tokens.push({ type: 'text', value: rest.slice(0, best.index) })
    tokens.push(best.token)
    rest = rest.slice(best.index + best.length)
  }

  return tokens
}

// ── Block ─────────────────────────────────────────────────────────────────
const RE_FENCE = /^ {0,3}```(.*)$/
const RE_HEADING = /^ {0,3}(#{1,6})\s+(.*)$/
const RE_HR = /^ {0,3}([-*_])( *\1){2,} *$/
const RE_QUOTE = /^ {0,3}>\s?(.*)$/
const RE_UL = /^ {0,3}[-*+]\s+(.*)$/
const RE_UL_DOT = /^ {0,3}•\s+(.*)$/
const RE_OL = /^ {0,3}(\d+)[.)]\s+(.*)$/
const RE_TABLE_SEP = /^ {0,3}\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

function rowAlign(cell: string): Align {
  const left = cell.startsWith(':')
  const right = cell.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  if (left) return 'left'
  return null
}

/**
 * Ubah teks markdown menjadi daftar blok. Mendukung heading, paragraf, blok
 * kode berpagar, daftar berpoin/bernomor, kutipan, garis horizontal, dan tabel
 * GFM sederhana. Daftar satu tingkat (tanpa nesting).
 */
export function parseMarkdown(input: string): Block[] {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  const isListStart = (l: string) => RE_UL.test(l) || RE_UL_DOT.test(l) || RE_OL.test(l)

  while (i < lines.length) {
    const line = lines[i]

    // Baris kosong → pemisah blok.
    if (!line.trim()) {
      i++
      continue
    }

    // Blok kode berpagar ```
    const fence = RE_FENCE.exec(line)
    if (fence) {
      const lang = fence[1].trim()
      const body: string[] = []
      i++
      while (i < lines.length && !RE_FENCE.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      i++ // lewati pagar penutup
      blocks.push({ type: 'code', lang, code: body.join('\n') })
      continue
    }

    // Garis horizontal
    if (RE_HR.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Heading
    const heading = RE_HEADING.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() })
      i++
      continue
    }

    // Tabel: baris header diikuti baris pemisah |---|---|
    if (line.includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1])) {
      const header = splitRow(line)
      const align = splitRow(lines[i + 1]).map(rowAlign)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ type: 'table', header, align, rows })
      continue
    }

    // Kutipan (gabung baris berturut yang diawali >)
    if (RE_QUOTE.test(line)) {
      const quoted: string[] = []
      while (i < lines.length) {
        const m = RE_QUOTE.exec(lines[i])
        if (!m) break
        quoted.push(m[1])
        i++
      }
      blocks.push({ type: 'quote', text: quoted.join('\n') })
      continue
    }

    // Daftar berpoin
    if (RE_UL.test(line) || RE_UL_DOT.test(line)) {
      const items: string[] = []
      while (i < lines.length) {
        const m = RE_UL.exec(lines[i]) ?? RE_UL_DOT.exec(lines[i])
        if (!m) break
        items.push(m[1])
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Daftar bernomor
    const ol = RE_OL.exec(line)
    if (ol) {
      const items: string[] = []
      const start = Number(ol[1])
      while (i < lines.length) {
        const m = RE_OL.exec(lines[i])
        if (!m) break
        items.push(m[2])
        i++
      }
      blocks.push({ type: 'ol', items, start })
      continue
    }

    // Paragraf: gabung baris berturut sampai baris kosong / awal blok lain.
    const para: string[] = []
    while (i < lines.length) {
      const l = lines[i]
      if (
        !l.trim() ||
        RE_FENCE.test(l) ||
        RE_HEADING.test(l) ||
        RE_HR.test(l) ||
        RE_QUOTE.test(l) ||
        isListStart(l)
      ) {
        break
      }
      para.push(l.trim())
      i++
    }
    blocks.push({ type: 'p', text: para.join('\n') })
  }

  return blocks
}
