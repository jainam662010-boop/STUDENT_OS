import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { format } from 'date-fns'
import { generateId } from './utils'
import { safeWrite, verifyWrite, getStorageStats, cleanupOldData } from './storage-quota'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}/
const STORAGE_KEY = 'student-os-storage-v3'
const MAX_SESSIONS = 10000
const MAX_TASKS = 5000
const MAX_HABITS = 500
const MAX_EVENTS = 2000
const MAX_XP = 100000000
const MAX_FOCUS_MINUTES = 1440
const QUOTA_WARN_THRESHOLD = 0.85

function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE_REGEX.test(value)
}

function reviveDates(key: string, value: unknown): unknown {
  if (isIsoDateString(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => reviveDates(String(index), item))
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = reviveDates(k, obj[k])
      }
    }
    return result
  }
  return value
}

// ─── Schema & Validation ─────────────────────────────────────────────

const CURRENT_SCHEMA_VERSION = 5

type PersistedSchema = {
  version: number
  state: Record<string, unknown>
}

function validatePersistedData(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>
  if (typeof obj.version !== 'number') return false
  if (!obj.state || typeof obj.state !== 'object') return false
  return true
}

function safeDeserialize(raw: string): PersistedSchema | null {
  try {
    const parsed = JSON.parse(raw)
    if (!validatePersistedData(parsed)) return null
    return parsed as PersistedSchema
  } catch {
    return null
  }
}

function sanitizeNumber(val: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
    return Math.min(Math.max(val, min), max)
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, min), max)
    }
  }
  return fallback
}

function sanitizeString(val: unknown, fallback: string, maxLength = 1000): string {
  if (typeof val === 'string') return val.slice(0, maxLength)
  return fallback
}

function sanitizeBoolean(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback
}

function sanitizeDate(val: unknown): Date | undefined {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    if (!Number.isNaN(d.getTime())) return d
  }
  return undefined
}

function migrateV1toV2(state: Record<string, unknown>): Record<string, unknown> {
  const s = { ...state }
  if (Array.isArray(s.tasks)) {
    s.tasks = (s.tasks as Record<string, unknown>[]).map((t) => {
      if (t.subtasks && Array.isArray(t.subtasks)) {
        return t
      }
      return { ...t, subtasks: [] }
    })
  }
  if (typeof s.weeklyGoal === 'number') {
    s.progress = {
      ...(s.progress as Record<string, unknown> || {}),
      weeklyGoal: s.weeklyGoal,
    }
    delete s.weeklyGoal
  }
  return reviveDates('', s) as Record<string, unknown>
}

const safeReviver = (key: string, value: unknown): unknown => {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return value
}

// Custom storage with quota protection
const createSafeStorage = () => {
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name: string, value: string) => {
      const result = safeWrite(name, value)
      if (!result.success) {
        console.error('Storage write failed:', result.error)
        // Emit custom event for UI to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('storage-quota-exceeded', {
              detail: { error: result.error, compacted: result.compacted },
            })
          )
        }
        throw new Error(result.error || 'Storage write failed')
      }
      // Verify write integrity
      if (!verifyWrite(name, value)) {
        console.error('Storage write verification failed')
        throw new Error('Storage verification failed')
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name)
      } catch {
        // Silent fail
      }
    },
  }
}

const storage = createJSONStorage(createSafeStorage, {
  reviver: safeReviver,
})

// ─── Types ────────────────────────────────────────────────────────────
export interface Task {
  id: string
  title: string
  description?: string
  subject?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'done'
  dueDate?: Date
  subtasks?: { id: string; title: string; done: boolean }[]
  tags?: string[]
  createdAt: Date
  completedAt?: Date
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  targetDays?: number[]
  completedDates: string[]
  streak: number
  bestStreak: number
  createdAt: Date
}

export interface FocusSession {
  id: string
  startTime: Date
  endTime?: Date
  duration: number
  targetDuration: number
  subject?: string
  type: 'pomodoro' | 'deep-work' | 'custom'
  completed: boolean
  interrupted: boolean
  energy?: number
  distractions?: number
  category?: string
  focusScore?: number
  reflection?: string
  pauseCount?: number
}

