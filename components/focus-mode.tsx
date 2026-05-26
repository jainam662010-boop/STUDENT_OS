'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer } from './motion'
import { FocusTimer } from './focus/focus-timer'
import { FocusControls } from './focus/focus-controls'
import { FocusStats } from './focus/focus-stats'
import { cn } from '@/lib/utils'
import { QuoteDisplay } from './ui/quote-display'
import { Settings } from 'lucide-react'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { showFocusCompleteNotification, vibrate } from '@/lib/notifications'

const DEFAULT_DURATION = 60 * 60
const TICK_INTERVAL = 200
const PERSIST_DEBOUNCE_MS = 3000
const MAX_SESSION_MESSAGE_MS = 5000

const audioCtxRef: { current: AudioContext | null } = { current: null }

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume()
  }
  return audioCtxRef.current
}

function playNotification() {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = 1100
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  } catch { /* noop */ }
}

export function FocusMode() {
  const startFocusSession = useStore((s) => s.startFocusSession)
  const endFocusSession = useStore((s) => s.endFocusSession)
  const currentSession = useStore((s) => s.currentSession)
  const currentStreak = useStore((s) => s.progress.currentStreak)
  const focusTimerState = useStore((s) => s.focusTimerState)
  const setFocusTimerState = useStore((s) => s.setFocusTimerState)

  const todayFocusTime = useStore((s) =>
    s.focusSessions
      .filter((fs) => fs.endTime && new Date(fs.endTime).toDateString() === new Date().toDateString())
      .reduce((acc, fs) => acc + fs.duration, 0)
  )

  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customHours, setCustomHours] = useState(1)
  const [customMinutes, setCustomMinutes] = useState(0)

  const endTimestampRef = useRef<number | null>(null)
  const pausedElapsedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)
  const isRunningRef = useRef(false)
  const durationRef = useRef(duration)
  const accumulatedRef = useRef(0)
  const resumeTimestampRef = useRef<number | null>(null)
  const selectedDurationRef = useRef(selectedDuration)
  const pauseCountRef = useRef(0)
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const sessionMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTickRef = useRef<number>(Date.now())
  const driftWarningShownRef = useRef(false)

  // Wake lock to prevent device sleep during active sessions
  const { isActive: wakeLockActive } = useWakeLock(isRunning)

  useEffect(() => { durationRef.current = duration }, [duration])
  useEffect(() => { selectedDurationRef.current = selectedDuration }, [selectedDuration])
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])

  const totalTime = duration
  const progressPercent = useMemo(
    () => (totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0),
    [totalTime, timeLeft]
  )

  const showSessionMessage = useCallback((msg: string, ms = 4000) => {
    if (sessionMessageTimerRef.current) clearTimeout(sessionMessageTimerRef.current)
    setSessionMessage(msg)
    sessionMessageTimerRef.current = setTimeout(() => setSessionMessage(null), ms)
  }, [])

  const tick = useCallback(() => {
    const ts = endTimestampRef.current
    if (ts === null) return

    const now = Date.now()
    const remaining = Math.max(0, Math.round((ts - now) / 1000))

    lastTickRef.current = now

    setTimeLeft(remaining)
    if (remaining > 0) return
    if (completedRef.current) return
    completedRef.current = true

    // Immediately stop the timer
    setIsRunning(false)
    isRunningRef.current = false
    endTimestampRef.current = null
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }

    if (resumeTimestampRef.current !== null) {
      accumulatedRef.current += (now - resumeTimestampRef.current) / 60000
      resumeTimestampRef.current = null
    }
    const actualMin = Math.max(1, Math.round(accumulatedRef.current))
    pausedElapsedRef.current = 0
    accumulatedRef.current = 0
    pauseCountRef.current = 0
    setFocusTimerState(null)

    // Completion feedback
    playNotification()
    vibrate([200, 100, 200])
    
    const targetMin = Math.round(selectedDurationRef.current / 60)
    endFocusSession(actualMin, targetMin, false, { pauseCount: 0 })
    
    showFocusCompleteNotification(actualMin, {
      motivationalLine: 'Excellent! Full session completed.',
    })
    
    showSessionMessage('Excellent! Full session completed.')
  }, [endFocusSession, setFocusTimerState, showSessionMessage])

  useEffect(() => {
    if (isRunning && endTimestampRef.current !== null) {
      intervalRef.current = setInterval(tick, TICK_INTERVAL)
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isRunning, tick])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && isRunningRef.current && endTimestampRef.current !== null) {
        tick()
      }
    }

    const handleFocus = () => {
      if (isRunningRef.current && endTimestampRef.current !== null) {
        tick()
      }
    }

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isRunningRef.current && endTimestampRef.current !== null) {
        tick()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [tick])

  useEffect(() => {
    if (focusTimerState && focusTimerState.isRunning) {
      const remaining = Math.max(0, Math.round((focusTimerState.endTimestamp - Date.now()) / 1000))
      if (remaining > 0) {
        setDuration(focusTimerState.duration)
        setSelectedDuration(focusTimerState.duration)
        setTimeLeft(remaining)
        setIsRunning(true)
        isRunningRef.current = true
        endTimestampRef.current = focusTimerState.endTimestamp
        pausedElapsedRef.current = focusTimerState.elapsedBeforePause
      } else {
        setFocusTimerState(null)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      if (sessionMessageTimerRef.current) {
        clearTimeout(sessionMessageTimerRef.current)
        sessionMessageTimerRef.current = null
      }
    }
  }, [])

  const persistState = useCallback(() => {
    const ts = endTimestampRef.current
    if (ts !== null) {
      setFocusTimerState({
        endTimestamp: ts,
        duration: durationRef.current,
        isRunning: isRunningRef.current,
        elapsedBeforePause: pausedElapsedRef.current,
      })
    }
  }, [setFocusTimerState])

  useEffect(() => {
    if (!isRunning) return
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(persistState, PERSIST_DEBOUNCE_MS)
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
    }
  }, [isRunning, persistState])

  const handleStart = useCallback(() => {
    if (timeLeft <= 0) return
    completedRef.current = false
    driftWarningShownRef.current = false
    lastTickRef.current = Date.now()
    endTimestampRef.current = Date.now() + timeLeft * 1000
    setIsRunning(true)
    isRunningRef.current = true
    resumeTimestampRef.current = Date.now()
    if (!currentSession) {
      accumulatedRef.current = 0
      pauseCountRef.current = 0
      startFocusSession('custom')
    }
    persistState()
  }, [timeLeft, currentSession, startFocusSession, persistState])

  const handlePause = useCallback(() => {
    if (endTimestampRef.current !== null && resumeTimestampRef.current !== null) {
      pauseCountRef.current += 1
      accumulatedRef.current += (Date.now() - resumeTimestampRef.current) / 60000
      resumeTimestampRef.current = null
      pausedElapsedRef.current = durationRef.current - Math.max(0, Math.round((endTimestampRef.current - Date.now()) / 1000))
      setIsRunning(false)
      isRunningRef.current = false
      endTimestampRef.current = null
      setFocusTimerState({
        endTimestamp: 0,
        duration: durationRef.current,
        isRunning: false,
        elapsedBeforePause: pausedElapsedRef.current,
      })
    }
  }, [setFocusTimerState])

  const handleReset = useCallback(() => {
    if (isRunningRef.current && resumeTimestampRef.current !== null) {
      accumulatedRef.current += (Date.now() - resumeTimestampRef.current) / 60000
      resumeTimestampRef.current = null
    }
    const hadAccumulated = accumulatedRef.current > 0
    setIsRunning(false)
    isRunningRef.current = false
    endTimestampRef.current = null
    pausedElapsedRef.current = 0
    completedRef.current = false
    driftWarningShownRef.current = false
    setTimeLeft(selectedDurationRef.current)
    setDuration(selectedDurationRef.current)
    if (hadAccumulated) {
      const actualMin = Math.max(1, Math.round(accumulatedRef.current))
      endFocusSession(actualMin, Math.round(selectedDurationRef.current / 60), true, { pauseCount: pauseCountRef.current })
      if (actualMin < Math.round(selectedDurationRef.current / 60) * 0.5) {
        showSessionMessage('Every minute counts. Great start!', MAX_SESSION_MESSAGE_MS)
      } else {
        showSessionMessage('Progress over perfection. Well done!', MAX_SESSION_MESSAGE_MS)
      }
    } else if (currentSession) {
      endFocusSession(0, Math.round(selectedDurationRef.current / 60), true)
    }
    accumulatedRef.current = 0
    pauseCountRef.current = 0
    setFocusTimerState(null)
  }, [currentSession, endFocusSession, setFocusTimerState, showSessionMessage])

  const handlePresetSelect = useCallback((newDuration: number) => {
    setSelectedDuration(newDuration)
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setIsRunning(false)
    endTimestampRef.current = null
    pausedElapsedRef.current = 0
    completedRef.current = false
    setShowCustom(false)
  }, [])

  const applyCustom = useCallback(() => {
    const total = customHours * 3600 + customMinutes * 60
    if (total > 0) {
      handlePresetSelect(total)
    }
  }, [customHours, customMinutes, handlePresetSelect])

  const handleToggleCustom = useCallback(() => {
    setShowCustom((prev) => {
      if (!prev) {
        const total = customHours * 3600 + customMinutes * 60
        if (total > 0) {
          setSelectedDuration(total)
          setDuration(total)
          setTimeLeft(total)
          setIsRunning(false)
          endTimestampRef.current = null
          pausedElapsedRef.current = 0
          completedRef.current = false
        }
      }
      return !prev
    })
  }, [customHours, customMinutes])

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/8 to-transparent blur-[100px] animate-[ambientDrift_20s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-500/6 to-transparent blur-[120px] animate-[ambientDrift_25s_ease-in-out_infinite_alternate-reverse]" />
        <div className="ambient-breath" />
        <div className="ambient-mandala">
          <div className="ambient-mandala-ring" />
          <div className="ambient-mandala-ring" />
          <div className="ambient-mandala-ring" />
          <div className="ambient-mandala-ring" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 flex flex-col min-h-[calc(100dvh-8rem)] lg:min-h-screen safe-bottom"
      >
        <div className="flex items-start justify-between px-4 pt-4 lg:px-8 lg:pt-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm lg:text-base font-semibold tracking-tight text-foreground/80">
              Focus
            </h1>
            <p className="text-[11px] text-muted-foreground/50">
              Deep work session
            </p>
            <div className="mt-2 max-w-[180px] sm:max-w-[220px]">
              <QuoteDisplay variant="subtle" />
            </div>
          </div>
          <motion.button
            onClick={() => setShowSettings((s) => !s)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 shrink-0',
              showSettings
                ? 'text-primary/80'
                : 'text-muted-foreground/50 hover:text-foreground/80'
            )}
            aria-label={showSettings ? 'Close stats' : 'Open stats'}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 lg:gap-10 px-4 pb-6 lg:px-8 lg:pb-12 safe-bottom">
          <div className="relative w-full max-w-[300px] mx-auto">
            <div className="absolute -inset-4 sm:-inset-6 lg:-inset-10 bg-gradient-to-br from-background/15 via-background/20 to-background/25 backdrop-blur-[6px] rounded-full border border-white/[0.06] shadow-xl pointer-events-none" />
            <FocusTimer
              timeLeft={timeLeft}
              totalTime={totalTime}
              progressPercent={progressPercent}
              isRunning={isRunning}
            />
          </div>

          <AnimatePresence>
            {sessionMessage && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-sm text-foreground/80 text-center max-w-[280px] mx-auto"
              >
                {sessionMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <FocusControls
            isRunning={isRunning}
            selectedDuration={selectedDuration}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onPresetSelect={handlePresetSelect}
            showCustom={showCustom}
            onToggleCustom={handleToggleCustom}
            customHours={customHours}
            customMinutes={customMinutes}
            onCustomHoursChange={setCustomHours}
            onCustomMinutesChange={setCustomMinutes}
          />
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-4 lg:right-8 top-20 z-20 hidden lg:block"
            >
              <FocusStats
                todayFocusTime={todayFocusTime}
                currentStreak={currentStreak}
                onClose={() => setShowSettings(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showSettings && (
          <div className="lg:hidden px-4 pb-4 -mt-4">
            <FocusStats
              todayFocusTime={todayFocusTime}
              currentStreak={currentStreak}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </motion.div>
    </>
  )
}
