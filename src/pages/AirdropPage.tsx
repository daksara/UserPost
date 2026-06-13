// src/pages/AirdropPage.tsx
//
// Tracker airdrop: user paste teks mentah dari grup → diparsing otomatis jadi
// terstruktur (nama, reward, link, tugas) → bisa diedit → simpan ke Firebase.
// Tugas bisa dicentang, progres & status tersimpan per user.
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useT } from '../i18n'
import { parseAirdrop } from '../lib/airdropParser'
import {
  signIn, signUpEmail, signOut,
  createAirdrop, subscribeToAirdrops, updateAirdropTasks, deleteAirdrop,
  type Airdrop, type AirdropTask,
} from '../lib/firebase'

// ── Ikon (SVG bersih, bukan emoji) ───────────────────────────────────
const ic = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IconSparkle = () => <svg {...ic}><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>
const IconTrash = () => <svg {...ic}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
const IconClose = () => <svg {...ic}><path d="M18 6L6 18M6 6l12 12"/></svg>
const IconPlus = () => <svg {...ic}><path d="M12 5v14M5 12h14"/></svg>
const IconCheck = () => <svg {...ic} width={13} height={13}><path d="M20 6L9 17l-5-5"/></svg>
const IconExternal = () => <svg {...ic} width={14} height={14}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>

export default function AirdropPage({ active }: { active: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>…</div>
  if (!user) return <AuthGate />
  return <Tracker userId={user.uid} active={active} />
}

// ── Login / Daftar ───────────────────────────────────────────────────
function AuthGate() {
  const t = useT()
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
      setError(err?.message?.replace('Firebase: ', '') ?? t('Gagal. Coba lagi.', 'Failed. Try again.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="pdr-rise" style={{ maxWidth: 380, margin: '40px auto 0', padding: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
        {mode === 'in' ? t('Masuk untuk simpan airdrop', 'Sign in to save airdrops') : t('Daftar untuk simpan airdrop', 'Sign up to save airdrops')}
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        {t('Catatan airdrop-mu tersimpan di akunmu & sinkron antar perangkat.', 'Your airdrop notes are saved to your account & synced across devices.')}
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input className="pdr-input" type="email" placeholder="Email" value={email} required
          onChange={(e) => setEmail(e.target.value)} />
        <input className="pdr-input" type="password" placeholder={t('Password (min 6 karakter)', 'Password (min 6 chars)')} value={password} required
          onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: '0.82rem' }}>{error}</p>}
        <button type="submit" disabled={busy} className="pdr-btn pdr-btn--primary" style={{ marginTop: 4 }}>
          {busy ? '…' : mode === 'in' ? t('Masuk', 'Sign in') : t('Daftar', 'Sign up')}
        </button>
      </form>
      <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError('') }}
        className="pdr-link" style={{ marginTop: 14 }}>
        {mode === 'in' ? t('Belum punya akun? Daftar', "No account? Sign up") : t('Sudah punya akun? Masuk', 'Have an account? Sign in')}
      </button>
    </div>
  )
}

// ── Tracker utama ────────────────────────────────────────────────────
function Tracker({ userId, active }: { userId: string; active: boolean }) {
  const t = useT()
  const [airdrops, setAirdrops] = useState<Airdrop[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!active) return
    const unsub = subscribeToAirdrops(userId, setAirdrops, (e) => setErr(e.message))
    return () => unsub()
  }, [userId, active])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>Airdrop Tracker</h2>
        <button onClick={() => signOut()} className="pdr-link">{t('Keluar', 'Sign out')}</button>
      </div>

      <Importer userId={userId} />

      {err && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{err}</p>}

      {airdrops.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
          {t('Belum ada airdrop. Tempel teks dari grup di atas untuk mulai melacak.', 'No airdrops yet. Paste text from a group above to start tracking.')}
        </p>
      ) : (
        airdrops.map((a, i) => <AirdropCard key={a.id} airdrop={a} index={i} />)
      )}
    </div>
  )
}