export interface StudyEvent {
  id: string
  title: string
  description?: string
  subject?: string
  startTime: Date
  endTime: Date
  type: 'study' | 'exam' | 'revision' | 'break'
  color?: string
}

export interface UserProgress {
  xp: number
  level: number
  totalFocusTime: number
  totalTasksCompleted: number
  currentStreak: number
  bestStreak: number
  weeklyGoal: number
  weeklyProgress: number
}

export interface FocusTimerPersistState {
  endTimestamp: number
  duration: number
  isRunning: boolean
  elapsedBeforePause: number
}

// Student OS Store
interface StudentOSState {
  // User
  userName: string
  setUserName: (name: string) => void
  onboardingComplete: boolean
  setOnboardingComplete: (complete: boolean) => void
  resetOnboarding: () => void
  avatar: string
  setAvatar: (avatar: string) => void

  // Theme
  theme: 'light' | 'dark' | 'amoled'
  setTheme: (theme: 'light' | 'dark' | 'amoled') => void

  // Progress
  progress: UserProgress
  addXP: (amount: number) => void
  updateProgress: (updates: Partial<UserProgress>) => void

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void

  // Habits
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak' | 'bestStreak' | 'createdAt'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleHabitDay: (id: string, date: string) => void

  // Focus Sessions
  focusSessions: FocusSession[]
  currentSession: FocusSession | null
  startFocusSession: (type: FocusSession['type'], subject?: string) => void
  endFocusSession: (actualDuration?: number, targetDuration?: number, interrupted?: boolean, quality?: { energy?: number; distractions?: number; category?: string; reflection?: string; pauseCount?: number }) => void
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void
  addSessionReflection: (sessionId: string, reflection: string) => void

  // Focus timer persistence
  focusTimerState: FocusTimerPersistState | null
  setFocusTimerState: (state: FocusTimerPersistState | null) => void

  // Calendar Events
  events: StudyEvent[]
  addEvent: (event: Omit<StudyEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<StudyEvent>) => void
  deleteEvent: (id: string) => void

  // Personalization
  studyStyle: 'deep-work' | 'consistent' | 'sprint' | 'night-owl'
  setStudyStyle: (style: 'deep-work' | 'consistent' | 'sprint' | 'night-owl') => void
  academicGoal: string
  setAcademicGoal: (goal: string) => void
  preferredFocusDuration: number
  setPreferredFocusDuration: (mins: number) => void
  reducedMotion: boolean
  setReducedMotion: (reduced: boolean) => void

  // Goals
  dailyGoal: number
  setDailyGoal: (goal: number) => void

  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Active view
  activeView: 'dashboard' | 'focus' | 'planner' | 'tasks' | 'habits' | 'analytics' | 'settings'
  setActiveView: (view: StudentOSState['activeView']) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

const calculateLevel = (xp: number) => {
  const safe = sanitizeNumber(xp, 0, 0, MAX_XP)
  return Math.floor(safe / 1000) + 1
}

const calculateStreak = (completedDates: string[]): number => {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0
  const sorted = [...completedDates].sort().reverse()
  let streak = 0
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  let expected = todayStr
  for (const dateStr of sorted) {
    if (typeof dateStr !== 'string') continue
    if (dateStr === expected) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = format(d, 'yyyy-MM-dd')
    } else if (dateStr < expected) {
      break
    }
  }
  return streak
}

const calculateBestStreak = (completedDates: string[]): number => {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0
  const sorted = [...completedDates].sort()
  let best = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
}

function validateTimerState(state: unknown): FocusTimerPersistState | null {
  if (!state || typeof state !== 'object') return null
  const s = state as Record<string, unknown>
  const endTimestamp = sanitizeNumber(s.endTimestamp, 0)
  const duration = sanitizeNumber(s.duration, 0, 0, 86400)
  const elapsedBeforePause = sanitizeNumber(s.elapsedBeforePause, 0, 0, duration)
  const isRunning = sanitizeBoolean(s.isRunning, false)
  if (endTimestamp <= 0 && !isRunning) return null
  return { endTimestamp, duration, isRunning, elapsedBeforePause }
}

