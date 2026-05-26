import Dexie, { type Table } from 'dexie'

export interface DBTask {
  id: string
  title: string
  description?: string
  subject?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'done'
  dueDate?: string
  subtasks?: { id: string; title: string; done: boolean }[]
  tags?: string[]
  createdAt: string
  completedAt?: string
  updatedAt: string
}

export interface DBHabit {
  id: string
  name: string
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  targetDays?: number[]
  completedDates: string[]
  streak: number
  bestStreak: number
  createdAt: string
  updatedAt: string
}

export interface DBFocusSession {
  id: string
  startTime: string
  endTime?: string
  duration: number
  subject?: string
  type: 'pomodoro' | 'deep-work' | 'custom'
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface DBEvent {
  id: string
  title: string
  description?: string
  subject?: string
  startTime: string
  endTime: string
  type: 'study' | 'exam' | 'revision' | 'break'
  color?: string
  createdAt: string
  updatedAt: string
}

const DB_NAME = 'student-os-v2'

class StudentOSDatabase extends Dexie {
  tasks!: Table<DBTask, string>
  habits!: Table<DBHabit, string>
  focusSessions!: Table<DBFocusSession, string>
  events!: Table<DBEvent, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      tasks: 'id, status, priority, subject, dueDate, updatedAt',
      habits: 'id, frequency, updatedAt',
      focusSessions: 'id, type, startTime, updatedAt',
      events: 'id, type, subject, startTime, endTime, updatedAt',
    })
  }
}

let dbInstance: StudentOSDatabase | null = null

export function getDb(): StudentOSDatabase {
  if (!dbInstance) {
    dbInstance = new StudentOSDatabase()
  }
  return dbInstance
}

export async function exportAllData(): Promise<string | null> {
  try {
    const db = getDb()
    const tasks = await db.tasks.toArray()
    const habits = await db.habits.toArray()
    const focusSessions = await db.focusSessions.toArray()
    const events = await db.events.toArray()
    return JSON.stringify({ tasks, habits, focusSessions, events, exportedAt: new Date().toISOString() })
  } catch {
    return null
  }
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json)
    const db = getDb()
    await db.transaction('rw', db.tasks, db.habits, db.focusSessions, db.events, async () => {
      if (data.tasks?.length) await db.tasks.bulkPut(data.tasks)
      if (data.habits?.length) await db.habits.bulkPut(data.habits)
      if (data.focusSessions?.length) await db.focusSessions.bulkPut(data.focusSessions)
      if (data.events?.length) await db.events.bulkPut(data.events)
    })
    return true
  } catch {
    return false
  }
}

export async function clearAllData(): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.tasks, db.habits, db.focusSessions, db.events, async () => {
    await Promise.all([
      db.tasks.clear(),
      db.habits.clear(),
      db.focusSessions.clear(),
      db.events.clear(),
    ])
  })
}
