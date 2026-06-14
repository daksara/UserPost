// src/components/Welcome.tsx
// Layar sambutan ala Claude: sapaan serif sesuai waktu + kartu "mulai cepat"
// dari template tugas. Klik kartu memilih template seperti tombol "+".
import type { Template } from '../ai/templates'
import { useI18n } from '../i18n/i18n'
import type { MsgKey } from '../i18n/translations'
import { Logo } from './Logo'

function greetingKey(hour: number): MsgKey {
  if (hour < 11) return 'welcome.greetMorning'
  if (hour < 15) return 'welcome.greetAfternoon'
  if (hour < 18) return 'welcome.greetEvening'
  return 'welcome.greetNight'
}

export function Welcome({
  templates,
  onPick,
}: {
  templates: Template[]
  onPick: (id: string) => void
}) {
  const { t } = useI18n()
  const greeting = t(greetingKey(new Date().getHours()))
  // Tampilkan beberapa template teratas sebagai saran cepat.
  const suggestions = templates.slice(0, 6)

  return (
    <div className="welcome">
      <Logo size={40} />
      <h1 className="welcome__title">{greeting}, {t('welcome.name')}</h1>
      <p className="welcome__sub">{t('welcome.subtitle')}</p>

      <div className="welcome__suggestions">
        {suggestions.map((tpl) => (
          <button
            key={tpl.id}
            className="welcome__card"
            onClick={() => onPick(tpl.id)}
          >
            <span className="welcome__card-title">{tpl.title}</span>
            <span className="welcome__card-desc">{tpl.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