function formatMinutes(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remainder = m % 60
  return remainder > 0 ? `${h}h ${remainder}m` : `${h}h`
}

function checkStorageQuota(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)

    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const val = localStorage.getItem(key)
        if (val) totalSize += key.length + val.length
      }
    }

    const estimatedQuota = 5 * 1024 * 1024
    return totalSize < estimatedQuota * QUOTA_WARN_THRESHOLD
  } catch {
    return false
  }
}

export const useStore = create<StudentOSState>()(
  persist(
    (set, get) => ({
      // User
      userName: 'Student',
      setUserName: (name) => set({ userName: sanitizeString(name, 'Student', 50) }),
      onboardingComplete: false,
      setOnboardingComplete: (complete) => set({ onboardingComplete: sanitizeBoolean(complete, false) }),
      resetOnboarding: () => set({ onboardingComplete: false, userName: 'Student', avatar: 'initials' }),
      avatar: 'focused-learner',
      setAvatar: (avatar) => set({ avatar: sanitizeString(avatar, 'focused-learner', 30) }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        if (theme === 'light' || theme === 'dark' || theme === 'amoled') {
          set({ theme })
        }
      },

      // Progress
      progress: {
        xp: 0,
        level: 1,
        totalFocusTime: 0,
        totalTasksCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        weeklyGoal: 25 * 60,
        weeklyProgress: 0,
      },
      addXP: (amount) => set((state) => {
        const safeAmount = sanitizeNumber(amount, 0, -MAX_XP, MAX_XP)
        const newXP = Math.max(0, Math.min(state.progress.xp + safeAmount, MAX_XP))
        return {
          progress: {
            ...state.progress,
            xp: newXP,
            level: calculateLevel(newXP),
            bestStreak: Math.max(state.progress.bestStreak, state.progress.currentStreak),
          },
        }
      }),
      updateProgress: (updates) => set((state) => ({
        progress: {
          ...state.progress,
          ...updates,
          xp: sanitizeNumber(updates.xp ?? state.progress.xp, 0, 0, MAX_XP),
          totalFocusTime: sanitizeNumber(updates.totalFocusTime ?? state.progress.totalFocusTime, 0, 0),
          totalTasksCompleted: sanitizeNumber(updates.totalTasksCompleted ?? state.progress.totalTasksCompleted, 0, 0, MAX_TASKS),
          currentStreak: sanitizeNumber(updates.currentStreak ?? state.progress.currentStreak, 0, 0, 3650),
          bestStreak: sanitizeNumber(updates.bestStreak ?? state.progress.bestStreak, 0, 0, 3650),
          weeklyGoal: sanitizeNumber(updates.weeklyGoal ?? state.progress.weeklyGoal, 60, 1, 10080),
          weeklyProgress: sanitizeNumber(updates.weeklyProgress ?? state.progress.weeklyProgress, 0, 0),
          level: calculateLevel(updates.xp ?? state.progress.xp),
        },
      })),

      // Tasks
      tasks: (() => {
        const now = Date.now()
        return [
          {
            id: '1',
            title: 'Complete Physics Chapter 5',
            description: 'Review electromagnetic waves and solve practice problems',
            subject: 'Physics',
            priority: 'high',
            status: 'in-progress',
            dueDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
            tags: ['exam-prep', 'important'],
            createdAt: new Date(now),
          },
          {
            id: '2',
            title: 'Math Assignment - Integration',
            subject: 'Mathematics',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
            tags: ['homework'],
            createdAt: new Date(now),
          },
          {
            id: '3',
            title: 'Chemistry Lab Report',
            subject: 'Chemistry',
            priority: 'high',
            status: 'todo',
            dueDate: new Date(now + 1 * 24 * 60 * 60 * 1000),
            createdAt: new Date(now),
          },
        ]
      })(),
      addTask: (task) => set((state) => {
        if (state.tasks.length >= MAX_TASKS) return state
        return {
          tasks: [...state.tasks, {
            ...task,
            id: generateId(),
            title: sanitizeString(task.title, 'Untitled', 500),
            description: task.description ? sanitizeString(task.description, '', 2000) : undefined,
            priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
            status: ['todo', 'in-progress', 'done'].includes(task.status) ? task.status : 'todo',
            createdAt: new Date(),
          }],
        }
      }),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? {
          ...t,
          ...updates,
          title: updates.title ? sanitizeString(updates.title, t.title, 500) : t.title,
          priority: updates.priority ? (['low', 'medium', 'high'].includes(updates.priority) ? updates.priority : t.priority) : t.priority,
          status: updates.status ? (['todo', 'in-progress', 'done'].includes(updates.status) ? updates.status : t.status) : t.status,
        } : t)),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      completeTask: (id) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === id)
          if (!task || task.status === 'done') return state
          const xpAmount = task.priority === 'high' ? 50 : task.priority === 'medium' ? 30 : 15
          const newXP = Math.min(state.progress.xp + xpAmount, MAX_XP)
          return {
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, status: 'done', completedAt: new Date() } : t
            ),
            progress: {
              ...state.progress,
              totalTasksCompleted: state.progress.totalTasksCompleted + 1,
              xp: newXP,
              level: calculateLevel(newXP),
            },
          }
        })
      },

      // Habits
      habits: [
        {
          id: '1',
          name: 'Morning Study',
          icon: '📚',
          color: 'blue',
          frequency: 'daily',
          completedDates: [],
          streak: 0,
          bestStreak: 7,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Exercise',
          icon: '🏃',
          color: 'green',
          frequency: 'daily',
          completedDates: [],
          streak: 0,
          bestStreak: 14,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Review Notes',
          icon: '📝',
          color: 'purple',
          frequency: 'daily',
          completedDates: [],
          streak: 0,
          bestStreak: 21,
          createdAt: new Date(),
        },
      ],
      addHabit: (habit) => set((state) => {
        if (state.habits.length >= MAX_HABITS) return state
        return {
          habits: [...state.habits, {
            ...habit,
            id: generateId(),
            name: sanitizeString(habit.name, 'Habit', 100),
            completedDates: [],
            streak: 0,
            bestStreak: 0,
            createdAt: new Date(),
          }],
        }
      }),
      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      })),
      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      })),
      toggleHabitDay: (id, date) => set((state) => ({
        habits: state.habits.map((h) => {
          if (h.id !== id) return h
          const dates = h.completedDates.includes(date)
            ? h.completedDates.filter((d) => d !== date)
            : [...h.completedDates, date]
          const streak = calculateStreak(dates)
          const bestStreak = Math.max(calculateBestStreak(dates), streak)
          return {
            ...h,
            completedDates: dates,
            streak,
            bestStreak,
          }
        }),
      })),

      // Focus Sessions
      focusSessions: [],
      currentSession: null,
      startFocusSession: (type, subject) => set({
        currentSession: {
          id: generateId(),
          startTime: new Date(),
          duration: 0,
          targetDuration: 0,
          type: ['pomodoro', 'deep-work', 'custom'].includes(type) ? type : 'custom',
          subject: subject ? sanitizeString(subject, '', 100) : undefined,
          completed: false,
          interrupted: false,
        },
      }),
      endFocusSession: (actualDuration?: number, targetDuration?: number, interrupted?: boolean, quality?: { energy?: number; distractions?: number; category?: string; reflection?: string; pauseCount?: number }) => {
        const now = Date.now()
        set((state) => {
          if (!state.currentSession) return state
          if (state.focusSessions.length >= MAX_SESSIONS) return state

          const effDuration = sanitizeNumber(
            actualDuration ?? Math.max(0, Math.floor(
              (now - new Date(state.currentSession.startTime).getTime()) / 1000 / 60
            )),
            0, 0, MAX_FOCUS_MINUTES
          )

          const tgt = sanitizeNumber(targetDuration ?? 0, 0, 0, MAX_FOCUS_MINUTES)
          const completionPct = tgt > 0 ? Math.min(effDuration / tgt, 1) : 0
          const distPenalty = ((quality?.distractions ?? 0) > 5 ? 0.15 : (quality?.distractions ?? 0) > 2 ? 0.08 : 0)
          const pausePenalty = ((quality?.pauseCount ?? 0) > 5 ? 0.1 : (quality?.pauseCount ?? 0) > 2 ? 0.05 : 0)
          const rawScore = ((completionPct * 0.6) + (0.4 * (interrupted ? 0.3 : 1))) * (1 - distPenalty) * (1 - pausePenalty)
          const focusScore = Math.round(Math.min(Math.max(rawScore * 100, 10), 100))

          const newXP = Math.min(state.progress.xp + Math.floor(effDuration * 2), MAX_XP)

          return {
            focusSessions: [
              ...state.focusSessions,
              {
                ...state.currentSession,
                endTime: new Date(now),
                duration: effDuration,
                targetDuration: tgt,
                completed: !interrupted,
                interrupted: !!interrupted,
                energy: quality?.energy,
                distractions: quality?.distractions,
                category: quality?.category ? sanitizeString(quality.category, '', 100) : undefined,
                reflection: quality?.reflection ? sanitizeString(quality.reflection, '', 5000) : undefined,
                pauseCount: sanitizeNumber(quality?.pauseCount, 0, 0, 1000),
                focusScore,
              },
            ],
            currentSession: null,
            progress: {
              ...state.progress,
              totalFocusTime: state.progress.totalFocusTime + effDuration,
              weeklyProgress: state.progress.weeklyProgress + effDuration,
              xp: newXP,
              level: calculateLevel(newXP),
            },
          }
        })
      },
      addFocusSession: (session) => set((state) => {
        if (state.focusSessions.length >= MAX_SESSIONS) return state
        return {
          focusSessions: [...state.focusSessions, {
            ...session,
            id: generateId(),
            duration: sanitizeNumber(session.duration, 0, 0, MAX_FOCUS_MINUTES),
            targetDuration: sanitizeNumber(session.targetDuration, 0, 0, MAX_FOCUS_MINUTES),
          }],
        }
      }),
      addSessionReflection: (sessionId, reflection) => set((state) => ({
        focusSessions: state.focusSessions.map((s) => s.id === sessionId ? {
          ...s,
          reflection: sanitizeString(reflection, '', 5000),
        } : s),
      })),

      // Focus timer persistence
      focusTimerState: null,
      setFocusTimerState: (state) => set({
        focusTimerState: state ? validateTimerState(state) : null,
      }),

      // Calendar Events
      events: (() => {
        const now = new Date()
        const today9am = new Date(now)
        today9am.setHours(9, 0, 0, 0)
        const today11am = new Date(now)
        today11am.setHours(11, 0, 0, 0)
        const today2pm = new Date(now)
        today2pm.setHours(14, 0, 0, 0)
        const today4pm = new Date(now)
        today4pm.setHours(16, 0, 0, 0)
        return [
          {
            id: '1',
            title: 'Physics Revision',
            subject: 'Physics',
            startTime: today9am,
            endTime: today11am,
            type: 'study',
            color: 'blue',
          },
          {
            id: '2',
            title: 'Math Practice',
            subject: 'Mathematics',
            startTime: today2pm,
            endTime: today4pm,
            type: 'study',
            color: 'green',
          },
        ]
      })(),
      addEvent: (event) => set((state) => {
        if (state.events.length >= MAX_EVENTS) return state
        return {
          events: [...state.events, {
            ...event,
            id: generateId(),
            title: sanitizeString(event.title, 'Event', 200),
            type: (['study', 'exam', 'revision', 'break'].includes(event.type) ? event.type : 'study') as StudyEvent['type'],
          }],
        }
      }),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      })),

      // Personalization
      studyStyle: 'deep-work',
      setStudyStyle: (style) => {
        if (['deep-work', 'consistent', 'sprint', 'night-owl'].includes(style)) {
          set({ studyStyle: style })
        }
      },
      academicGoal: '',
      setAcademicGoal: (goal) => set({ academicGoal: sanitizeString(goal, '', 100) }),
      preferredFocusDuration: 60,
      setPreferredFocusDuration: (mins) => set({
        preferredFocusDuration: sanitizeNumber(mins, 60, 10, 240),
      }),
      reducedMotion: false,
      setReducedMotion: (reduced) => set({ reducedMotion: sanitizeBoolean(reduced, false) }),

      // Goals
      dailyGoal: 120,
      setDailyGoal: (goal) => set({ dailyGoal: sanitizeNumber(goal, 120, 1, 1440) }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: sanitizeBoolean(open, true) }),

      // Active View
      activeView: 'dashboard',
      setActiveView: (view) => {
        const validViews = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings'] as const
        if (validViews.includes(view as typeof validViews[number])) {
          set({ activeView: view as StudentOSState['activeView'] })
        }
      },

      // Command Palette (ephemeral, not persisted)
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: sanitizeBoolean(open, false) }),
    }),
     {
       name: STORAGE_KEY,
       version: CURRENT_SCHEMA_VERSION,
       storage,
         partialize: (state) => ({
           userName: state.userName,
           onboardingComplete: state.onboardingComplete,
           avatar: state.avatar,
           theme: state.theme,
          progress: state.progress,
          dailyGoal: state.dailyGoal,
          studyStyle: state.studyStyle,
          academicGoal: state.academicGoal,
          preferredFocusDuration: state.preferredFocusDuration,
          reducedMotion: state.reducedMotion,
         tasks: state.tasks,
         habits: state.habits,
         focusSessions: state.focusSessions,
         focusTimerState: state.focusTimerState,
         events: state.events,
        }),
        migrate: (persistedState: unknown, version: number) => {
          let state = persistedState as Record<string, unknown>

          // v0 -> v1: Migrate from old storage format
          if (version === 0) {
            try {
              const oldRaw = localStorage.getItem('student-os-storage-v2')
              if (oldRaw) {
                const oldParsed = JSON.parse(oldRaw)
                if (oldParsed.state) {
                  state = oldParsed.state
                }
              }
            } catch { /* noop */ }
            state = migrateV1toV2(state)
          }

          // v1 -> v2: Ensure subtasks + progress structure
          if (version <= 1 && CURRENT_SCHEMA_VERSION > 1) {
            if (Array.isArray(state.tasks)) {
              state.tasks = (state.tasks as Record<string, unknown>[]).map((t) => ({
                ...t,
                subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
              }))
            }
            if (typeof state.progress !== 'object' || !state.progress) {
              state.progress = {
                xp: 0, level: 1, totalFocusTime: 0, totalTasksCompleted: 0,
                currentStreak: 0, bestStreak: 0, weeklyGoal: 1500, weeklyProgress: 0,
              }
            }
          }

          // v2 -> v3: Sanitize focus sessions, ensure dailyGoal
          if (version <= 2 && CURRENT_SCHEMA_VERSION > 2) {
            if (Array.isArray(state.focusSessions)) {
              state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => ({
                ...fs,
                targetDuration: sanitizeNumber(fs.targetDuration, 0, 0, MAX_FOCUS_MINUTES),
                interrupted: sanitizeBoolean(fs.interrupted, false),
              }))
            }
            if (typeof state.dailyGoal !== 'number') state.dailyGoal = 120
          }

          // v3 -> v4: Add optional focus session fields, personalization
          if (version <= 3 && CURRENT_SCHEMA_VERSION > 3) {
            if (Array.isArray(state.focusSessions)) {
              state.focusSessions = (state.focusSessions as Record<string, unknown>[]).map((fs) => ({
                ...fs,
                energy: fs.energy ?? undefined,
                distractions: fs.distractions ?? undefined,
                category: fs.category ?? undefined,
                focusScore: fs.focusScore !== undefined ? sanitizeNumber(fs.focusScore, 0, 0, 100) : undefined,
                reflection: fs.reflection ?? undefined,
                pauseCount: fs.pauseCount !== undefined ? sanitizeNumber(fs.pauseCount, 0, 0, 1000) : undefined,
              }))
            }
            if (typeof state.studyStyle !== 'string' || !['deep-work', 'consistent', 'sprint', 'night-owl'].includes(state.studyStyle as string)) state.studyStyle = 'deep-work'
            if (typeof state.academicGoal !== 'string') state.academicGoal = ''
            if (typeof state.preferredFocusDuration !== 'number' || state.preferredFocusDuration < 10 || state.preferredFocusDuration > 240) state.preferredFocusDuration = 60
            if (typeof state.reducedMotion !== 'boolean') state.reducedMotion = false
          }

          // v4 -> v5: Migrate avatar format
          if (version <= 4 && CURRENT_SCHEMA_VERSION > 4) {
            if (typeof state.avatar === 'string' && (state.avatar === 'initials' || (state.avatar).startsWith('gradient-'))) {
              state.avatar = 'focused-learner'
            }
          }

          return state
        },
       onRehydrateStorage: () => {
         return (state, error) => {
           if (error) {
             console.warn('Student OS: Storage rehydration failed, using defaults')
           }
           // Check storage quota on rehydration
           if (typeof window !== 'undefined') {
             const stats = getStorageStats()
             if (stats.isCritical) {
               window.dispatchEvent(
                 new CustomEvent('storage-quota-warning', {
                   detail: { stats },
                 })
               )
             }
           }
         }
       },
     }
   )
)

