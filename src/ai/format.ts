// src/ai/format.ts
// Ubah teks polos jawaban AI (sudah dibersihkan oleh cleanText) menjadi blok
// terstruktur — paragraf dan daftar (berpoin/bernomor) — agar bisa dirender
// rapi dengan tipografi yang enak dibaca. Tetap aman: hanya menghasilkan data
// teks, tanpa HTML, sehingga tidak ada jalur injeksi.

export type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

/**
 * Pisahkan teks menjadi blok. Baris kosong memisahkan blok. Baris yang diawali
 * "- " menjadi item daftar berpoin; "1. " / "1) " menjadi daftar bernomor.
 * Baris lain digabung menjadi paragraf (jeda baris di dalamnya dipertahankan).
 */
export function parseBlocks(input: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let items: string[] | null = null
  let listType: 'ul' | 'ol' = 'ul'

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join('\n') })
      para = []
    }
  }
  const flushList = () => {
    if (items && items.length) blocks.push({ type: listType, items })
    items = null
  }

  for (const raw of input.split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed) {
      flushPara()
      flushList()
      continue
    }

    const bullet = /^- +(.*)$/.exec(trimmed)
    const numbered = /^\d+[.)] +(.*)$/.exec(trimmed)

    if (bullet) {
      flushPara()
      if (items && listType !== 'ul') flushList()
      listType = 'ul'
      items = items ?? []
      items.push(bullet[1])
    } else if (numbered) {
      flushPara()
      if (items && listType !== 'ol') flushList()
      listType = 'ol'
      items = items ?? []
      items.push(numbered[1])
    } else {
      flushList()
      para.push(trimmed)
    }
  }

  flushPara()
  flushList()
  return blocks
}
