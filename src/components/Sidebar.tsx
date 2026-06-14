// src/components/Sidebar.tsx
// Panel kiri: brand + toggle tema, tombol chat baru, daftar template tugas
// freelance, dan aksi bawah (beri tip + pengaturan).
import { Logo } from './Logo'
import { TEMPLATES } from '../ai/templates'
import type { Theme } from '../hooks/useTheme'

interface Props {
  activeTemplate: string | null
  onPickTemplate: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  onOpenTip: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({
  activeTemplate,
  onPickTemplate,
  onNewChat,
  onOpenSettings,
  onOpenTip,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Logo size={26} />
        <div className="sidebar__brand-text">
          <div className="sidebar__name">Pendar</div>
          <div className="sidebar__tag">Asisten AI Freelance</div>
        </div>
        <button
          className="sidebar__theme"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <button className="pdr-btn pdr-btn--primary sidebar__new" onClick={onNewChat}>
        + Chat baru
      </button>

      <div className="sidebar__section">Template tugas</div>
      <nav className="sidebar__templates">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`tmpl${activeTemplate === t.id ? ' tmpl--active' : ''}`}
            onClick={() => onPickTemplate(t.id)}
          >
            <span className="tmpl__title">{t.title}</span>
            <span className="tmpl__desc">{t.desc}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="pdr-nav-btn sidebar__tip" onClick={onOpenTip}>
          <HeartIcon /> Beri tip
        </button>
        <button className="pdr-nav-btn" onClick={onOpenSettings}>
          Pengaturan
        </button>
      </div>
    </aside>
  )
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.6-10-9.1C.4 8.8 1.8 5.5 5 5.1c2-.3 3.6.9 4.4 2.2L12 9.2l2.6-1.9c.8-1.3 2.4-2.5 4.4-2.2 3.2.4 4.6 3.7 3 6.8C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}
