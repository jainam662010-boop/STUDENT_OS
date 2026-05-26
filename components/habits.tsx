'use client'

import { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Habit } from '@/lib/store'
import { staggerContainer, staggerItem, spring, listItemPop } from './motion'
import { Card } from './ui/glass-card'
import { Modal } from './modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/toast'
import { format, subDays, isToday } from 'date-fns'
import {
  Plus, Flame, Trophy, Target, CheckCircle2, X, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const HABIT_ICONS = ['📚', '🏃', '📝', '💪', '🧘', '💤', '🍎', '💧', '🎯', '⏰', '🧠', '📖']

export function HabitTracking() {
  const habits = useStore((s) => s.habits)
  const addHabit = useStore((s) => s.addHabit)
  const toggleHabitDay = useStore((s) => s.toggleHabitDay)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const progressBestStreak = useStore((s) => s.progress.bestStreak)
  const { showToast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const completedToday = useMemo(() => {
    let count = 0
    for (let i = 0; i < habits.length; i++) {
      if (habits[i].completedDates.includes(today)) count++
    }
    return count
  }, [habits, today])
  const totalStreak = useMemo(() => {
    let sum = 0
    for (let i = 0; i < habits.length; i++) sum += habits[i].streak
    return sum
  }, [habits])
  const completionRate = useMemo(() => habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0, [habits, completedToday])

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return { date, dateStr: format(date, 'yyyy-MM-dd'), day: format(date, 'EEE'), dayNum: format(date, 'd'), isToday: isToday(date) }
  }), [])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={staggerItem} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground">Build consistency</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add habit
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMini icon={<CheckCircle2 className="w-4 h-4" />} value={`${completedToday}/${habits.length}`} label="Completed today" color="success" />
        <StatMini icon={<Flame className="w-4 h-4" />} value={totalStreak.toString()} label="Total streaks" color="warning" />
        <StatMini icon={<Target className="w-4 h-4" />} value={`${completionRate}%`} label="Today&apos;s rate" color="primary" />
        <StatMini icon={<Trophy className="w-4 h-4" />} value={`${progressBestStreak}`} label="Best streak" color="accent" />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">This week</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {last7Days.map((day) => (
              <motion.div
                key={day.dateStr}
                whileHover={{ scale: 1.02 }}
                className={cn('text-center p-2 rounded-xl transition-colors', day.isToday && 'bg-secondary')}
              >
                <p className="text-xs text-muted-foreground">{day.day}</p>
                <p className={cn('text-sm font-medium mt-0.5', day.isToday && 'text-primary')}>{day.dayNum}</p>
                <div className="flex justify-center gap-0.5 mt-1.5">
                  {habits.slice(0, 3).map((habit) => (
                    <div key={habit.id} className={cn('w-1.5 h-1.5 rounded-full', habit.completedDates.includes(day.dateStr) ? 'bg-success' : 'bg-border')} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Your habits</h3>
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} days={last7Days}
              onToggle={(date) => {
                const wasCompleted = habit.completedDates.includes(date)
                toggleHabitDay(habit.id, date)
                if (!wasCompleted) {
                  showToast({ type: 'streak', title: `${habit.streak + 1} day streak!`, description: `"${habit.name}" completed` })
                }
              }}
              onDelete={() => deleteHabit(habit.id)} />
          ))}
        </AnimatePresence>
        {habits.length === 0 && (
          <EmptyHabits onAdd={() => setShowAddModal(true)} />
        )}
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddHabitModal onClose={() => setShowAddModal(false)}
            onAdd={(habit) => { addHabit(habit); setShowAddModal(false) }} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatMini({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <Card className="p-4">
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
        color === 'success' && 'bg-success/10',
        color === 'warning' && 'bg-chart-5/10',
        color === 'primary' && 'bg-primary/10',
        color === 'accent' && 'bg-chart-4/10',
      )}>
        <span className={cn(
          color === 'success' && 'text-success',
          color === 'warning' && 'text-chart-5',
          color === 'primary' && 'text-primary',
          color === 'accent' && 'text-chart-4',
        )}>{icon}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}

function EmptyHabits({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-14 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-5 h-5 text-primary/30" />
      </div>
      <p className="text-sm text-foreground/70 font-medium">Small daily steps lead to big results.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">No habits tracked yet.</p>
      <button onClick={onAdd} className="mt-3 px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">Create your first habit</button>
    </motion.div>
  )
}

const HabitCard = memo(function HabitCard({ habit, days, onToggle, onDelete }: {
  habit: Habit; days: { dateStr: string; day: string; isToday: boolean }[]; onToggle: (d: string) => void; onDelete: () => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const isCompletedToday = habit.completedDates.includes(today)
  return (
    <motion.div
      variants={listItemPop}
      layout
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => onToggle(today)}
            whileTap={{ scale: 0.9 }}
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors shrink-0', isCompletedToday ? 'bg-success/20' : 'bg-secondary hover:bg-secondary/80')}
          >
            <motion.span
              animate={isCompletedToday ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {habit.icon}
            </motion.span>
          </motion.button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{habit.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Flame className="w-3 h-3 text-chart-5" />
              <motion.span
                key={habit.streak}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring.snappy}
              >
                {habit.streak} day streak
              </motion.span>
              {habit.bestStreak > 0 && (<><span>·</span><span>Best: {habit.bestStreak}</span></>)}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-1">
            {days.map((day) => {
              const isCompleted = habit.completedDates.includes(day.dateStr)
              return (
                <motion.button
                  key={day.dateStr}
                  onClick={() => onToggle(day.dateStr)}
                  whileTap={{ scale: 0.9 }}
                  className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-colors', isCompleted ? 'bg-success text-success-foreground' : day.isToday ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}
                >
                  {day.day.charAt(0)}
                </motion.button>
              )
            })}
          </div>
          <motion.button
            onClick={onDelete}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity"
            aria-label={`Delete "${habit.name}"`}
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        <div className="lg:hidden mt-3 flex justify-between">
          {days.map((day) => {
            const isCompleted = habit.completedDates.includes(day.dateStr)
            return (
              <motion.button
                key={day.dateStr}
                onClick={() => onToggle(day.dateStr)}
                whileTap={{ scale: 0.9 }}
                className={cn('w-9 h-9 rounded-xl flex flex-col items-center justify-center text-xs transition-colors', isCompleted ? 'bg-success text-success-foreground' : day.isToday ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}
              >
                <span>{day.day.charAt(0)}</span>
                {isCompleted && <CheckCircle2 className="w-2 h-2 mt-0.5" />}
              </motion.button>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
})

function AddHabitModal({ onClose, onAdd }: { onClose: () => void; onAdd: (h: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'bestStreak' | 'createdAt'>) => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(HABIT_ICONS[0])
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), icon, color: 'blue', frequency })
  }

  return (
    <Modal open onClose={onClose} title="New habit">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="habit-name" label="Habit name" type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning meditation" autoFocus maxLength={100} />
        <div>
          <label className="text-sm font-medium mb-1.5 block">Icon</label>
          <div className="grid grid-cols-6 gap-1.5">
            {HABIT_ICONS.map((i) => (
              <motion.button
                key={i} type="button" onClick={() => setIcon(i)}
                whileTap={{ scale: 0.9 }}
                className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors', icon === i ? 'bg-secondary ring-1 ring-ring' : 'bg-secondary/50 hover:bg-secondary')}
              >
                {i}
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Frequency</label>
          <div className="flex gap-2">
            {(['daily', 'weekly'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-medium transition-colors', frequency === f ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!name.trim()} className="flex-1">Create habit</Button>
        </div>
      </form>
    </Modal>
  )
}
