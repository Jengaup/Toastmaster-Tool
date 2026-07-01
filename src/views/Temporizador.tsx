import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, BookmarkPlus, Check, Maximize2, Minimize2, Clock, LayoutList, X, AlertTriangle, ChevronRight, ListOrdered } from 'lucide-react'
import { useTimer, getPhase, getPhaseColor } from '../hooks/useTimer'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { useMeetingClock } from '../contexts/MeetingClockContext'
import { SpeechType, SPEECH_PRESETS, TimerConfig, TimerRecord } from '../types'
import { formatTime, secondsToInput, parseTimeInput } from '../utils/formatTime'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const SPEECH_TYPE_STYLES: Record<SpeechType, { active: string; idle: string }> = {
  preparado:      { active: 'bg-white shadow-sm text-violet-700 font-semibold', idle: 'text-slate-500 hover:text-slate-700' },
  'table-topics': { active: 'bg-white shadow-sm text-pink-600 font-semibold',   idle: 'text-slate-500 hover:text-slate-700' },
  evaluacion:     { active: 'bg-white shadow-sm text-sky-600 font-semibold',     idle: 'text-slate-500 hover:text-slate-700' },
  personalizado:  { active: 'bg-white shadow-sm text-slate-700 font-semibold',   idle: 'text-slate-500 hover:text-slate-700' },
}

const SPEECH_TYPE_FS_BADGE: Record<SpeechType, string> = {
  preparado:      'bg-violet-900/50 text-violet-300',
  'table-topics': 'bg-pink-900/50 text-pink-300',
  evaluacion:     'bg-sky-900/50 text-sky-300',
  personalizado:  'bg-slate-800 text-slate-300',
}

const TM_OFFICIAL_RANGES: { label: string; green: number; yellow: number; red: number }[] = [
  { label: '4-6',   green: 240, yellow: 300, red: 360 },
  { label: '5-7',   green: 300, yellow: 360, red: 420 },
  { label: '10-15', green: 600, yellow: 738, red: 900 },
  { label: '18-20', green: 1080, yellow: 1140, red: 1200 },
]

const PHASE_VARIANTS = {
  neutral:  'primary',
  verde:    'success',
  amarillo: 'warning',
  rojo:     'danger',
  excedido: 'danger',
} as const

