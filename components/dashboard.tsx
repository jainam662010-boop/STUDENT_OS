'use client'

import { useMemo, memo, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem, spring } from './motion'
import { Badge } from './ui/badge'
import { QuoteDisplay } from './ui/quote-display'
import { format, isToday, startOfWeek, addDays, isSameDay, subDays } from 'date-fns'
import { generateInsights, generateDailyMessage } from '@/lib/insights'
import {
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Zap,
  Heart,
  ArrowRight,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileAvatar } from './profile-avatar'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const userName = useStore((s) => s.userName)
  const progress = useStore((s) => s.progress)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focusSessions = useStore((s) => s.focusSessions)
  const setActiveView = useStore((s) => s.setActiveView)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const studyStyle = useStore((s) => s.studyStyle)

  const [showGoalCelebration, setShowGoalCelebration] = useState(false)
  const [prevGoalMet, setPrevGoalMet] = useState(false)

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && task.dueDate && isToday(new Date(task.dueDate))),
    [tasks]
  )

  const completedToday = useMemo(
    () => tasks.filter((task) => task.completedAt && isToday(new Date(task.completedAt))).length,
    [tasks]
  )

  const todayFocusTime = useMemo(
    () => focusSessions
      .filter((s) => s.endTime && isToday(new Date(s.endTime)))
      .reduce((acc, s) => acc + s.duration, 0),
    [focusSessions]
  )

  const weeklyGoalProgress = useMemo(
    () => Math.min((progress.weeklyProgress / progress.weeklyGoal) * 100, 100),
    [progress.weeklyProgress, progress.weeklyGoal]
  )

  const heatmapData = useMemo(() => {
    const today = new Date()
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i))
    const dayMinutes = days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return focusSessions
        .filter((s) => s.endTime && format(new Date(s.startTime), 'yyyy-MM-dd') === dateStr)
        .reduce((acc, s) => acc + s.duration, 0)
    })
    const maxMinutes = Math.max(...dayMinutes, 1)
    return days.map((date, i) => ({
      date, day: format(date, 'EEE'),
      intensity: dayMinutes[i] / maxMinutes,
      minutes: dayMinutes[i],
    }))
  }, [focusSessions])

  const focusPercentChange = useMemo(() => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    const lastWeekStart = addDays(thisWeekStart, -7)
    const thisWeekMinutes = focusSessions
      .filter((s) => s.endTime && new Date(s.endTime) >= thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
    const lastWeekMinutes = focusSessions
      .filter((s) => s.endTime && new Date(s.endTime) >= lastWeekStart && new Date(s.endTime) < thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
    if (lastWeekMinutes === 0) return thisWeekMinutes > 0 ? '+100%' : null
    const change = Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
    return change >= 0 ? `+${change}%` : `${change}%`
  }, [focusSessions])

  const completedHabitsToday = useMemo(
    () => habits.filter((h) => h.completedDates.includes(format(new Date(), 'yyyy-MM-dd'))).length,
    [habits]
  )

  const weekFocusTime = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return focusSessions
      .filter((s) => s.endTime && new Date(s.endTime) >= thisWeekStart)
      .reduce((acc, s) => acc + s.duration, 0)
  }, [focusSessions])

  const tasksCompletedThisWeek = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return tasks.filter((task) => {
      if (!task.completedAt) return false
      return new Date(task.completedAt) >= thisWeekStart
    }).length
  }, [tasks])

  const insights = useMemo(() => generateInsights(focusSessions, tasks, habits).slice(0, 3), [focusSessions, tasks, habits])

  const dailyMessage = useMemo(
    () => generateDailyMessage(studyStyle, progress.currentStreak, todayFocusTime, dailyGoal),
    [studyStyle, progress.currentStreak, todayFocusTime, dailyGoal]
  )

  useEffect(() => {
    const met = todayFocusTime >= dailyGoal && dailyGoal > 0
    if (met && !prevGoalMet) {
      setShowGoalCelebration(true)
      setTimeout(() => setShowGoalCelebration(false), 4000)
    }
    setPrevGoalMet(met)
  }, [todayFocusTime, dailyGoal, prevGoalMet])

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3">
          <ProfileAvatar size="md" />
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
        </div>
        <div className="mt-3">
          <QuoteDisplay />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{dailyMessage}</p>
      </motion.div>

      <AnimatePresence>
        {showGoalCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={spring.bouncy}
            className="p-3 rounded-2xl bg-success/10 border border-success/20 text-sm text-center"
          >
            <span className="font-medium text-success">🎉 Daily goal achieved!</span>
            <span className="text-muted-foreground ml-1.5">{dailyGoal} min — you showed up.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Focus today"
          value={`${Math.floor(todayFocusTime / 60)}h ${todayFocusTime % 60}m`}
          trend={focusPercentChange}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Tasks done"
          value={`${completedToday}/${tasks.length}`}
          color="success"
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={`${progress.currentStreak} days`}
          color="warning"
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="Weekly goal"
          value={`${Math.round(weeklyGoalProgress)}%`}
          color="primary"
        />
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Focus flow</h3>
              <p className="text-xl font-semibold text-foreground mt-0.5">
                {Math.floor(todayFocusTime / 60)}h{' '}
                <span className="text-sm font-normal text-muted-foreground">/ {Math.floor(dailyGoal / 60)}h today</span>
              </p>
              <div className="mt-1.5 w-32 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todayFocusTime / dailyGoal) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Daily</span>
          </div>
          <div className="h-36 w-full">
            <div className="flex items-end h-28 gap-1.5 mb-1">
              {heatmapData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 self-end">
                  <motion.div
                    className={cn(
                      'w-full rounded-t-md',
                      d.intensity > 0.7 ? 'bg-primary' : d.intensity > 0.3 ? 'bg-primary/60' : d.intensity > 0 ? 'bg-primary/30' : 'bg-secondary'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(d.intensity * 100, 4)}%` }}
                    transition={{ delay: i * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ minHeight: d.minutes > 0 ? '4px' : '2px' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {heatmapData.map((d, i) => (
                <span key={i} className={cn('text-[10px]', d.intensity > 0 ? 'text-muted-foreground' : 'text-muted-foreground/40')}>
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 glass-card p-5 flex flex-col items-center justify-center text-center">
          <motion.div
            className="relative w-16 h-16 mb-3"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={176}
                strokeDashoffset={176 - (Math.min(progress.currentStreak / 30, 1) * 176)}
                className="text-primary" strokeLinecap="round"
                animate={{ strokeDashoffset: 176 - (Math.min(progress.currentStreak / 30, 1) * 176) }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame className="w-6 h-6 text-primary" fill="currentColor" />
            </motion.div>
          </motion.div>
          <motion.p
            key={progress.currentStreak}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.snappy}
            className="text-2xl font-bold text-foreground"
          >
            {progress.currentStreak}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-0.5">Day streak</p>
          <div className="mt-3 w-full card-flat px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">XP</span>
              <span className="font-medium text-foreground">{progress.xp.toLocaleString()}</span>
            </div>
            <div className="w-full bg-border h-1 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.xp % 1000) / 10}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {1000 - (progress.xp % 1000)} XP to level {progress.level + 1}
            </p>
          </div>
        </div>

        <StudyStatsCard
          weekFocusTime={weekFocusTime}
          todayFocusTime={todayFocusTime}
          tasksCompletedThisWeek={tasksCompletedThisWeek}
          completedToday={completedToday}
          completedHabitsToday={completedHabitsToday}
          habitsCount={habits.length}
          currentStreak={progress.currentStreak}
        />

        <div className="md:col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Focus queue</h3>
            <button onClick={() => setActiveView('tasks')} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {todaysTasks.length > 0 ? (
              todaysTasks.slice(0, 4).map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} />
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-primary/40" />
                </div>
                <p className="text-sm text-foreground/70 font-medium">A clear workspace creates a clear mind.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">No tasks due today.</p>
                <button onClick={() => setActiveView('tasks')} className="mt-3 text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Create a task <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-12 glass-card p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-base font-medium text-foreground">Ready to focus?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Start a deep work session to build momentum.</p>
          </div>
          <motion.button
            onClick={() => setActiveView('focus')}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Zap className="w-4 h-4" />
            Start focus session
          </motion.button>
        </div>

        {insights.length > 0 && (
          <motion.div variants={staggerItem} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Insights</h3>
            </div>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, ...spring.snappy }}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
                  <p className="text-foreground/80">{insight.message}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="lg:hidden text-center pt-2">
        <a
          href="https://instagram.com/thats.jainam"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          aria-label="Built by Jainam Karnawat"
        >
          <Heart className="w-2.5 h-2.5" />
          <span>Built by Jainam</span>
        </a>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ icon, label, value, trend, color }: {
  icon: React.ReactNode; label: string; value: string; trend?: string | null; color?: string
}) {
  return (
    <motion.div
      className="glass-card-subtle p-4"
      whileHover={{ y: -2 }}
      transition={spring.snappy}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn(
          'text-muted-foreground',
          color === 'success' && 'text-success',
          color === 'warning' && 'text-chart-5',
          color === 'primary' && 'text-primary',
        )}>
          {icon}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        {trend && (
          <span className="flex items-center text-xs text-success">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  )
}

const StudyStatsCard = memo(function StudyStatsCard({
  weekFocusTime, todayFocusTime, tasksCompletedThisWeek, completedToday,
  completedHabitsToday, habitsCount, currentStreak
}: {
  weekFocusTime: number; todayFocusTime: number; tasksCompletedThisWeek: number; completedToday: number;
  completedHabitsToday: number; habitsCount: number; currentStreak: number
}) {
  const completedSessions = useStore((s) => s.focusSessions.filter((fs) => fs.endTime && !fs.interrupted).length)
  const partialSessions = useStore((s) => s.focusSessions.filter((fs) => fs.interrupted).length)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const totalSessions = completedSessions + partialSessions
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return (
    <div className="md:col-span-5 glass-card p-5 border-l-2 border-l-primary/30">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">This week</h3>
      </div>
      <div className="space-y-4">
        <StatBlock
          main={`${Math.floor(weekFocusTime / 60)}h ${weekFocusTime % 60}m focused`}
          sub={`${todayFocusTime}m of ${dailyGoal}m daily goal`}
        />
        <StatBlock
          main={`${tasksCompletedThisWeek} tasks completed`}
          sub={`${completedToday} done today`}
        />
        <StatBlock
          main={habitsCount > 0 ? `${completedHabitsToday}/${habitsCount} habits done today` : 'No habits tracked yet'}
          sub={`${currentStreak} day streak`}
        />
        {totalSessions > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Session completion</span>
              <span className="font-medium text-foreground">{completionRate}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-secondary mt-1 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-chart-2"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {partialSessions > 0 && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {partialSessions} partial {partialSessions === 1 ? 'session' : 'sessions'} — every minute counts
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

function StatBlock({ main, sub }: { main: string; sub: string }) {
  return (
    <div className="text-sm text-foreground/80">
      <p>{main}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  )
}

const TaskRow = memo(function TaskRow({ task, index }: { task: { id: string; title: string; subject?: string | null; priority: 'high' | 'medium' | 'low' }; index: number }) {
  const completeTask = useStore((s) => s.completeTask)
  const handleComplete = useCallback(() => completeTask(task.id), [completeTask, task.id])

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, ...spring.snappy }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors group"
    >
      <motion.button
        onClick={handleComplete}
        whileTap={{ scale: 0.8 }}
        className="shrink-0 w-4 h-4 rounded-full border border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors"
        aria-label={`Mark "${task.title}" as complete`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.title}</p>
        {task.subject && <p className="text-xs text-muted-foreground">{task.subject}</p>}
      </div>
      <Badge variant={task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low'}>
        {task.priority}
      </Badge>
    </motion.div>
  )
})
