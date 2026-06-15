// src/App.tsx
// Shell utama Pendar — asisten AI untuk pekerjaan freelance.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { MessageBubble } from './components/MessageBubble'
import { SettingsModal } from './components/SettingsModal'
import { LearnModal } from './components/LearnModal'
import { Composer } from './components/Composer'
import { Welcome } from './components/Welcome'
import { BASE_SYSTEM_PROMPT, TEMPLATES } from './ai/templates'
import { buildLessonStarter, buildLessonSystem, findLesson } from './learn/curriculum'
import { I18nContext } from './i18n/i18n'
import { createT } from './i18n/translations'
import { useSettings } from './hooks/useSettings'
import { useConversations } from './hooks/useConversations'
import { useChat } from './hooks/useChat'
import { useLearning } from './hooks/useLearning'
import { useQuizScores } from './hooks/useQuizScores'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { settings, provider, apiKey, model, language, ready, setProvider, setApiKey, setModel, setLanguage } =
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
  const { scores: quizScores, recordScore } = useQuizScores()
  const t = useMemo(() => createT(language), [language])

  // Selaraskan judul dokumen & atribut lang HTML dengan bahasa antarmuka.
  useEffect(() => {
    document.title = t('app.title')
    document.documentElement.lang = language
  }, [t, language])

  const [input, setInput] = useState('')
  const composerInputRef = useRef<HTMLTextAreaElement>(null)
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
  // Jawaban AI adaptif: mengikuti bahasa yang diketik user (aturan di
  // BASE_SYSTEM_PROMPT / persona mentor), bukan dipaksa oleh toggle bahasa UI.
  const system = useMemo(() => {
    if (lesson) return buildLessonSystem(lesson, language)
    if (template) return `${BASE_SYSTEM_PROMPT}\n\n${template.system}`
    return BASE_SYSTEM_PROMPT
  }, [lesson, template, language])

  const { streaming, error, send, stop, regenerate } = useChat({
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
    // Isi kolom input dengan teks awal (starter) template agar user tinggal
    // melengkapi — tanpa ini, memilih template terasa "tidak terjadi apa-apa".
    const tpl = TEMPLATES.find((x) => x.id === id)
    setActiveTemplate(id)
    setInput(tpl?.starter ?? '')
    setDrawer(false)
    // Fokuskan composer agar perpindahan dari kartu/menu ke input terasa jelas.
    requestAnimationFrame(() => composerInputRef.current?.focus())
  }

  const startLesson = (id: string) => {
    const l = findLesson(id)
    if (!l) return
    newConversation(null, id)
    setInput('')
    setShowLearn(false)
    setDrawer(false)
    setPendingKickoff(buildLessonStarter(l, language))
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
      ? t('app.learnPrefix', { title: lesson.title[language] })
      : template?.title ?? ''

  return (
    <I18nContext.Provider value={{ lang: language, t }}>
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
          provider={provider}
          model={model}
          ready={ready}
          theme={theme}
          onToggleTheme={cycleTheme}
          language={language}
          onLanguage={setLanguage}
        />
      </div>

      <main className="chat">
        <header className="chat__head">
          <button
            className="pdr-nav-btn chat__menu"
            onClick={() => setDrawer(true)}
            aria-label={t('app.openMenu')}
          >
            <MenuIcon />
          </button>
          <div className="chat__head-title">{title}</div>
        </header>

        {!ready && (
          <div className="notice">
            {t('app.noticeBefore')}
            <button className="pdr-link" onClick={() => setShowSettings(true)}>
              {t('app.noticeLink')}
            </button>
            {t('app.noticeAfter')}
          </div>
        )}

        <div className="chat__messages" ref={scrollRef} onScroll={onScroll}>
          {active.turns.length === 0 ? (
            <Welcome templates={TEMPLATES} onPick={pickTemplate} />
          ) : (
            active.turns.map((turn, i) => {
              const isLast = i === active.turns.length - 1
              // Regenerasi hanya untuk jawaban AI terakhir saat idle & siap.
              const canRegen = isLast && turn.role === 'assistant' && ready && !streaming
              return (
                <MessageBubble
                  key={turn.id}
                  turn={turn}
                  streaming={streaming && isLast}
                  onRegenerate={canRegen ? regenerate : undefined}
                />
              )
            })
          )}
          {error && (
            <div className="chat__error">
              {error.startsWith('ERR_AUTH:')
                ? <>{t('error.authKey', { name: error.slice(9) })}{' '}<button className="pdr-link" onClick={() => setShowSettings(true)}>{t('app.noticeLink')}</button></>
                : error}
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSubmit={submit}
          onStop={stop}
          streaming={streaming}
          templates={TEMPLATES}
          onPickTemplate={pickTemplate}
          textareaRef={composerInputRef}
          placeholder={
            lesson
              ? t('composer.lesson')
              : template
                ? t('composer.template', { title: template.title })
                : t('composer.default')
          }
        />
      </main>

      {showLearn && (
        <LearnModal
          completed={completedSet}
          onToggleDone={toggleDone}
          onStartLesson={startLesson}
          quizScores={quizScores}
          onQuizDone={recordScore}
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
    </I18nContext.Provider>
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
