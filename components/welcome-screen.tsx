'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { spring } from './motion'
import { cn } from '@/lib/utils'
import { Sparkles, Target, ChevronRight } from 'lucide-react'

const MAX_NAME_LENGTH = 50

const GOAL_PRESETS = [
  'IIT Bombay',
  '99% Boards',
  'NEET AIR <100',
  'JEE Advanced',
  'Become a Scientist',
  'Topper',
  'AI Engineer',
  'CA',
  'UPSC',
  'Olympiad Medal',
]

export function WelcomeScreen() {
  const setUserName = useStore((s) => s.setUserName)
  const setAcademicGoal = useStore((s) => s.setAcademicGoal)
  const setOnboardingComplete = useStore((s) => s.setOnboardingComplete)

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [step, setStep] = useState<'name' | 'goal'>('name')
  const [goal, setGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const goalInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showContent && inputRef.current && step === 'name') {
      inputRef.current.focus()
    }
    if (step === 'goal' && showCustomInput && goalInputRef.current) {
      goalInputRef.current.focus()
    }
  }, [showContent, step, showCustomInput])

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError('Name is too long')
      return
    }
    setError(null)
    setIsSubmitting(true)

    setTimeout(() => {
      setShowCheckmark(true)
      setUserName(trimmed)
      setTimeout(() => {
        setIsSubmitting(false)
        setShowCheckmark(false)
        setStep('goal')
      }, 600)
    }, 300)
  }, [name, setUserName])

  const handleGoalSubmit = useCallback(() => {
    const finalGoal = showCustomInput ? customGoal.trim() : goal
    if (finalGoal) setAcademicGoal(finalGoal)
    setOnboardingComplete(true)
  }, [showCustomInput, customGoal, goal, setAcademicGoal, setOnboardingComplete])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (value.length <= MAX_NAME_LENGTH) {
        setName(value)
        if (error) setError(null)
      }
    },
    [error]
  )

  const handleGoalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleGoalSubmit()
      }
    },
    [handleGoalSubmit]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      <div className="ambient-orb-1 opacity-60" />
      <div className="ambient-orb-2 opacity-40" />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, oklch(0.45 0.18 280 / 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.40 0.14 250 / 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 20% 70%, oklch(0.35 0.12 190 / 0.08) 0%, transparent 60%)
          `,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

      <AnimatePresence mode="wait">
        {showContent && step === 'name' && (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md mx-4"
          >
            <div className="glass-panel p-8 md:p-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, ...spring.bouncy }}
                className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...spring.gentle }}
                className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground"
              >
                Welcome to Student OS
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ...spring.gentle }}
                className="text-sm md:text-base text-muted-foreground mt-2 leading-relaxed"
              >
                Your calm academic workspace.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, ...spring.gentle }}
                className="mt-8 space-y-4"
              >
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Your name"
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="off"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl bg-secondary/80 border text-sm text-foreground placeholder:text-muted-foreground/50',
                      'focus:outline-none focus:ring-1 transition-all duration-200',
                      error
                        ? 'border-destructive/60 focus:ring-destructive/40'
                        : 'border-transparent focus:ring-ring',
                      isSubmitting && 'opacity-40 cursor-not-allowed'
                    )}
                    aria-label="Enter your name"
                    aria-invalid={!!error}
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs text-destructive mt-1.5 text-left"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  whileTap={isSubmitting ? undefined : { scale: 0.97 }}
                  whileHover={isSubmitting ? undefined : { scale: 1.01 }}
                  transition={spring.snappy}
                  className={cn(
                    'w-full px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    'flex items-center justify-center gap-2',
                    isSubmitting
                      ? 'bg-primary/60 text-primary-foreground/80 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        {showCheckmark ? (
                          <motion.svg
                            key="check"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </motion.svg>
                        ) : (
                          <motion.div
                            key="spinner"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                        )}
                        <span>{showCheckmark ? 'Welcome!' : 'Just a moment...'}</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Continue
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-[11px] text-muted-foreground/40 mt-6"
              >
                Your name stays on this device. No account needed.
              </motion.p>
            </div>
          </motion.div>
        )}

        {showContent && step === 'goal' && (
          <motion.div
            key="goal-step"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md mx-4"
          >
            <div className="glass-panel p-8 md:p-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, ...spring.bouncy }}
                className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
              >
                <Target className="w-6 h-6 text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...spring.gentle }}
                className="text-xl md:text-2xl font-semibold tracking-tight text-foreground"
              >
                What are you working toward?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, ...spring.gentle }}
                className="text-sm text-muted-foreground mt-2 leading-relaxed"
              >
                Set your academic goal — it will appear on every startup.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, ...spring.gentle }}
                className="mt-6"
              >
                <div className="flex flex-wrap justify-center gap-2">
                  {GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => { setGoal(preset); setShowCustomInput(false); setCustomGoal('') }}
                      className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border',
                        goal === preset && !showCustomInput
                          ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                          : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setShowCustomInput(true); setGoal('') }}
                  className={cn(
                    'mt-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border',
                    showCustomInput
                      ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                      : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  Custom goal
                </button>

                <AnimatePresence>
                  {showCustomInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <input
                        ref={goalInputRef}
                        type="text"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        onKeyDown={handleGoalKeyDown}
                        placeholder="e.g. IIT Bombay"
                        maxLength={100}
                        autoComplete="off"
                        className="w-full mt-3 px-4 py-3 rounded-xl bg-secondary/80 border border-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
                        aria-label="Enter your academic goal"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleGoalSubmit}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  transition={spring.snappy}
                  className="w-full mt-5 px-5 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Let&apos;s go
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