// ─── Backup / Export ─────────────────────────────────────────────────
export function exportBackup(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = safeDeserialize(raw)
    if (!parsed) return null
    return raw
  } catch {
    return null
  }
}

export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    if (!validatePersistedData(parsed)) return false
    const quotaOk = checkStorageQuota()
    if (!quotaOk) return false
    localStorage.setItem(STORAGE_KEY, json)
    window.location.reload()
    return true
  } catch {
    return false
  }
}

// ─── Data Reliability: Auto-Repair ──────────────────────────────────
export function repairFocusSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((s) => {
    if (!s || typeof s !== 'object') return false
    if (typeof s.id !== 'string' || !s.id) return false
    if (!s.startTime) return false
    if (typeof s.duration !== 'number' || Number.isNaN(s.duration) || s.duration < 0 || s.duration > MAX_FOCUS_MINUTES) return false
    if (s.endTime && new Date(s.endTime) < new Date(s.startTime)) return false
    return true
  })
}

export function autoRepair(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed.state) return
    const state = parsed.state
    let changed = false

    if (Array.isArray(state.focusSessions)) {
      const before = state.focusSessions.length
      state.focusSessions = state.focusSessions.filter((s: Record<string, unknown>) => {
        if (!s || typeof s !== 'object') return false
        if (typeof s.duration === 'number' && (Number.isNaN(s.duration) || s.duration < 0 || s.duration > MAX_FOCUS_MINUTES)) {
          s.duration = sanitizeNumber(s.duration, 0, 0, MAX_FOCUS_MINUTES)
        }
        if (typeof s.focusScore === 'number' && (Number.isNaN(s.focusScore) || s.focusScore < 0 || s.focusScore > 100)) {
          s.focusScore = sanitizeNumber(s.focusScore, 0, 0, 100)
        }
        return true
      })
      if (state.focusSessions.length !== before) {
        changed = true
      }
    }

    if (state.progress && typeof state.progress === 'object') {
      const p = state.progress as Record<string, unknown>
      if (typeof p.xp === 'number' && (Number.isNaN(p.xp) || p.xp < 0 || p.xp > MAX_XP)) {
        p.xp = sanitizeNumber(p.xp, 0, 0, MAX_XP)
        changed = true
      }
      if (typeof p.level === 'number' && (Number.isNaN(p.level) || p.level < 1)) {
        p.level = Math.max(1, Math.floor((p.xp as number || 0) / 1000) + 1)
        changed = true
      }
    }

    if (state.focusTimerState && typeof state.focusTimerState === 'object') {
      const ts = state.focusTimerState as Record<string, unknown>
      if (typeof ts.endTimestamp !== 'number' || Number.isNaN(ts.endTimestamp)) {
        state.focusTimerState = null
        changed = true
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }

    const oldKeys = ['student-os-storage', 'student-os-storage-v2']
    for (const key of oldKeys) {
      if (localStorage.getItem(key)) localStorage.removeItem(key)
    }
  } catch { /* noop */ }
}

// Deferred auto-repair to avoid blocking module load
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { try { autoRepair() } catch {} }, { timeout: 3000 })
  } else {
    setTimeout(() => { try { autoRepair() } catch {} }, 1000)
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        autoRepair()
        cleanupOldData()
      } catch { /* noop */ }
    }, 5000)
  })
}