export default function Temporizador() {
  const { t, lang } = useLanguage()
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

  // Meeting clock
  const {
    clock, clockElapsedMs, totalMs, remainingMs, isRunning: meetingRunning, isOver,
    startMeeting, pauseMeeting, resetMeeting, setDuration,
    segments, segmentElapsedMs, toggleSegment, resetSegment, addSegment, deleteSegment, loadStandardAgenda,
  } = useMeetingClock()
  const [showMeeting, setShowMeeting] = useLocalStorage('tm_ui_panel_meeting', true)
  const [showSegments, setShowSegments] = useLocalStorage('tm_ui_panel_segments', false)
  const [newSegLabel, setNewSegLabel] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [showSpeakerDetails, setShowSpeakerDetails] = useState(false)
  const [trayecto, setTrayecto] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [titulodiscurso, setTituloDiscurso] = useState('')
  const confirmResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const meetingActive = meetingRunning || clock.pausedElapsed > 0

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

  const saveRef = useRef<() => void>(() => {})
  const handleReset = useCallback(() => {
    if (elapsed > 0 && !confirmReset) {
      setConfirmReset(true)
      if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current)
      confirmResetTimer.current = setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    reset()
    setConfirmReset(false)
  }, [elapsed, confirmReset, reset])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        isRunning ? pause() : start()
      } else if (e.code === 'KeyR') {
        handleReset()
      } else if (e.code === 'KeyS') {
        saveRef.current()
      } else if (e.code === 'KeyF') {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause, handleReset, toggleFullscreen])

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
    excedido: t('timerPhaseRed'),
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

  const saveToRecord = useCallback(() => {
    if (elapsed === 0) return
    const record: TimerRecord = {
      id: newId(),
      nombre: speakerName.trim() || t('timerUnnamed'),
      tipo: speechLabels[speechType],
      tiempoFinal: elapsed,
      notas: '',
      fecha: new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'),
      ...(trayecto.trim() && { trayecto: trayecto.trim() }),
      ...(proyecto.trim() && { proyecto: proyecto.trim() }),
      ...(titulodiscurso.trim() && { titulo: titulodiscurso.trim() }),
    }
    setRecords((prev) => [...prev, record])
    setSavedFeedback(true)
    setSpeakerName('')
    setTrayecto('')
    setProyecto('')
    setTituloDiscurso('')
    setShowSpeakerDetails(false)
    setTimeout(() => setSavedFeedback(false), 2000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, speakerName, speechType, lang, trayecto, proyecto, titulodiscurso])

  useEffect(() => { saveRef.current = saveToRecord }, [saveToRecord])

  const startVariant = PHASE_VARIANTS[phase]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <PageHeader title={t('timerTitle')} subtitle={t('timerSubtitle')} />

      {/* ── Meeting Clock Panel ─────────────────────────────────────────── */}
      <div className="mb-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowMeeting(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-indigo-500" />
            <span>{t('meetingTitle')}</span>
            {meetingActive && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isOver ? 'bg-red-100 text-red-600' :
                meetingRunning ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {isOver
                  ? `+${formatTime(Math.floor(clockElapsedMs / 1000) - clock.durationMins * 60)}`
                  : formatTime(Math.floor(remainingMs / 1000))
                }
              </span>
            )}
          </div>
          {showMeeting ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showMeeting && (
          <div className="px-5 pb-5 border-t border-slate-100">
            {/* Duration row */}
            <div className="flex items-center gap-3 pt-4 mb-5">
              <span className="text-xs font-medium text-slate-500 shrink-0">{t('meetingDuration')}:</span>
              <input
                type="number"
                min={1}
                max={300}
                value={clock.durationMins}
                onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={meetingRunning}
                className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              />
              <span className="text-xs text-slate-400">{t('meetingDurationMins')}</span>
            </div>

            {/* Countdown display */}
            <div className="text-center mb-4">
              <div className={`font-timer font-bold leading-none transition-colors ${
                isOver ? 'text-red-500' : meetingRunning ? 'text-indigo-700' : 'text-slate-500'
              }`} style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}>
                {isOver
                  ? `+${formatTime(Math.floor(clockElapsedMs / 1000) - clock.durationMins * 60)}`
                  : formatTime(Math.floor(remainingMs / 1000))
                }
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isOver ? t('meetingOver') : `${t('meetingRemaining')} · ${clock.durationMins} ${t('meetingDurationMins')}`}
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden mx-auto max-w-xs">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isOver ? 'bg-red-500' : clockElapsedMs / totalMs >= 0.8 ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(clockElapsedMs / totalMs * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              {!meetingRunning ? (
                <Button variant="primary" size="sm" icon={<Play size={13} fill="currentColor" />} onClick={startMeeting}>
                  {clock.pausedElapsed > 0 ? t('meetingResume') : t('meetingStart')}
                </Button>
              ) : (
                <Button variant="warning" size="sm" icon={<Pause size={13} fill="currentColor" />} onClick={pauseMeeting}>
                  {t('meetingPause')}
                </Button>
              )}
              {meetingActive && (
                <Button variant="secondary" size="sm" icon={<RotateCcw size={13} />} onClick={resetMeeting}>
                  {t('meetingReset')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Meeting Segments Panel ───────────────────────────────────────── */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSegments(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <LayoutList size={15} className="text-slate-400" />
            <span>{t('meetingSegmentsTitle')}</span>
            {segments.some(s => s.startedAt !== null || s.accumulated > 0) && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                {segments.filter(s => s.startedAt !== null || s.accumulated > 0).length}
              </span>
            )}
          </div>
          {showSegments ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showSegments && (
          <div className="border-t border-slate-100">
            {segments.map(seg => {
              const elapsedSecs = Math.floor(segmentElapsedMs(seg) / 1000)
              const active = seg.startedAt !== null
              return (
                <div
                  key={seg.id}
                  className={`flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0 transition-colors ${
                    active ? 'bg-indigo-50/70' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleSegment(seg.id)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      active
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                    }`}
                  >
                    {active ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                  </button>
                  <span className={`flex-1 text-sm truncate ${active ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}>
                    {seg.label}
                  </span>
                  <span className={`font-mono text-sm shrink-0 ${
                    active ? 'text-indigo-600 font-bold' : elapsedSecs > 0 ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {formatTime(elapsedSecs)}
                  </span>
                  <button
                    onClick={() => resetSegment(seg.id)}
                    title={t('meetingReset')}
                    className="p-1 text-slate-300 hover:text-slate-500 rounded transition-colors shrink-0"
                  >
                    <RotateCcw size={11} />
                  </button>
                  <button
                    onClick={() => deleteSegment(seg.id)}
                    title={t('delete')}
                    className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              )
            })}
            {/* Add segment */}
            <div className="px-5 py-3 flex gap-2 border-t border-slate-100">
              <input
                type="text"
                value={newSegLabel}
                onChange={e => setNewSegLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSegLabel.trim()) {
                    addSegment(newSegLabel.trim())
                    setNewSegLabel('')
                  }
                }}
                placeholder={t('meetingSegmentPlaceholder')}
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => { if (newSegLabel.trim()) { addSegment(newSegLabel.trim()); setNewSegLabel('') } }}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors font-medium"
              >
                {t('meetingSegmentAdd')}
              </button>
            </div>
            {/* Load standard agenda */}
            <div className="px-5 py-2.5 border-t border-slate-100">
              <button
                onClick={() => {
                  if (window.confirm(t('meetingLoadStandardConfirm'))) loadStandardAgenda()
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ListOrdered size={12} />
                {t('meetingLoadStandard')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Speech Timer section label ───────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">{t('meetingSpeechSection')}</p>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Speech type selector — segmented control */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-slate-100 rounded-xl p-1 mb-2">
        {(Object.keys(SPEECH_PRESETS) as SpeechType[]).map((type) => {
          const isActive = speechType === type
          const styles = SPEECH_TYPE_STYLES[type]
          return (
            <button
              key={type}
              onClick={() => handleSpeechType(type)}
              className={`px-3 py-2 rounded-lg text-sm transition-all active:scale-[0.97] ${
                isActive ? styles.active : styles.idle
              }`}
            >
              {speechLabels[type]}
            </button>
          )
        })}
      </div>

      {/* Official TM range quick-apply — only for prepared speech */}
      {speechType === 'preparado' && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-xs text-slate-400 shrink-0">{t('timerOfficialRanges')}:</span>
          <div className="flex gap-1.5 flex-wrap">
            {TM_OFFICIAL_RANGES.map((r) => {
              const isCurrentRange =
                config.preparado.greenTime === r.green &&
                config.preparado.yellowTime === r.yellow &&
                config.preparado.redTime === r.red
              return (
                <button
                  key={r.label}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    preparado: { ...prev.preparado, greenTime: r.green, yellowTime: r.yellow, redTime: r.red }
                  }))}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
                    isCurrentRange
                      ? 'bg-violet-100 text-violet-700 border-violet-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                  }`}
                >
                  {r.label} min
                </button>
              )
            })}
          </div>
        </div>
      )}
      {speechType !== 'preparado' && <div className="mb-4" />}

      {/* Speaker name + optional details */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            placeholder={t('timerSpeakerPlaceholder')}
          />
          <button
            onClick={() => setShowSpeakerDetails(v => !v)}
            className={`shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-lg border transition-all ${
              showSpeakerDetails
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-500'
            }`}
          >
            <ChevronRight size={12} className={`transition-transform ${showSpeakerDetails ? 'rotate-90' : ''}`} />
            {showSpeakerDetails ? t('timerHideSpeakerDetails') : t('timerSpeakerDetails')}
          </button>
        </div>
        {showSpeakerDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-1">
            <Input
              value={titulodiscurso}
              onChange={(e) => setTituloDiscurso(e.target.value)}
              placeholder={t('timerSpeechTitle')}
            />
            <Input
              value={trayecto}
              onChange={(e) => setTrayecto(e.target.value)}
              placeholder={t('timerPathway')}
            />
            <Input
              value={proyecto}
              onChange={(e) => setProyecto(e.target.value)}
              placeholder={t('timerProject')}
            />
          </div>
        )}
      </div>

      {/* Timer card — this element goes fullscreen */}
      <div
        ref={containerRef}
        className={`flex flex-col items-center transition-colors duration-500 ${
          isFullscreen
            ? 'bg-slate-950 justify-center gap-6 p-10'
            : 'rounded-2xl border bg-white shadow-lg p-6 md:p-10 gap-5'
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

        {/* PAUSED indicator */}
        {!isRunning && elapsed > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full animate-pulse">
            <Pause size={10} fill="currentColor" />
            {t('timerPaused')}
          </div>
        )}

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
          <Button
            variant={confirmReset ? 'danger' : 'secondary'}
            size="xl"
            icon={confirmReset ? <AlertTriangle size={isFullscreen ? 26 : 22} /> : <RotateCcw size={isFullscreen ? 26 : 22} />}
            onClick={handleReset}
          >
            {confirmReset ? t('timerConfirmReset') : t('timerReset')}
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
              title={t('timerFullscreen')}
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
      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>{t('timerConfigTitle')} — {speechLabels[speechType]}</span>
          {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showConfig && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div key={speechType} className="grid grid-cols-3 gap-4 pt-4">
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
