// src/components/Sidebar.tsx
// Panel kiri: logo, tombol chat baru, daftar template tugas freelance,
// dan aksi bawah (tema + pengaturan).
import { Logo } from './Logo'
import { TEMPLATES } from '../ai/templates'
import type { Theme } from '../hooks/useTheme'

interface Props {
  activeTemplate: string | null
  onPickTemplate: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({
  activeTemplate,
  onPickTemplate,
  onNewChat,
  onOpenSettings,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Logo size={26} />
        <div>
          <div className="sidebar__name">Pendar</div>
          <div className="sidebar__tag">Asisten AI Freelance</div>
        </div>
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
        <button className="pdr-nav-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
        </button>
        <button className="pdr-nav-btn" onClick={onOpenSettings}>
          Pengaturan
        </button>
      </div>
    </aside>
  )
}