// ── Import: paste → parse → preview editable → simpan ─────────────────
function Importer({ userId }: { userId: string }) {
  const t = useT()
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ReturnType<typeof parseAirdrop> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleParse = () => { if (raw.trim()) setParsed(parseAirdrop(raw)) }

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
    <div className="pdr-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t('Tempel teks airdrop', 'Paste airdrop text')}</label>
      <textarea
        className="pdr-input"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={'New Airdrops : Worm WTF\nReward : $200,000\nRegister : https://t.me/...\nComplete Task\nEarn Points'}
        rows={5}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', resize: 'vertical' }}
      />
      {!parsed ? (
        <button onClick={handleParse} disabled={!raw.trim()} className="pdr-btn pdr-btn--primary" style={{ alignSelf: 'flex-start' }}>
          <IconSparkle /> {t('Rapikan otomatis', 'Auto-tidy')}
        </button>
      ) : (
        <div className="pdr-rise" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <Field label={t('Nama', 'Name')} value={parsed.name} onChange={(v) => setParsed({ ...parsed, name: v })} />
          <Field label="Reward" value={parsed.reward} onChange={(v) => setParsed({ ...parsed, reward: v })} />
          <Field label={t('Link daftar', 'Register link')} value={parsed.registerUrl} onChange={(v) => setParsed({ ...parsed, registerUrl: v })} />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('Tugas', 'Tasks')} ({parsed.tasks.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {parsed.tasks.map((task, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="pdr-input" value={task}
                    onChange={(e) => { const next = [...parsed.tasks]; next[i] = e.target.value; setParsed({ ...parsed, tasks: next }) }}
                  />
                  <button className="pdr-icon-btn" aria-label={t('Hapus tugas', 'Remove task')}
                    onClick={() => setParsed({ ...parsed, tasks: parsed.tasks.filter((_, j) => j !== i) })}>
                    <IconClose />
                  </button>
                </div>
              ))}
              <button className="pdr-link" style={{ alignSelf: 'flex-start', marginTop: 2 }}
                onClick={() => setParsed({ ...parsed, tasks: [...parsed.tasks, ''] })}>
                <IconPlus /> {t('Tambah tugas', 'Add task')}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving || !parsed.name.trim()} className="pdr-btn pdr-btn--primary">
              {saving ? t('Menyimpan…', 'Saving…') : t('Simpan ke tracker', 'Save to tracker')}
            </button>
            <button onClick={() => setParsed(null)} className="pdr-btn pdr-btn--ghost">{t('Batal', 'Cancel')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
      <input className="pdr-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

// ── Kartu airdrop tersimpan ───────────────────────────────────────────
function AirdropCard({ airdrop, index }: { airdrop: Airdrop; index: number }) {
  const t = useT()
  const done = airdrop.tasks.filter((task) => task.done).length
  const total = airdrop.tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const toggle = async (idx: number) => {
    const next: AirdropTask[] = airdrop.tasks.map((task, i) => i === idx ? { ...task, done: !task.done } : task)
    await updateAirdropTasks(airdrop.id, next)
  }

  return (
    <div className="pdr-card pdr-card--hover pdr-rise" style={{ display: 'flex', flexDirection: 'column', gap: 12, animationDelay: `${Math.min(index, 8) * 0.04}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {airdrop.name}
            {airdrop.status === 'done' && <span className="pdr-done"><IconCheck /> {t('selesai', 'done')}</span>}
          </h3>
          {airdrop.reward && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Reward: {airdrop.reward}</div>
          )}
        </div>
        <button className="pdr-icon-btn" aria-label={t('Hapus airdrop', 'Delete airdrop')} onClick={() => deleteAirdrop(airdrop.id)}>
          <IconTrash />
        </button>
      </div>

      {airdrop.register_url && (
        <a href={airdrop.register_url} target="_blank" rel="noreferrer" className="pdr-link pdr-link--arrow" style={{ wordBreak: 'break-all' }}>
          <IconExternal /> {t('Buka link daftar', 'Open register link')}
        </a>
      )}

      {total > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pdr-progress"><div className="pdr-progress__fill" style={{ width: `${pct}%` }} /></div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{done}/{total}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {airdrop.tasks.map((task, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input className="pdr-check" type="checkbox" checked={task.done} onChange={() => toggle(i)} />
                <span style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : 'var(--text-primary)', transition: 'color .2s ease' }}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
