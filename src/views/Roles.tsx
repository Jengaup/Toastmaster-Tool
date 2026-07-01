import { useState } from 'react'
import { Copy, Check, RotateCcw, Users } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { MeetingRoles } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { PageHeader } from '../components/ui/PageHeader'

const DEFAULT_ROLES: MeetingRoles = {
  presidente: '',
  toastmaster: '',
  evaluadorGeneral: '',
  monitorMuletillas: '',
  monitorGramatica: '',
  monitorPalabra: '',
  cronometrador: '',
  monitorChat: '',
  sargentoArmas: '',
}

export default function Roles() {
  const { t } = useLanguage()
  const [roles, setRoles] = useLocalStorage<MeetingRoles>(STORAGE_KEYS.MEETING_ROLES, DEFAULT_ROLES)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const ROLE_FIELDS: { key: keyof MeetingRoles; labelKey: Parameters<typeof t>[0] }[] = [
    { key: 'presidente',        labelKey: 'rolePresidente'        },
    { key: 'toastmaster',       labelKey: 'roleToastmaster'       },
    { key: 'evaluadorGeneral',  labelKey: 'roleEvaluadorGeneral'  },
    { key: 'monitorMuletillas', labelKey: 'roleMonitorMuletillas' },
    { key: 'monitorGramatica',  labelKey: 'roleMonitorGramatica'  },
    { key: 'monitorPalabra',    labelKey: 'roleMonitorPalabra'    },
    { key: 'cronometrador',     labelKey: 'roleCronometrador'     },
    { key: 'monitorChat',       labelKey: 'roleMonitorChat'       },
    { key: 'sargentoArmas',     labelKey: 'roleSargento'          },
  ]

  const update = (key: keyof MeetingRoles, value: string) => {
    setRoles(prev => ({ ...prev, [key]: value }))
  }

  const handleCopy = () => {
    const lines = ROLE_FIELDS
      .map(({ key, labelKey }) => `${t(labelKey)}: ${roles[key] || '—'}`)
      .join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return }
    setRoles(DEFAULT_ROLES)
    setConfirmReset(false)
  }

  const filledCount = ROLE_FIELDS.filter(({ key }) => roles[key].trim()).length

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <PageHeader
        title={t('rolesTitle')}
        subtitle={t('rolesSubtitle')}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                copied
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? t('rolesCopied') : t('rolesCopy')}
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                confirmReset
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
              }`}
            >
              <RotateCcw size={13} />
              {t('rolesReset')}
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-rose-500" />
            <span className="text-sm font-medium text-slate-700">{t('rolesTitle')}</span>
          </div>
          {filledCount > 0 && (
            <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
              {filledCount}/{ROLE_FIELDS.length}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {ROLE_FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="flex items-center gap-4 px-5 py-3">
              <span className="text-sm font-medium text-slate-600 w-44 shrink-0">{t(labelKey)}</span>
              <input
                type="text"
                value={roles[key]}
                onChange={e => update(key, e.target.value)}
                placeholder={t('roleMemberPlaceholder')}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
