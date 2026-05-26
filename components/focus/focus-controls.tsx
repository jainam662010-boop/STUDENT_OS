'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { spring } from '@/components/motion'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'

const PRESETS = [
  { label: '30m', duration: 30 * 60 },
  { label: '1h', duration: 60 * 60 },
  { label: '1.5h', duration: 90 * 60 },
  { label: '2h', duration: 120 * 60 },
]

interface FocusControlsProps {
  isRunning: boolean
  selectedDuration: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onPresetSelect: (duration: number) => void
  showCustom: boolean
  onToggleCustom: () => void
  customHours: number
  customMinutes: number
  onCustomHoursChange: (h: number) => void
  onCustomMinutesChange: (m: number) => void
}

export function FocusControls({
  isRunning,
  selectedDuration,
  onStart,
  onPause,
  onReset,
  onPresetSelect,
  showCustom,
  onToggleCustom,
  customHours,
  customMinutes,
  onCustomHoursChange,
  onCustomMinutesChange,
}: FocusControlsProps) {
  const isCustom = !PRESETS.some((p) => p.duration === selectedDuration)

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
      {!isRunning && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.04] w-full overflow-x-auto no-scrollbar">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onPresetSelect(preset.duration)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex-1',
                  !isCustom && selectedDuration === preset.duration
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground/50 hover:text-foreground/70'
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={onToggleCustom}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex-1',
                isCustom
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-muted-foreground/50 hover:text-foreground/70'
              )}
            >
              Custom
            </button>
          </div>

          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden w-full"
              >
                <div className="flex items-center justify-center gap-3 bg-white/[0.03] rounded-xl px-4 py-2.5 border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground/50 font-medium">Hours</label>
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg px-2 py-1">
                      <button
                        onClick={() => onCustomHoursChange(Math.max(0, customHours - 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/[0.04] text-sm touch-target"
                        aria-label="Decrease hours"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-foreground/80 tabular-nums">
                        {customHours}
                      </span>
                      <button
                        onClick={() => onCustomHoursChange(Math.min(23, customHours + 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/[0.04] text-sm touch-target"
                        aria-label="Increase hours"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="text-muted-foreground/30">:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground/50 font-medium">Min</label>
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg px-2 py-1">
                      <button
                        onClick={() => onCustomMinutesChange(Math.max(0, customMinutes - 5))}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/[0.04] text-sm touch-target"
                        aria-label="Decrease minutes"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-foreground/80 tabular-nums">
                        {customMinutes.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => onCustomMinutesChange(Math.min(55, customMinutes + 5))}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/[0.04] text-sm touch-target"
                        aria-label="Increase minutes"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex items-center gap-4">
        <motion.button
          onClick={onReset}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="p-3 rounded-xl text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors touch-target"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        <motion.button
          onClick={isRunning ? onPause : onStart}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm touch-target',
            isRunning
              ? 'bg-white/[0.06] text-foreground/80'
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          )}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          <motion.div
            key={isRunning ? 'pause' : 'play'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.snappy}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.div>
        </motion.button>
      </div>
    </div>
  )
}
