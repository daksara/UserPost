// src/App.tsx
// Shell utama Pendar — asisten AI untuk pekerjaan freelance.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { MessageBubble } from './components/MessageBubble'
import { SettingsModal } from './components/SettingsModal'
import { Composer } from './components/Composer'
import { Logo } from './components/Logo'
import { BASE_SYSTEM_PROMPT, TEMPLATES } from './ai/templates'
import { useSettings } from './hooks/useSettings'
import { useConversations } from './hooks/useConversations'
import { useChat } from './hooks/useChat'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { settings, provider, apiKey, model, ready, setProvider, setApiKey, setModel } =
    useSettings()
  const { theme, cycleTheme } = useTheme()
  const {
    conversations,
    active,
    setActiveTurns,
    setActiveTemplate,
    select,
    newConversation,
    remove,
  } = useConversations()

  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [drawer, setDrawer] = useState(false)

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === active.templateId) ?? null,
    [active.templateId],
  )
  const system = useMemo(
    () => (template ? `${BASE_SYSTEM_PROMPT}\n\n${template.system}` : BASE_SYSTEM_PROMPT),
    [template],
  )

  const { streaming, error, send, regenerate, stop, canRegenerate } = useChat({
    provider,
    apiKey,
    model,
    system,
    turns: active.turns,
    setTurns: setActiveTurns,
  })

  // Auto-scroll cerdas: hanya ikut ke bawah bila user sudah dekat dasar,
  // sehingga membaca riwayat lama tidak terenggut saat token mengalir.
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }
  useEffect(() => {
    if (pinnedRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [active.turns])
  // Saat berpindah percakapan, mulai dari bawah.
  useEffect(() => {
    pinnedRef.current = true
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [active.id])

  const pickTemplate = (id: string) => {
    setActiveTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)
    if (t) setInput(t.starter)
    setDrawer(false)
  }

  const startNewChat = () => {
    newConversation()
    setInput('')
    setDrawer(false)
  }

  const openConversation = (id: string) => {
    select(id)
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

  const title = active.turns.length ? active.title : template?.title ?? 'Asisten'

  return (
    <div className="layout">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className={`layout__side${drawer ? ' layout__side--open' : ''}`}>
        <Sidebar
          conversations={conversations}
          activeId={active.id}
          onSelect={openConversation}
          onDelete={remove}
          onNewChat={startNewChat}
          onOpenSettings={() => setShowSettings(true)}
          theme={theme}
          onToggleTheme={cycleTheme}
        />
      </div>

      <main className="chat">
        <header className="chat__head">
          <button
            className="pdr-nav-btn chat__menu"
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
          >
            <MenuIcon />
          </button>
          <div className="chat__head-title">{title}</div>
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

        <div className="chat__messages" ref={scrollRef} onScroll={onScroll}>
          {active.turns.length === 0 ? (
            <Welcome />
          ) : (
            active.turns.map((t, i) => (
              <MessageBubble
                key={t.id}
                turn={t}
                streaming={streaming && i === active.turns.length - 1}
              />
            ))
          )}
          {error && <div className="chat__error">{error}</div>}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSubmit={submit}
          onStop={stop}
          onRegenerate={regenerate}
          streaming={streaming}
          canRegenerate={canRegenerate}
          templates={TEMPLATES}
          onPickTemplate={pickTemplate}
          placeholder={
            template ? `Lengkapi detail untuk "${template.title}"…` : 'Tulis tugas atau pertanyaanmu…'
          }
        />
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
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function Welcome() {
  return (
    <div className="welcome">
      <Logo size={44} />
      <h1 className="welcome__title">{greeting()}</h1>
      <p className="welcome__sub">Asisten VA-mu siap. Tulis tugas, atau pilih dari saran di bawah.</p>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
