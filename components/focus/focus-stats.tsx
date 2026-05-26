'use client'

import { motion } from 'framer-motion'
import { Timer, X, Flame } from 'lucide-react'

interface FocusStatsProps {
  todayFocusTime: number
  currentStreak: number
  onClose: () => void
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`
  return `${m}m`
}

export function FocusStats({
  todayFocusTime,
  currentStreak,
  onClose,
}: FocusStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full lg:w-56 rounded-2xl bg-white/[0.04] shadow-xl backdrop-blur-xl border border-white/[0.04]"
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-foreground/50">
          Stats
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-foreground/20 hover:text-foreground/60 transition-colors"
          aria-label="Close stats"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-px bg-white/[0.03] mx-4" />

      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-foreground/60">
          <Timer className="w-3.5 h-3.5 text-foreground/30" />
          <div>
            <div className="text-[11px] font-semibold">{formatMinutes(todayFocusTime)}</div>
            <div className="text-[9px] text-foreground/30 tracking-wider uppercase">Today</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-foreground/60">
          <Flame className="w-3.5 h-3.5 text-foreground/30" />
          <div>
            <div className="text-[11px] font-semibold">{currentStreak}</div>
            <div className="text-[9px] text-foreground/30 tracking-wider uppercase">Streak</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
