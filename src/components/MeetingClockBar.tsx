import { Clock } from 'lucide-react'
import { useMeetingClock } from '../contexts/MeetingClockContext'
import { formatTime } from '../utils/formatTime'
import { useLanguage } from '../contexts/LanguageContext'

export function MeetingClockBar() {
  const { t } = useLanguage()
  const { clock, remainingMs, clockElapsedMs, totalMs, isOver, isRunning } = useMeetingClock()

  if (clock.startedAt === null && clock.pausedElapsed === 0) return null

  const remainingSecs = Math.floor(remainingMs / 1000)
  const progress = Math.min(clockElapsedMs / totalMs, 1)
  const isWarning = progress >= 0.8 && !isOver

  const bg = isOver ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'

  return (
    <div className={`${bg} text-white text-xs flex items-center gap-3 px-4 py-1.5 print:hidden transition-colors shrink-0`}>
      <div className="flex items-center gap-1.5 shrink-0">
        <Clock size={12} className={isRunning ? 'animate-pulse' : 'opacity-60'} />
        <span className="font-medium hidden sm:inline">{t('meetingLabel')}</span>
      </div>
      <div className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/70 rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="font-mono font-bold shrink-0 text-sm">
        {isOver
          ? `+${formatTime(Math.floor(clockElapsedMs / 1000) - clock.durationMins * 60)}`
          : formatTime(remainingSecs)
        }
        <span className="font-normal opacity-75 text-[10px] ml-1">
          {isOver ? t('meetingOver') : t('meetingRemaining')}
        </span>
      </div>
    </div>
  )
}
