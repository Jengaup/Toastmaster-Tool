import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, BookmarkPlus, Check } from 'lucide-react'
import { useTimer, getPhase, getPhaseColor } from '../hooks/useTimer'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { SpeechType, SPEECH_PRESETS, TimerConfig, TimerRecord } from '../types'
import { formatTime, secondsToInput, parseTimeInput } from '../utils/formatTime'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const RADIUS = 110
const STROKE = 14
const SIZE = 260
const CX = SIZE / 2
const CY = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        isRunning ? pause() : start()
      } else if (e.code === 'KeyR') {
        reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause, reset])

  const speechLabels: Record<SpeechType, string> = {
    preparado: t('speechPrepared'),
    'table-topics': t('speechTableTopics'),
    evaluacion: t('speechEvaluation'),
    personalizado: t('speechCustom'),
  }

  const phaseLabels: Record<string, string> = {
    neutral: t('timerPhaseNeutral'),
    verde: t('timerPhaseGreen'),
    amarillo: t('timerPhaseYellow'),
    rojo: t('timerPhaseRed'),
  }

  const currentConfig = config[speechType]
  const phase = getPhase(elapsed, currentConfig)
  const color = getPhaseColor(phase)
  const progress = Math.min(elapsed / currentConfig.redTime, 1)
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const overtime = elapsed > currentConfig.redTime ? elapsed - currentConfig.redTime : 0

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

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('timerTitle')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('timerSubtitle')}</p>
      </div>

      {/* Tipo de discurso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {(Object.keys(SPEECH_PRESETS) as SpeechType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleSpeechType(type)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              speechType === type
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {speechLabels[type]}
          </button>
        ))}
      </div>

      {/* Speaker name */}
      <div className="mb-4">
        <Input
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder={t('timerSpeakerPlaceholder')}
        />
      </div>

      {/* Timer ring */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center transition-colors duration-700"
        style={{ backgroundColor: phase === 'neutral' ? '#f8fafc' : `${color}12` }}
      >
        <div className="relative">
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
            <circle
              cx={CX} cy={CY} r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {speakerName && (
              <div className="text-xs font-medium text-slate-500 mb-1 truncate max-w-[140px]">
                {speakerName}
              </div>
            )}
            <div
              className="font-mono font-bold tracking-tight transition-colors duration-500"
              style={{
                fontSize: elapsed >= 3600 ? '2.8rem' : '3.5rem',
                color: phase === 'neutral' ? '#94a3b8' : color,
                lineHeight: 1,
              }}
            >
              {formatTime(elapsed)}
            </div>
            {overtime > 0 && (
              <div className="text-red-500 font-mono text-sm mt-1 font-semibold">
                +{formatTime(overtime)}
              </div>
            )}
            <div
              className="mt-2 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                backgroundColor: phase === 'neutral' ? '#f1f5f9' : `${color}22`,
                color: phase === 'neutral' ? '#94a3b8' : color,
              }}
            >
              {phaseLabels[phase]}
            </div>
          </div>
        </div>

        {/* Umbral indicators */}
        <div className="flex gap-6 mt-4">
          {([
            { labelKey: 'timerGreen' as const, time: currentConfig.greenTime, color: '#22c55e' },
            { labelKey: 'timerYellow' as const, time: currentConfig.yellowTime, color: '#f59e0b' },
            { labelKey: 'timerRed' as const, time: currentConfig.redTime, color: '#ef4444' },
          ]).map(({ labelKey, time, color: c }) => (
            <div key={labelKey} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-xs text-slate-500 font-medium">{t(labelKey)}: {formatTime(time)}</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          {!isRunning ? (
            <Button variant="success" size="xl" icon={<Play size={24} />} onClick={start}>
              {t('timerStart')}
            </Button>
          ) : (
            <Button variant="warning" size="xl" icon={<Pause size={24} />} onClick={pause}>
              {t('timerPause')}
            </Button>
          )}
          <Button variant="secondary" size="xl" icon={<RotateCcw size={22} />} onClick={reset}>
            {t('timerReset')}
          </Button>
        </div>

        {elapsed > 0 && (
          <div className="mt-4">
            <Button
              variant={savedFeedback ? 'success' : 'ghost'}
              size="sm"
              icon={savedFeedback ? <Check size={15} /> : <BookmarkPlus size={15} />}
              onClick={saveToRecord}
            >
              {savedFeedback ? t('timerSaved') : t('timerSave')}
            </Button>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400 font-mono">{t('timerShortcutHint')}</p>
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
