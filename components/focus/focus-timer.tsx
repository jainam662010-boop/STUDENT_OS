'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FocusTimerProps {
  timeLeft: number
  totalTime: number
  progressPercent: number
  isRunning: boolean
}

export function FocusTimer({
  timeLeft,
  totalTime,
  progressPercent,
  isRunning,
}: FocusTimerProps) {
  const cx = 140
  const cy = 140
  const r = 120
  const circumference = 2 * Math.PI * r

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  let display: string
  if (hours > 0) {
    display = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const isComplete = timeLeft <= 0

  return (
    <div className="relative flex items-center justify-center w-full max-w-[260px] mx-auto sm:max-w-[280px]">
      <motion.div
        animate={
          isRunning && !isComplete
            ? { scale: [1, 1.005, 1], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
            : { scale: 1 }
        }
        className="relative w-full"
      >
        <svg viewBox="0 0 280 280" className="w-full h-auto -rotate-90 drop-shadow-xl" aria-hidden="true">
          <defs>
            <radialGradient id="focusGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.68 0.16 275 / 0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="focusGlowFilter">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={r + 35} fill="url(#focusGlow)" />

          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border/40"
          />

          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progressPercent / 100) * circumference}
            filter={isRunning && !isComplete ? 'url(#focusGlowFilter)' : undefined}
            className={cn(isComplete ? 'text-primary/40' : isRunning ? 'text-primary' : 'text-primary/60')}
            animate={{
              strokeDashoffset: circumference - (progressPercent / 100) * circumference,
              opacity: isRunning && !isComplete ? [0.85, 1, 0.85] : 1,
            }}
            transition={{
              strokeDashoffset: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              opacity: isRunning && !isComplete
                ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0 },
            }}
          />

          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progressPercent / 100) * circumference}
            className={cn(isComplete ? 'text-primary/5' : 'text-primary/10')}
            animate={{ strokeDashoffset: circumference - (progressPercent / 100) * circumference }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-2">
            <motion.div
              key={`${timeLeft}-${isRunning}`}
              initial={{ scale: 1.02, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-[clamp(1.75rem,8vw,3.5rem)] lg:text-6xl font-mono font-bold tracking-tight text-foreground tabular-nums leading-none"
            >
              {display}
            </motion.div>
            <motion.p
              animate={isRunning && !isComplete ? { opacity: [0.5, 0.8, 0.5] } : { opacity: 0.5 }}
              transition={isRunning && !isComplete ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
              className="text-muted-foreground/60 mt-1.5 text-xs sm:text-sm font-medium tracking-wide"
            >
              {isComplete ? 'Session complete' : isRunning ? 'Focusing' : 'Paused'}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
