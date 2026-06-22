import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, BookmarkPlus, Check, Maximize2, Minimize2 } from 'lucide-react'
import { useTimer, getPhase, getPhaseColor } from '../hooks/useTimer'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { SpeechType, SPEECH_PRESETS, TimerConfig, TimerRecord } from '../types'
import { formatTime, secondsToInput, parseTimeInput } from '../utils/formatTime'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const SPEECH_TYPE_STYLES: Record<SpeechType, { active: string; idle: string }> = {
  preparado:      { active: 'bg-violet-600 text-white border-violet-600 shadow-sm', idle: 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50' },
  'table-topics': { active: 'bg-pink-600 text-white border-pink-600 shadow-sm',    idle: 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50' },
  evaluacion:     { active: 'bg-sky-600 text-white border-sky-600 shadow-sm',      idle: 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50' },
  personalizado:  { active: 'bg-slate-600 text-white border-slate-600 shadow-sm',  idle: 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50' },
}

const SPEECH_TYPE_FS_BADGE: Record<SpeechType, string> = {
  preparado:      'bg-violet-900/50 text-violet-300',
  'table-topics': 'bg-pink-900/50 text-pink-300',
  evaluacion:     'bg-sky-900/50 text-sky-300',
  personalizado:  'bg-slate-800 text-slate-300',
}

const PHASE_VARIANTS = {
  neutral:  'primary',
  verde:    'success',
  amarillo: 'warning',
  rojo:     'danger',
  excedido: 'danger',
} as const

export default function Temporizador() {
  const { t } = useLanguage()
  const { elapsed, isRunning, start, pause, reset } = useTimer()
  const [speechType, setSpeechType] = useState<SpeechType>('preparado')
  const [config, setConfig] = useLocalStorage<Record<SpeechType, TimerConfig>>(STORAGE_KEYS.TIMER_CONFIG, {
    preparado: SPEECH_PRESETS.preparado,
    'table-topics': SPEECH_PRESETS['table-topics'],
    evaluacion: SPEECH_PRESETS.evaluacion,
    personalizado: SPEECH_PRESETS.personalizado,
  })
  const [, setRecords] = useLocalStorage<TimerRecord[]>(STORAGE_KEYS.TIMER_RECORDS, [])
  const [showConfig, setShowConfig] = useState(false)
  const [speakerName, setSpeakerName] = useState('')
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        isRunning ? pause() : start()
      } else if (e.code === 'KeyR') {
        reset()
      } else if (e.code === 'KeyF') {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause, reset, toggleFullscreen])

  const speechLabels: Record<SpeechType, string> = {
    preparado: t('speechPrepared'),
    'table-topics': t('speechTableTopics'),
    evaluacion: t('speechEvaluation'),
    personalizado: t('speechCustom'),
  }

  const phaseLabels: Record<string, string> = {
    neutral:  t('timerPhaseNeutral'),
    verde:    t('timerPhaseGreen'),
    amarillo: t('timerPhaseYellow'),
    rojo:     t('timerPhaseRed'),
  }

  const currentConfig = config[speechType]
  const phase = getPhase(elapsed, currentConfig)
  const color = getPhaseColor(phase)
  const progress = Math.min(elapsed / currentConfig.redTime, 1)
  const overtime = elapsed > currentConfig.redTime ? elapsed - currentConfig.redTime : 0
  const greenFrac = currentConfig.greenTime / currentConfig.redTime
  const yellowFrac = currentConfig.yellowTime / currentConfig.redTime
  const timerColor = phase === 'neutral' ? (isFullscreen ? '#475569' : '#94a3b8') : color

  const updateConfig = (field: keyof TimerConfig, rawValue: string) => {
    const val = parseTimeInput(rawValue)
    setConfig((prev) => ({
      ...prev,
      [speechType]: { ...prev[speechType], [field]: val },
    }))
  }

  const handleSpeechType = (type: SpeechType) => {
    setSpeechType(type)
    reset()
  }

  const saveToRecord = () => {
    if (elapsed === 0) return
    const record: TimerRecord = {
      id: newId(),
      nombre: speakerName.trim() || 'Sin nombre',
      tipo: speechLabels[speechType],
      tiempoFinal: elapsed,
      notas: '',
      fecha: new Date().toLocaleDateString('es-ES'),
    }
    setRecords((prev) => [...prev, record])
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  const startVariant = PHASE_VARIANTS[phase]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('timerTitle')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('timerSubtitle')}</p>
      </div>

      {/* Speech type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {(Object.keys(SPEECH_PRESETS) as SpeechType[]).map((type) => {
          const isActive = speechType === type
          const styles = SPEECH_TYPE_STYLES[type]
          return (
            <button
              key={type}
              onClick={() => handleSpeechType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border active:scale-[0.97] ${
                isActive ? styles.active : styles.idle
              }`}
            >
              {speechLabels[type]}
            </button>
          )
        })}
      </div>

      {/* Speaker name */}
      <div className="mb-4">
        <Input
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder={t('timerSpeakerPlaceholder')}
        />
      </div>

      {/* Timer card — this element goes fullscreen */}
      <div
        ref={containerRef}
        className={`flex flex-col items-center transition-colors duration-500 ${
          isFullscreen
            ? 'bg-slate-950 justify-center gap-6 p-10'
            : 'rounded-2xl border bg-white p-6 md:p-10 gap-5'
        }`}
        style={!isFullscreen ? {
          borderColor: phase !== 'neutral' ? `${color}50` : '#e2e8f0',
          boxShadow: phase !== 'neutral' ? `0 0 0 1px ${color}18, 0 4px 24px ${color}0d` : undefined,
        } : undefined}
      >
        {/* Fullscreen header row */}
        {isFullscreen && (
          <div className="self-stretch flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${SPEECH_TYPE_FS_BADGE[speechType]}`}>
                {speechLabels[speechType]}
              </span>
              {speakerName && <span className="text-slate-400 text-sm">{speakerName}</span>}
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Minimize2 size={18} />
            </button>
          </div>
        )}

        {/* Timer number */}
        <div
          className="font-timer font-bold tracking-tight leading-none select-none transition-colors duration-500"
          style={{
            fontSize: isFullscreen ? 'clamp(7rem, 20vw, 14rem)' : 'clamp(4rem, 18vw, 6rem)',
            color: timerColor,
          }}
        >
          {formatTime(elapsed)}
        </div>

        {/* Overtime */}
        {overtime > 0 && (
          <div
            className="font-timer font-semibold text-red-500 -mt-3"
            style={{ fontSize: isFullscreen ? '2rem' : '1.125rem' }}
          >
            +{formatTime(overtime)}
          </div>
        )}

        {/* Progress bar */}
        <div
          className={`relative w-full rounded-full overflow-visible ${isFullscreen ? 'max-w-3xl h-2' : 'h-1.5'}`}
          style={{ backgroundColor: isFullscreen ? '#1e293b' : '#e2e8f0' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, backgroundColor: phase === 'neutral' ? '#cbd5e1' : color }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3.5 bg-white/40"
            style={{ left: `${greenFrac * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3.5 bg-white/40"
            style={{ left: `${yellowFrac * 100}%` }}
          />
        </div>

        {/* Phase badge */}
        <div
          key={phase}
          className="phase-pop text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
          style={{
            backgroundColor: phase === 'neutral'
              ? (isFullscreen ? '#0f172a' : '#f1f5f9')
              : `${color}20`,
            color: phase === 'neutral' ? (isFullscreen ? '#475569' : '#94a3b8') : color,
          }}
        >
          {phaseLabels[phase]}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              variant={startVariant}
              size="xl"
              icon={<Play size={isFullscreen ? 28 : 24} fill="currentColor" />}
              onClick={start}
            >
              {t('timerStart')}
            </Button>
          ) : (
            <Button
              variant="warning"
              size="xl"
              icon={<Pause size={isFullscreen ? 28 : 24} fill="currentColor" />}
              onClick={pause}
            >
              {t('timerPause')}
            </Button>
          )}
          <Button variant="secondary" size="xl" icon={<RotateCcw size={isFullscreen ? 26 : 22} />} onClick={reset}>
            {t('timerReset')}
          </Button>
        </div>

        {/* Save + fullscreen toggle */}
        <div className="flex items-center gap-3">
          {elapsed > 0 && (
            <Button
              variant={savedFeedback ? 'success' : 'ghost'}
              size="sm"
              icon={savedFeedback ? <Check size={15} /> : <BookmarkPlus size={15} />}
              onClick={saveToRecord}
              className={isFullscreen ? '!text-slate-300 hover:!text-white' : ''}
            >
              {savedFeedback ? t('timerSaved') : t('timerSave')}
            </Button>
          )}
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              title="Pantalla completa (F)"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Maximize2 size={13} />
              <span className="font-mono">F</span>
            </button>
          )}
        </div>

        {/* Threshold legend */}
        {!isFullscreen && (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {([
              { labelKey: 'timerGreen' as const,  time: currentConfig.greenTime,  color: '#22c55e' },
              { labelKey: 'timerYellow' as const, time: currentConfig.yellowTime, color: '#f59e0b' },
              { labelKey: 'timerRed' as const,    time: currentConfig.redTime,    color: '#ef4444' },
            ]).map(({ labelKey, time, color: c }) => (
              <div key={labelKey} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-xs text-slate-400 font-medium">{t(labelKey)}: {formatTime(time)}</span>
              </div>
            ))}
          </div>
        )}

        {!isFullscreen && (
          <p className="text-xs text-slate-400 font-mono">{t('timerShortcutHint')}</p>
        )}
      </div>

      {/* Config section */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>{t('timerConfigTitle')} — {speechLabels[speechType]}</span>
          {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showConfig && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Input
                label={t('timerConfigGreenLabel')}
                defaultValue={secondsToInput(currentConfig.greenTime)}
                onBlur={(e) => updateConfig('greenTime', e.target.value)}
                placeholder="05:00"
              />
              <Input
                label={t('timerConfigYellowLabel')}
                defaultValue={secondsToInput(currentConfig.yellowTime)}
                onBlur={(e) => updateConfig('yellowTime', e.target.value)}
                placeholder="06:00"
              />
              <Input
                label={t('timerConfigRedLabel')}
                defaultValue={secondsToInput(currentConfig.redTime)}
                onBlur={(e) => updateConfig('redTime', e.target.value)}
                placeholder="07:00"
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">{t('timerConfigNote')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
