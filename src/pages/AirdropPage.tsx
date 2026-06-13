// src/pages/AirdropPage.tsx
//
// Tracker airdrop: user paste teks mentah dari grup → diparsing otomatis jadi
// terstruktur (nama, reward, link, tugas) → bisa diedit → simpan ke Firebase.
// Tugas bisa dicentang, progres & status tersimpan per user.
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { parseAirdrop } from '../lib/airdropParser'
import {
  signIn, signUpEmail, signOut,
  createAirdrop, subscribeToAirdrops, updateAirdropTasks, deleteAirdrop,
  type Airdrop, type AirdropTask,
} from '../lib/firebase'

export default function AirdropPage({ active }: { active: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Memuat…</div>
  if (!user) return <AuthGate />
  return <Tracker userId={user.uid} active={active} />
}

// ── Login / Daftar (form ringkas, khusus simpan data airdrop) ────────
function AuthGate() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (mode === 'in') await signIn(email, password)
      else await signUpEmail(email, password)
    } catch (err: any) {
      setError(err?.message?.replace('Firebase: ', '') ?? 'Gagal. Coba lagi.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ maxWidth: 380, margin: '0 auto', padding: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>
        {mode === 'in' ? 'Masuk' : 'Daftar'} untuk simpan airdrop
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        Catatan airdrop-mu tersimpan di akunmu & sinkron antar perangkat.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email" placeholder="Email" value={email} required
          onChange={(e) => setEmail(e.target.value)} style={input}
        />
        <input
          type="password" placeholder="Password (min 6 karakter)" value={password} required
          onChange={(e) => setPassword(e.target.value)} style={input}
        />
        {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? '…' : mode === 'in' ? 'Masuk' : 'Daftar'}
        </button>
      </form>
      <button
        onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError('') }}
        style={{ ...btnLink, marginTop: 12 }}
      >
        {mode === 'in' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </div>
  )
}

// ── Tracker utama ────────────────────────────────────────────────
function Tracker({ userId, active }: { userId: string; active: boolean }) {
  const [airdrops, setAirdrops] = useState<Airdrop[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!active) return
    const unsub = subscribeToAirdrops(userId, setAirdrops, (e) => setErr(e.message))
    return () => unsub()
  }, [userId, active])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Airdrop Tracker</h2>
        <button onClick={() => signOut()} style={btnLink}>Keluar</button>
      </div>

      <Importer userId={userId} />

      {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}

      {airdrops.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
          Belum ada airdrop. Paste teks dari grup di atas untuk mulai melacak.
        </p>
      ) : (
        airdrops.map((a) => <AirdropCard key={a.id} airdrop={a} />)
      )}
    </div>
  )
}

// ── Import: paste → parse → preview editable → simpan ────────────────
function Importer({ userId }: { userId: string }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ReturnType<typeof parseAirdrop> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleParse = () => {
    if (!raw.trim()) return
    setParsed(parseAirdrop(raw))
  }

  const handleSave = async () => {
    if (!parsed || !parsed.name.trim()) return
    setSaving(true)
    try {
      await createAirdrop(userId, {
        name: parsed.name.trim(),
        reward: parsed.reward.trim(),
        registerUrl: parsed.registerUrl.trim(),
        raw,
        tasks: parsed.tasks.map((t) => t.trim()).filter(Boolean),
      })
      setRaw(''); setParsed(null)
    } finally { setSaving(false) }
  }

  return (
    <div style={card}>
      <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Tempel teks airdrop</label>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={'New Airdrops : Worm WTF\n🏷 Reward : $200,000\n🪂 Register : https://t.me/...\n➖️ Complete Task\n➖️ Earn Points'}
        rows={5}
        style={{ ...input, fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', resize: 'vertical' }}
      />
      {!parsed ? (
        <button onClick={handleParse} disabled={!raw.trim()} style={btnPrimary}>
          Rapikan otomatis ✨
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <Field label="Nama" value={parsed.name} onChange={(v) => setParsed({ ...parsed, name: v })} />
          <Field label="Reward" value={parsed.reward} onChange={(v) => setParsed({ ...parsed, reward: v })} />
          <Field label="Link daftar" value={parsed.registerUrl} onChange={(v) => setParsed({ ...parsed, registerUrl: v })} />
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tugas ({parsed.tasks.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {parsed.tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={t}
                    onChange={(e) => {
                      const next = [...parsed.tasks]; next[i] = e.target.value
                      setParsed({ ...parsed, tasks: next })
                    }}
                    style={{ ...input, flex: 1 }}
                  />
                  <button
                    onClick={() => setParsed({ ...parsed, tasks: parsed.tasks.filter((_, j) => j !== i) })}
                    style={btnGhost}
                    aria-label="Hapus tugas"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => setParsed({ ...parsed, tasks: [...parsed.tasks, ''] })}
                style={{ ...btnLink, alignSelf: 'flex-start' }}
              >+ Tambah tugas</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving || !parsed.name.trim()} style={btnPrimary}>
              {saving ? 'Menyimpan…' : 'Simpan ke tracker'}
            </button>
            <button onClick={() => setParsed(null)} style={btnGhost}>Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  )
}

// ── Kartu airdrop tersimpan ──────────────────────────────────────────
function AirdropCard({ airdrop }: { airdrop: Airdrop }) {
  const done = airdrop.tasks.filter((t) => t.done).length
  const total = airdrop.tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const toggle = async (idx: number) => {
    const next: AirdropTask[] = airdrop.tasks.map((t, i) => i === idx ? { ...t, done: !t.done } : t)
    await updateAirdropTasks(airdrop.id, next)
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
            {airdrop.name}{' '}
            {airdrop.status === 'done' && <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>✓ selesai</span>}
          </h3>
          {airdrop.reward && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reward: {airdrop.reward}</span>
          )}
        </div>
        <button onClick={() => deleteAirdrop(airdrop.id)} style={btnGhost} aria-label="Hapus airdrop">🗑</button>
      </div>

      {airdrop.register_url && (
        <a href={airdrop.register_url} target="_blank" rel="noreferrer"
           style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
          → Buka link daftar
        </a>
      )}

      {total > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-input)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{done}/{total}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {airdrop.tasks.map((t, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={t.done} onChange={() => toggle(i)} />
                <span style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {t.text}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 16, padding: 16,
}
const input: React.CSSProperties = {
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem',
  color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
  padding: '10px 16px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer',
}
const btnLink: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--accent)',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left',
}
