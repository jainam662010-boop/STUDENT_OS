'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem } from './motion'
import { Card } from './ui/glass-card'
import { Button } from './ui/button'
import {
  Moon, Sun, Monitor, Sparkles, Download, Trash2, Clock, Bell, Target,
  Instagram, User, ChevronRight, RotateCcw, Brain, BookOpen, Star, Eye, Zap, BellRing, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileAvatar } from './profile-avatar'
import { AVATAR_CATEGORIES } from './ui/avatars'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showTestNotification,
  isNotificationSupported,
  type NotificationPermissionState,
} from '@/lib/notifications'
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

export function Settings() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const userName = useStore((s) => s.userName)
  const setUserName = useStore((s) => s.setUserName)
  const progress = useStore((s) => s.progress)
  const resetOnboarding = useStore((s) => s.resetOnboarding)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  const studyStyle = useStore((s) => s.studyStyle)
  const setStudyStyle = useStore((s) => s.setStudyStyle)
  const academicGoal = useStore((s) => s.academicGoal)
  const setAcademicGoal = useStore((s) => s.setAcademicGoal)
  const preferredFocusDuration = useStore((s) => s.preferredFocusDuration)
  const setPreferredFocusDuration = useStore((s) => s.setPreferredFocusDuration)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const setReducedMotion = useStore((s) => s.setReducedMotion)
  const avatar = useStore((s) => s.avatar)
  const setAvatar = useStore((s) => s.setAvatar)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState(academicGoal)
  const [goalMode, setGoalMode] = useState<'preset' | 'custom'>(
    academicGoal && !GOAL_PRESETS.includes(academicGoal) ? 'custom' : 'preset'
  )
  const [customGoalInput, setCustomGoalInput] = useState(
    academicGoal && !GOAL_PRESETS.includes(academicGoal) ? academicGoal : ''
  )
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showDailyGoalModal, setShowDailyGoalModal] = useState(false)
  const [dailyGoalInput, setDailyGoalInput] = useState(dailyGoal.toString())

  const anyModalOpen = showClearConfirm || showGoalModal || showResetConfirm || showAvatarPicker || showDailyGoalModal
  useEffect(() => {
    document.body.classList.toggle('scroll-locked', anyModalOpen)
    return () => document.body.classList.remove('scroll-locked')
  }, [anyModalOpen])

  const handleExport = () => {
    try {
      const raw = localStorage.getItem('student-os-storage-v3')
      if (!raw) return
      const blob = new Blob([raw], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const handleClearData = () => {
    localStorage.removeItem('student-os-storage-v3')
    ;['student-os-storage', 'student-os-storage-v2'].forEach((k) => {
      try { localStorage.removeItem(k) } catch {}
    })
    window.location.reload()
  }

  const handleResetOnboarding = () => {
    resetOnboarding()
    setShowResetConfirm(false)
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5 max-w-xl">
      <motion.div variants={staggerItem}>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Profile</h3>
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-4 p-5">
            <motion.button
              onClick={() => setShowAvatarPicker(true)}
              whileHover={{ scale: 1.05 }}
              className="shrink-0"
            >
              <ProfileAvatar size="lg" />
            </motion.button>
            <div className="flex-1">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                className="text-base font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 w-full text-foreground"
                placeholder="Your name" aria-label="Your name" maxLength={50} />
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>Level {progress.level}</span>
                <span>{progress.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border">
            <div className="p-3.5 text-center border-r border-border">
              <p className="text-lg font-semibold text-foreground">{Math.floor(progress.totalFocusTime / 60)}</p>
              <p className="text-xs text-muted-foreground">Hours focused</p>
            </div>
            <div className="p-3.5 text-center border-r border-border">
              <p className="text-lg font-semibold text-foreground">{progress.totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Tasks done</p>
            </div>
            <div className="p-3.5 text-center">
              <p className="text-lg font-semibold text-foreground">{progress.bestStreak}</p>
              <p className="text-xs text-muted-foreground">Best streak</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Appearance</h3>
        <Card className="p-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <ThemeButton icon={<Sun className="w-4 h-4" />} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeButton icon={<Moon className="w-4 h-4" />} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
            <ThemeButton icon={<Monitor className="w-4 h-4" />} label="AMOLED" active={theme === 'amoled'} onClick={() => setTheme('amoled')} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Study Style</h3>
        <Card className="p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {([['deep-work', 'Deep Work', Brain], ['consistent', 'Consistent', Target], ['sprint', 'Sprint', Zap], ['night-owl', 'Night Owl', Moon]] as const).map(([value, label, Icon]) => (
              <button key={value} onClick={() => setStudyStyle(value)}
                className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors text-xs', studyStyle === value ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground')}
                aria-label={`Study style: ${label}`}
              >
                <Icon className="w-4 h-4" /><span>{label}</span>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Focus</h3>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Clock className="w-4 h-4" />} title="Default timer" description="Adjust presets in the Focus tab" />
          <SettingRow icon={<Bell className="w-4 h-4" />} title="Sound & notifications" description="Timer alert on completion" />
          <SettingRow icon={<Target className="w-4 h-4" />} title="Daily goal" description={`${dailyGoal} minutes`} onClick={() => { setDailyGoalInput(dailyGoal.toString()); setShowDailyGoalModal(true) }} />
          <SettingRow icon={<Target className="w-4 h-4" />} title="Weekly goal" description={`${Math.floor(progress.weeklyGoal / 60)} hours`} />
          <SettingRow icon={<BookOpen className="w-4 h-4" />} title="Academic goal" description={academicGoal || 'Set a goal'} onClick={() => { setGoalInput(academicGoal); setGoalMode(academicGoal && !GOAL_PRESETS.includes(academicGoal) ? 'custom' : 'preset'); setCustomGoalInput(academicGoal && !GOAL_PRESETS.includes(academicGoal) ? academicGoal : ''); setShowGoalModal(true) }} />
          <SettingRow icon={<Star className="w-4 h-4" />} title="Preferred duration" description={`${preferredFocusDuration} min`} onClick={() => { const d = prompt('Preferred session length (min):', String(preferredFocusDuration)); if (d !== null) { const n = parseInt(d); if (n >= 10 && n <= 240) setPreferredFocusDuration(n) } }} />
          <SettingRow icon={<Eye className="w-4 h-4" />} title="Reduced motion" description={reducedMotion ? 'On' : 'Off'} onClick={() => setReducedMotion(!reducedMotion)} isLast />
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Data</h3>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<Download className="w-4 h-4" />} title="Export data" description="Download JSON backup" onClick={handleExport} />
          <SettingRow icon={<RotateCcw className="w-4 h-4" />} title="Reset onboarding" description="Show welcome screen again" onClick={() => setShowResetConfirm(true)} />
          <SettingRow icon={<Trash2 className="w-4 h-4" />} title="Clear all data" description="Permanently delete local data" onClick={() => setShowClearConfirm(true)} isLast />
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Creator</h3>
        <Card className="p-5 overflow-hidden">
          <div className="flex items-start gap-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.05, rotate: -3 }}
            >
              <span className="text-2xl font-bold text-primary">JK</span>
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">Jainam Karnawat</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Designer & Developer</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Building tools that help students work with intention and clarity.
              </p>
              <a
                href="https://instagram.com/thats.jainam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-xs text-muted-foreground hover:text-foreground"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>@thats.jainam</span>
              </a>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">About</h3>
        <Card className="p-0 overflow-hidden">
          <SettingRow icon={<User className="w-4 h-4" />} title="Help & support" description="Reach out on Instagram" onClick={() => window.open('https://instagram.com/thats.jainam', '_blank', 'noopener')} />
          <SettingRow icon={<Sparkles className="w-4 h-4" />} title="Version" description="1.0.0" isLast />
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="text-center py-6 bg-gradient-to-b from-card to-transparent border-border/50">
          <motion.div
            className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <h4 className="text-sm font-semibold text-foreground">Student OS</h4>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            Made with ♥ by Jainam
          </p>
        </Card>
      </motion.div>

      {showGoalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowGoalModal(false)}
          role="dialog" aria-modal="true" aria-label="Set academic goal"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border shadow-2xl p-6"
          >
            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Academic goal</h3>
              <p className="text-sm text-muted-foreground mt-0.5">What are you working toward?</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setGoalInput(preset); setGoalMode('preset'); setCustomGoalInput('') }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border',
                    goalMode === 'preset' && goalInput === preset
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            <button
              onClick={() => setGoalMode('custom')}
              className={cn(
                'w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border mb-3',
                goalMode === 'custom'
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              Custom goal
            </button>

            <AnimatePresence>
              {goalMode === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="e.g. IIT Bombay"
                    maxLength={100}
                    autoComplete="off"
                    className="w-full mb-3 px-4 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label="Custom academic goal"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-muted-foreground/50 text-center mb-4">
              Your goal will be shown on every startup.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowGoalModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => {
                const finalGoal = goalMode === 'custom' ? customGoalInput.trim() : goalInput
                if (finalGoal) setAcademicGoal(finalGoal.slice(0, 100))
                setShowGoalModal(false)
              }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
          role="alertdialog" aria-modal="true" aria-label="Confirm reset onboarding"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6 text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">Reset onboarding?</h3>
             <p className="text-sm text-muted-foreground mb-5">You&apos;ll see the welcome screen again on next load. Your data is preserved.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleResetOnboarding} className="flex-1">Reset</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAvatarPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAvatarPicker(false)}
          role="dialog" aria-modal="true" aria-label="Choose avatar"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Choose avatar</h3>
                <p className="text-sm text-muted-foreground">Pick your study persona</p>
              </div>
              <motion.button
                onClick={() => setShowAvatarPicker(false)}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {AVATAR_CATEGORIES.map((cat) => {
                const isActive = avatar === cat.id
                const SvgComponent = cat.component
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => { setAvatar(cat.id); setShowAvatarPicker(false) }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 border',
                      isActive
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:bg-secondary/60'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center',
                      cat.gradient
                    )}
                      style={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                      <SvgComponent size={40} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-foreground' : 'text-foreground/80'
                      )}>{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground/60">Student persona</p>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-2 h-2 rounded-full bg-primary shrink-0"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDailyGoalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDailyGoalModal(false)}
          role="dialog" aria-modal="true" aria-label="Set daily goal"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6"
          >
            <h3 className="text-base font-semibold mb-1 text-foreground">Daily focus goal</h3>
            <p className="text-sm text-muted-foreground mb-5">How many minutes per day?</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={15}
                max={600}
                step={5}
                value={dailyGoalInput}
                onChange={(e) => setDailyGoalInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border-0 text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Daily goal in minutes"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" onClick={() => setShowDailyGoalModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => { const v = parseInt(dailyGoalInput); if (v >= 15 && v <= 600) { setDailyGoal(v); setShowDailyGoalModal(false) } }} className="flex-1">Save</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showClearConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
          role="alertdialog" aria-modal="true" aria-label="Confirm clear data"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-6 text-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">Clear all data?</h3>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowClearConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="destructive" onClick={handleClearData} className="flex-1">Delete everything</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  )
}

function ThemeButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors text-sm', active ? 'bg-secondary text-foreground' : 'hover:bg-secondary/50 text-muted-foreground')}
    >
      {icon}<span>{label}</span>
    </motion.button>
  )
}

function SettingRow({ icon, title, description, isLast, onClick }: {
  icon: React.ReactNode; title: string; description?: string; isLast?: boolean; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn('flex items-center gap-3 p-4 text-left', onClick ? 'cursor-pointer hover:bg-secondary/50 transition-colors' : '', !isLast && 'border-b border-border')}
      role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </div>
  )
}
