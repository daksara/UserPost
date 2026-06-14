// src/App.tsx
// Shell utama Pendar — asisten AI untuk pekerjaan freelance.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { MessageBubble } from './components/MessageBubble'
import { SettingsModal } from './components/SettingsModal'
import { LearnModal } from './components/LearnModal'
import { Composer } from './components/Composer'
import { Logo } from './components/Logo'
import { BASE_SYSTEM_PROMPT, TEMPLATES } from './ai/templates'
import { buildLessonStarter, buildLessonSystem, findLesson } from './learn/curriculum'
import { useSettings } from './hooks/useSettings'
import { useConversations } from './hooks/useConversations'
import { useChat } from './hooks/useChat'
import { useLearning } from './hooks/useLearning'
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
  const { completedSet, toggleDone, markDone } = useLearning()

  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showLearn, setShowLearn] = useState(false)
  const [drawer, setDrawer] = useState(false)
  // Pesan pembuka sesi belajar yang menunggu dikirim begitu percakapan materi
  // aktif & siap (lihat efek auto-kickoff di bawah).
  const [pendingKickoff, setPendingKickoff] = useState<string | null>(null)

  const lesson = useMemo(() => findLesson(active.lessonId ?? '') ?? null, [active.lessonId])
  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === active.templateId) ?? null,
    [active.templateId],
  )
  const system = useMemo(() => {
    if (lesson) return buildLessonSystem(lesson)
    if (template) return `${BASE_SYSTEM_PROMPT}\n\n${template.system}`
    return BASE_SYSTEM_PROMPT
  }, [lesson, template])

  const { streaming, error, send, stop } = useChat({
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

  // Auto-kickoff sesi belajar: begitu percakapan materi aktif, masih kosong, dan
  // key sudah siap, kirim pesan pembuka agar mentor langsung mulai mengajar.
  useEffect(() => {
    if (!pendingKickoff || !ready || streaming) return
    if (!active.lessonId || active.turns.length > 0) return
    const text = pendingKickoff
    setPendingKickoff(null)
    send(text)
  }, [pendingKickoff, ready, streaming, active.lessonId, active.turns.length, send])

  const pickTemplate = (id: string) => {
    setActiveTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)
    if (t) setInput(t.starter)
    setDrawer(false)
  }

  const startLesson = (id: string) => {
    const l = findLesson(id)
    if (!l) return
    newConversation(null, id)
    setInput('')
    setShowLearn(false)
    setDrawer(false)
    setPendingKickoff(buildLessonStarter(l))
    // Materi yang dimulai dianggap sudah dipelajari untuk pelacakan progres.
    markDone(id)
    if (!ready) setShowSettings(true)
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

  const title = active.turns.length
    ? active.title
    : lesson
      ? `Belajar: ${lesson.title}`
      : template?.title ?? 'Asisten'

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
          onOpenLearn={() => setShowLearn(true)}
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
            <Welcome onStartLearning={() => setShowLearn(true)} />
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
          streaming={streaming}
          templates={TEMPLATES}
          onPickTemplate={pickTemplate}
          placeholder={
            lesson
              ? 'Jawab latihan mentor atau tanya apa pun tentang materi…'
              : template
                ? `Lengkapi detail untuk "${template.title}"…`
                : 'Tulis tugas atau pertanyaanmu…'
          }
        />
      </main>

      {showLearn && (
        <LearnModal
          completed={completedSet}
          onToggleDone={toggleDone}
          onStartLesson={startLesson}
          onClose={() => setShowLearn(false)}
        />
      )}

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

function Welcome({ onStartLearning }: { onStartLearning: () => void }) {
  return (
    <div className="welcome">
      <Logo size={44} />
      <h1 className="welcome__title">Hello, I'm Pendar</h1>
      <p className="welcome__sub">
        Your AI Co-Pilot for Virtual Assistants. I help you understand, organize,
        and complete real client work accurately, professionally, and efficiently.
        What kind of task or project do you need help with today?
      </p>
      <div className="welcome__learn">
        <div className="welcome__learn-text">
          <strong>Baru jadi VA?</strong> Belajar dari nol sampai expert bersama
          mentor VA berpengalaman — kurikulum lengkap, tanpa ada yang tertinggal.
        </div>
        <button className="pdr-btn pdr-btn--primary" onClick={onStartLearning}>
          Mulai belajar jadi VA
        </button>
      </div>
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
