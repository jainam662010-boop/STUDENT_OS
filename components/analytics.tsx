'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { staggerContainer, staggerItem } from './motion'
import { Card } from './ui/glass-card'
import { useDeferredRender } from '@/hooks/use-deferred-effect'
import { format, subDays, isSameDay, eachDayOfInterval } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import {
  Clock, Target, TrendingUp, TrendingDown, Flame, CheckCircle2,
  Brain, Sun, Award, BarChart3, Activity, Star, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const SUBJECT_KEYWORDS: Record<string, string> = {
  physics: 'Physics', mathematics: 'Mathematics', math: 'Mathematics',
  chemistry: 'Chemistry', biology: 'Biology', english: 'English',
  history: 'History', computer: 'Computer Science',
}

function inferSubject(title: string, subject?: string | null): string {
  if (subject) return subject
  const lower = title.toLowerCase()
  for (const [key, value] of Object.entries(SUBJECT_KEYWORDS)) { if (lower.includes(key)) return value }
  return 'Other'
}

export function Analytics() {
  const progress = useStore((s) => s.progress)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const focusSessions = useStore((s) => s.focusSessions)
  // Use requestIdleCallback via useDeferredRender for chart data
  const chartsReady = useDeferredRender(100)

  const now = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => format(now, 'yyyy-MM-dd'), [now])

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i))
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayFocus = focusSessions.reduce((acc, s) => {
        if (s.endTime && format(new Date(s.endTime), 'yyyy-MM-dd') === dateStr) return acc + s.duration
        return acc
      }, 0)
      const dayTasks = tasks.reduce((acc, t) => {
        if (t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr) return acc + 1
        return acc
      }, 0)
      const dayHabits = habits.reduce((acc, h) => {
        if (h.completedDates.includes(dateStr)) return acc + 1
        return acc
      }, 0)
      return { day: format(date, 'EEE'), date: format(date, 'MMM d'), focus: dayFocus, tasks: dayTasks, habits: dayHabits }
    })
  }, [focusSessions, tasks, habits, now])

  const subjectData = useMemo(() => {
    const subjectHours: Record<string, number> = {}
    for (let i = 0; i < focusSessions.length; i++) {
      const s = focusSessions[i]
      if (!s.endTime) continue
      const subject = inferSubject(s.subject || '')
      subjectHours[subject] = (subjectHours[subject] || 0) + s.duration
    }
    const entries = Object.entries(subjectHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, hours], i) => ({
        name,
        hours: Math.round((hours / 60) * 10) / 10,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    return entries.length > 0 ? entries : [{ name: 'No data yet', hours: 1, color: 'var(--muted-foreground)' }]
  }, [focusSessions])

  const productivityData = useMemo(() => {
    const hourly: Record<number, { sum: number; count: number }> = {}
    for (let i = 0; i < focusSessions.length; i++) {
      const s = focusSessions[i]
      if (!s.endTime) continue
      const hour = new Date(s.startTime).getHours()
      if (!hourly[hour]) hourly[hour] = { sum: 0, count: 0 }
      hourly[hour].sum += s.duration
      hourly[hour].count++
    }
    const result = new Array(24)
    for (let i = 0; i < 24; i++) {
      const h = hourly[i]
      result[i] = {
        hour: `${i}:00`,
        productivity: h ? Math.round((h.sum / h.count) * 2) : 0,
      }
    }
    return result
  }, [focusSessions])

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    tasks.forEach((t) => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
    return [
      { name: 'High', value: counts.high, color: 'var(--chart-5)' },
      { name: 'Medium', value: counts.medium, color: 'var(--chart-1)' },
      { name: 'Low', value: counts.low, color: 'var(--chart-2)' },
    ].filter((d) => d.value > 0)
  }, [tasks])

  const habitHeatmap = useMemo(() => {
    const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
    const result: { date: string; day: number; count: number }[] = new Array(last30.length)
    for (let i = 0; i < last30.length; i++) {
      const date = last30[i]
      const str = format(date, 'yyyy-MM-dd')
      let count = 0
      for (let j = 0; j < habits.length; j++) {
        if (habits[j].completedDates.includes(str)) count++
      }
      result[i] = { date: str, day: date.getDay(), count }
    }
    return result
  }, [habits])

  const xpGrowth = useMemo(() => {
    const sessions: { endTime: Date; duration: number }[] = []
    for (let i = 0; i < focusSessions.length; i++) {
      const s = focusSessions[i]
      if (s.endTime) sessions.push({ endTime: s.endTime, duration: s.duration })
    }
    sessions.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
    const maxPoints = Math.min(sessions.length, 20)
    const points = new Array(maxPoints)
    let cumulative = 0
    for (let i = 0; i < maxPoints; i++) {
      cumulative += Math.floor(sessions[i].duration * 2)
      points[i] = { session: `#${i + 1}`, xp: cumulative }
    }
    return points
  }, [focusSessions])

  const peakProductivityHour = useMemo(() => {
    let bestHour = -1, bestMin = -1
    for (let i = 0; i < focusSessions.length; i++) {
      const s = focusSessions[i]
      if (!s.endTime) continue
      const hour = new Date(s.startTime).getHours()
      if (s.duration > bestMin) {
        bestMin = s.duration
        bestHour = hour
      }
    }
    return bestHour >= 0
      ? { hour: bestHour, label: bestHour >= 12 ? 'PM' : 'AM', total: Math.round(bestMin / 60 * 10) / 10 }
      : null
  }, [focusSessions])

  const stats = useMemo(() => {
    const totalFocusThisWeek = weeklyData.reduce((acc, d) => acc + d.focus, 0)
    const avgFocusPerDay = weeklyData.length > 0 ? Math.round(totalFocusThisWeek / weeklyData.length) : 0
    let totalTasksDone = 0, highPriorityDone = 0, taskCount = 0
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      taskCount++
      if (t.status === 'done') {
        totalTasksDone++
        if (t.priority === 'high') highPriorityDone++
      }
    }
    const taskCompletionRate = taskCount > 0 ? Math.round((totalTasksDone / taskCount) * 100) : 0
    const sevenDaysAgo = subDays(new Date(), 7)
    const thirteenDaysAgo = subDays(new Date(), 13)
    let lastWeekFocus = 0
    let completedSessions = 0, partialSessions = 0
    let scoredCount = 0, scoredSum = 0
    let targetCount = 0, targetSum = 0
    for (let i = 0; i < focusSessions.length; i++) {
      const s = focusSessions[i]
      if (!s.endTime) continue
      const endDate = new Date(s.endTime)
      if (isSameDay(endDate, sevenDaysAgo)) lastWeekFocus += s.duration
      if (s.interrupted) partialSessions++
      else completedSessions++
      if (s.focusScore !== undefined) {
        scoredSum += s.focusScore
        scoredCount++
      }
      if (s.targetDuration > 0) {
        targetSum += s.targetDuration
        targetCount++
      }
    }
    const focusTrend = lastWeekFocus > 0 ? Math.round(((totalFocusThisWeek - lastWeekFocus) / lastWeekFocus) * 100) : totalFocusThisWeek > 0 ? 100 : 0
    const totalSessions = completedSessions + partialSessions
    const focusCompletionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    const avgFocusScore = scoredCount > 0 ? Math.round(scoredSum / scoredCount) : 0
    const avgTargetDuration = targetCount > 0 ? Math.round(targetSum / targetCount) : 0
    let lastWeekTasks = 0
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      if (t.completedAt && new Date(t.completedAt) >= thirteenDaysAgo) lastWeekTasks++
    }
    const taskTrend = lastWeekTasks > 0 ? Math.round(((totalTasksDone - lastWeekTasks) / lastWeekTasks) * 100) : totalTasksDone > 0 ? 100 : 0
    let activeHabits = 0, totalHabitDates = 0
    for (let i = 0; i < habits.length; i++) {
      const h = habits[i]
      if (h.completedDates.length > 0) {
        activeHabits++
        totalHabitDates += h.completedDates.length
      }
    }
    const habitConsistency = activeHabits > 0 ? Math.round((totalHabitDates / (activeHabits * 7)) * 100) : 0
    return { totalFocusThisWeek, avgFocusPerDay, totalTasksDone, taskCompletionRate, focusTrend, taskTrend, activeHabits, habitConsistency, highPriorityDone, completedSessions, partialSessions, totalSessions, focusCompletionRate, avgFocusScore, avgTargetDuration }
  }, [weeklyData, tasks, focusSessions, habits])

  if (!chartsReady) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={staggerItem}>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your progress</p>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AnalyticsStat icon={<Clock className="w-4 h-4" />} label="Weekly focus" value={`${Math.floor(stats.totalFocusThisWeek / 60)}h ${stats.totalFocusThisWeek % 60}m`} trend={stats.focusTrend} />
        <AnalyticsStat icon={<CheckCircle2 className="w-4 h-4" />} label="Tasks completed" value={stats.totalTasksDone.toString()} trend={stats.taskTrend} />
        <AnalyticsStat icon={<Star className="w-4 h-4" />} label="Focus score" value={stats.avgFocusScore > 0 ? `${stats.avgFocusScore}/100` : '—'} />
        <AnalyticsStat icon={<Flame className="w-4 h-4" />} label="Best streak" value={`${progress.bestStreak} days`} />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Weekly focus time</h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="day" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} tickFormatter={(v: number) => `${Math.floor(v / 60)}h`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem', boxShadow: 'var(--shadow-lg)' }}
                    formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}m`, 'Focus']} />
                  <Bar dataKey="focus" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={600} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Subject distribution</h3>
              <span className="text-xs text-muted-foreground">All time</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subjectData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="hours"
                      animationBegin={200} animationDuration={800} animationEasing="ease-out">
                      {subjectData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                      formatter={(value: number) => [`${value}h`, 'Time']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {subjectData.map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm text-foreground">{subject.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{subject.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Activity trends</h3>
              <span className="text-xs text-muted-foreground">Tasks & habits</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="day" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  <Line type="monotone" dataKey="tasks" stroke="var(--chart-2)" strokeWidth={1.5} dot={{ fill: 'var(--chart-2)', r: 3 }} name="Tasks"
                    animationDuration={600} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="habits" stroke="var(--chart-4)" strokeWidth={1.5} dot={{ fill: 'var(--chart-4)', r: 3 }} name="Habits"
                    animationDuration={600} animationEasing="ease-out" animationBegin={150} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Productivity patterns</h3>
              <span className="text-xs text-muted-foreground">Avg by hour</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="prodGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                  <XAxis dataKey="hour" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} interval={3} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Productivity']} />
                  <Area type="monotone" dataKey="productivity" stroke="var(--primary)" strokeWidth={1.5} fill="url(#prodGradAnalytics)"
                    animationDuration={700} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Task priority mix</h3>
              <span className="text-xs text-muted-foreground">Distribution</span>
            </div>
            {priorityData.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value"
                      animationBegin={200} animationDuration={800} animationEasing="ease-out">
                      {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No task data yet</div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">XP growth</h3>
              <span className="text-xs text-muted-foreground">Cumulative</span>
            </div>
            {xpGrowth.length > 1 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpGrowth}>
                    <defs>
                      <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeWidth={0.5} />
                    <XAxis dataKey="session" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} interval="preserveStartEnd" />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                      formatter={(value: number) => [`${value} XP`, 'Total']} />
                    <Area type="monotone" dataKey="xp" stroke="var(--chart-3)" strokeWidth={1.5} fill="url(#xpGrad)"
                      animationDuration={700} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">Complete focus sessions to see growth</div>
            )}
          </Card>
        </motion.div>
      </div>

      {habitHeatmap.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Habit consistency</h3>
              <span className="text-xs text-muted-foreground">Last 30 days</span>
            </div>
            <div className="flex flex-wrap gap-0.5">
              {habitHeatmap.map((day) => {
                const intensity = Math.min(day.count / Math.max(...habitHeatmap.map((d) => d.count), 1), 1)
                return (
                  <div
                    key={day.date}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: day.count > 0
                        ? `color-mix(in srgb, var(--chart-2) ${intensity * 100}%, var(--secondary))`
                        : 'var(--secondary)',
                    }}
                    title={`${day.date}: ${day.count} habits completed`}
                  />
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <Card className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Insights
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {peakProductivityHour && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Sun className="w-3.5 h-3.5 text-chart-3" />
                  Peak productivity
                </div>
                <p className="text-xs text-muted-foreground">
                  You focus best around <strong className="text-foreground">{peakProductivityHour.hour}:00 {peakProductivityHour.label}</strong>
                  {' '}({peakProductivityHour.total}h total). Schedule deep work here.
                </p>
              </div>
            )}
            {stats.habitConsistency > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Activity className="w-3.5 h-3.5 text-chart-2" />
                  Habit score
                </div>
                <p className="text-xs text-muted-foreground">
                  Habit consistency is at <strong className="text-foreground">{Math.min(stats.habitConsistency, 100)}%</strong>
                  {' '}with {stats.activeHabits} active habits. {stats.habitConsistency >= 70 ? 'Great momentum!' : stats.habitConsistency >= 40 ? 'Building consistency!' : 'Start small to build streaks.'}
                </p>
              </div>
            )}
            {stats.highPriorityDone > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Award className="w-3.5 h-3.5 text-chart-5" />
                  Impact score
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed <strong className="text-foreground">{stats.highPriorityDone}</strong> high-priority tasks. Prioritizing what matters.
                </p>
              </div>
            )}
            {stats.taskCompletionRate > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-chart-4" />
                  Task completion rate
                </div>
                <p className="text-xs text-muted-foreground">
                  Task completion at <strong className="text-foreground">{stats.taskCompletionRate}%</strong>
                  {stats.taskCompletionRate >= 80 ? ' Excellent! Keep it up.' : stats.taskCompletionRate >= 50 ? ' On the right track.' : ' Try breaking tasks into smaller steps.'}
                </p>
              </div>
            )}
            {stats.totalSessions > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Clock className="w-3.5 h-3.5 text-chart-5" />
                  Session consistency
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{stats.completedSessions}</strong> completed,{' '}
                  <strong className="text-foreground">{stats.partialSessions}</strong> partial sessions
                  {' — '}{stats.focusCompletionRate >= 70 ? 'strong follow-through!' : stats.focusCompletionRate >= 40 ? 'building consistency.' : 'every minute still counts.'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {stats.focusTrend !== 0 && (
        <motion.div variants={staggerItem}>
          <div className={cn(
            'p-4 rounded-xl border',
            stats.focusTrend > 0 ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'
          )}>
            <div className="flex items-center gap-2">
              {stats.focusTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-warning" />
              )}
              <h4 className="text-sm font-medium text-foreground">
                {stats.focusTrend > 0 ? 'Focus time trending up' : 'Focus time trending down'}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              {stats.focusTrend > 0
                ? `Focus time is ${stats.focusTrend}% higher than last week.`
                : `Focus time is ${Math.abs(stats.focusTrend)}% lower than last week.`
              }
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function AnalyticsStat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={cn('flex items-center text-xs', trend >= 0 ? 'text-success' : 'text-destructive')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </Card>
  )
}
