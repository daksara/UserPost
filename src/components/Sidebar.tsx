// src/components/Sidebar.tsx
// Panel kiri: logo, tombol chat baru, riwayat percakapan, dan aksi bawah
// (tema + pengaturan). Template tugas tampil di layar sambutan (Welcome).
import { Logo } from './Logo'
import type { Conversation } from '../chat/types'
import type { Theme } from '../hooks/useTheme'

interface Props {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onOpenSettings,
  theme,
  onToggleTheme,
}: Props) {
  // Hanya tampilkan percakapan yang sudah berisi pesan agar daftar bersih.
  const history = conversations.filter((c) => c.turns.length > 0)

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

      <div className="sidebar__section">Riwayat</div>
      <nav className="sidebar__history">
        {history.length === 0 ? (
          <p className="sidebar__empty">Belum ada percakapan. Mulai dengan menulis pesan.</p>
        ) : (
          history.map((c) => (
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
                aria-label={`Hapus percakapan "${c.title}"`}
                title="Hapus"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
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
