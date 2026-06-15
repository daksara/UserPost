// src/components/Sidebar.tsx
// Panel kiri: logo, tombol chat baru, riwayat percakapan, dan aksi bawah
// (tema + pengaturan). Template tugas tampil di layar sambutan (Welcome).
import { useState } from 'react'
import { Logo } from './Logo'
import type { Conversation } from '../chat/types'
import type { Theme } from '../hooks/useTheme'
import type { Language } from '../ai/templates'
import type { Provider } from '../ai/types'
import { useI18n } from '../i18n/i18n'
import { ProviderIcon } from './ProviderIcon'

interface Props {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  onOpenLearn: () => void
  onOpenSettings: () => void
  provider: Provider
  model: string
  ready: boolean
  theme: Theme
  onToggleTheme: () => void
  language: Language
  onLanguage: (lang: Language) => void
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onOpenLearn,
  onOpenSettings,
  provider,
  model,
  ready,
  theme,
  onToggleTheme,
  language,
  onLanguage,
}: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  // Hanya tampilkan percakapan yang sudah berisi pesan agar daftar bersih.
  const history = conversations.filter((c) => c.turns.length > 0)
  const q = query.trim().toLowerCase()
  const shown = q ? history.filter((c) => c.title.toLowerCase().includes(q)) : history

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Logo size={26} />
        <div>
          <div className="sidebar__name">Pendar</div>
          <div className="sidebar__tag">{t('sidebar.tag')}</div>
        </div>
        <button
          className="sidebar__theme"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('sidebar.toLight') : t('sidebar.toDark')}
          title={theme === 'dark' ? t('sidebar.lightTheme') : t('sidebar.darkTheme')}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <button className="pdr-btn pdr-btn--primary sidebar__new" onClick={onNewChat}>
        {t('sidebar.newChat')}
      </button>

      <button className="pdr-btn pdr-btn--ghost sidebar__learn" onClick={onOpenLearn}>
        <GradCapIcon /> {t('sidebar.learnVA')}
      </button>

      <div className="sidebar__section">{t('sidebar.history')}</div>
      {history.length > 0 && (
        <input
          className="sidebar__search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('sidebar.search')}
          aria-label={t('sidebar.search')}
        />
      )}
      <nav className="sidebar__history">
        {history.length === 0 ? (
          <p className="sidebar__empty">{t('sidebar.historyEmpty')}</p>
        ) : shown.length === 0 ? (
          <p className="sidebar__empty">{t('sidebar.searchEmpty')}</p>
        ) : (
          shown.map((c) => (
            <div
              key={c.id}
              className={`conv${c.id === activeId ? ' conv--active' : ''}`}
            >
              <button className="conv__open" onClick={() => onSelect(c.id)} title={c.title}>
                {c.title}
              </button>
              <button
                className="conv__del"
                onClick={() => onDelete(c.id)}
                aria-label={t('sidebar.deleteConv', { title: c.title })}
                title={t('sidebar.delete')}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </nav>

      <div className="sidebar__footer">
        <span
          className={`chip sidebar__model${ready ? ' chip--ok' : ' chip--warn'}`}
          title={`${provider === 'groq' ? 'Groq' : 'Gemini'} · ${ready ? model : t('app.noKey')}`}
        >
          <ProviderIcon provider={provider} size={12} />
          {provider === 'groq' ? 'Groq' : 'Gemini'} · {ready ? model : t('app.noKey')}
        </span>
        <div className="sidebar__lang">
          <span className="sidebar__lang-label">{t('sidebar.language')}</span>
          <div className="seg seg--sm" role="group" aria-label={t('sidebar.language')}>
            <button
              className={`seg__item${language === 'id' ? ' seg__item--active' : ''}`}
              onClick={() => onLanguage('id')}
              aria-pressed={language === 'id'}
            >
              Indonesia
            </button>
            <button
              className={`seg__item${language === 'en' ? ' seg__item--active' : ''}`}
              onClick={() => onLanguage('en')}
              aria-pressed={language === 'en'}
            >
              English
            </button>
          </div>
        </div>
        <button className="pdr-nav-btn" onClick={onOpenSettings}>
          {t('sidebar.settings')}
        </button>
      </div>
    </aside>
  )
}

function GradCapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4 2 9l10 5 10-5-10-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 11.5V16c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
