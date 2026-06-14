// src/App.tsx
// Shell utama Pendar — asisten AI untuk pekerjaan freelance.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { MessageBubble } from './components/MessageBubble'
import { SettingsModal } from './components/SettingsModal'
import { TipModal } from './components/TipModal'
import { BASE_SYSTEM_PROMPT, TEMPLATES } from './ai/templates'
import { useSettings } from './hooks/useSettings'
import { useChat } from './hooks/useChat'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { settings, provider, apiKey, model, ready, setProvider, setApiKey, setModel } =
    useSettings()
  const { theme, cycleTheme } = useTheme()

  const [templateId, setTemplateId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [drawer, setDrawer] = useState(false)

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId) ?? null, [templateId])
  const system = useMemo(
    () => (template ? `${BASE_SYSTEM_PROMPT}\n\n${template.system}` : BASE_SYSTEM_PROMPT),
    [template],
  )

  const { turns, streaming, error, send, stop, reset } = useChat({ provider, apiKey, model, system })

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns])

  const pickTemplate = (id: string) => {
    if (id !== templateId) reset()
    setTemplateId(id)
    const t = TEMPLATES.find((x) => x.id === id)
    if (t) setInput(t.starter)
    setDrawer(false)
  }

  const newChat = () => {
    reset()
    setTemplateId(null)
    setInput('')
    setDrawer(false)
  }

  const submit = () => {
    if (!ready) {
      setShowSettings(true)
      return
    }
    const text = input
    setInput('')
    send(text)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="layout">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className={`layout__side${drawer ? ' layout__side--open' : ''}`}>
        <Sidebar
          activeTemplate={templateId}
          onPickTemplate={pickTemplate}
          onNewChat={newChat}
          onOpenSettings={() => setShowSettings(true)}
          onOpenTip={() => setShowTip(true)}
          theme={theme}
          onToggleTheme={cycleTheme}
        />
      </div>

      <main className="chat">
        <header className="chat__head">
          <button className="pdr-nav-btn chat__menu" onClick={() => setDrawer(true)}>
            ☰
          </button>
          <div className="chat__head-title">{template ? template.title : 'Asisten'}</div>
          <span className={`chip${ready ? ' chip--ok' : ' chip--warn'}`}>
            {provider === 'groq' ? 'Groq' : 'Gemini'} · {ready ? model : 'tanpa key'}
          </span>
        </header>

        {!ready && (
          <div className="notice">
            Belum ada API key.{' '}
            <button className="pdr-link" onClick={() => setShowSettings(true)}>
              Buka Pengaturan
            </button>{' '}
            untuk menghubungkan Groq atau Gemini.
          </div>
        )}

        <div className="chat__messages" ref={scrollRef}>
          {turns.length === 0 ? (
            <Welcome onPick={pickTemplate} />
          ) : (
            turns.map((t, i) => (
              <MessageBubble key={t.id} turn={t} streaming={streaming && i === turns.length - 1} />
            ))
          )}
          {error && <div className="chat__error">{error}</div>}
        </div>

        <div className="composer">
          <textarea
            className="composer__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder={
              template
                ? `Lengkapi detail untuk "${template.title}"…`
                : 'Tulis tugas atau pertanyaanmu…'
            }
          />
          <div className="composer__actions">
            <span className="composer__hint">Enter kirim · Shift+Enter baris baru</span>
            {streaming ? (
              <button className="pdr-btn pdr-btn--ghost" onClick={stop}>
                Stop
              </button>
            ) : (
              <button className="pdr-btn pdr-btn--primary" onClick={submit} disabled={!input.trim()}>
                Kirim
              </button>
            )}
          </div>
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          provider={provider}
          apiKeys={settings.apiKeys}
          models={settings.models}
          onProvider={setProvider}
          onApiKey={setApiKey}
          onModel={setModel}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTip && <TipModal onClose={() => setShowTip(false)} />}
    </div>
  )
}

function Welcome({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="welcome">
      <h1 className="welcome__title">Apa yang sedang kamu kerjakan?</h1>
      <p className="welcome__sub">
        Pilih template untuk mulai cepat, atau langsung tulis di kolom bawah.
      </p>
      <div className="welcome__grid">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className="pdr-card pdr-card--hover welcome__card"
            onClick={() => onPick(t.id)}
          >
            <span className="welcome__card-title">{t.title}</span>
            <span className="welcome__card-desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
