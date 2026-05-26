import { format } from 'date-fns'

export interface ParsedCapture {
  title: string
  description?: string
  subject?: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  tags?: string[]
  confidence: number
}

const DAYS: Record<string, number> = {
  today: 0, tomorrow: 1, dayafter: 2,
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
  nextweek: 7, 'next week': 7,
}

const PRIORITY_WORDS: Record<string, 'low' | 'medium' | 'high'> = {
  urgent: 'high', critical: 'high', important: 'high', asap: 'high',
  low: 'low', minor: 'low', trivial: 'low',
  medium: 'medium', normal: 'medium',
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  physics: ['physics', 'phys'], math: ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'stats'],
  chemistry: ['chemistry', 'chem'], biology: ['biology', 'bio'],
  history: ['history', 'hist'], literature: ['literature', 'lit', 'english'],
  computer: ['computer', 'cs', 'programming', 'coding', 'software'],
}

function getNextWeekday(dayNum: number): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentDay = today.getDay()
  let diff = dayNum - currentDay
  if (diff <= 0) diff += 7
  today.setDate(today.getDate() + diff)
  return today
}

export function parseQuickCapture(input: string): ParsedCapture {
  const lower = input.toLowerCase().trim()
  let title = input.trim()
  let priority: 'low' | 'medium' | 'high' = 'medium'
  let dueDate: Date | undefined
  let subject: string | undefined
  let tags: string[] = []
  let confidence = 0.7

  const priorityRegex = /(urgent|critical|important|asap|high\s*priority|low\s*priority|minor|trivial)/i
  const priorityMatch = lower.match(priorityRegex)
  if (priorityMatch) {
    priority = PRIORITY_WORDS[priorityMatch[1].toLowerCase()] || 'medium'
    title = title.replace(priorityMatch[0], '').trim()
    confidence = 0.8
  }

  const subjectPattern = Object.entries(SUBJECT_KEYWORDS).reduce<string[]>((acc, [subj, keywords]) => {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i')
      if (regex.test(lower)) {
        acc.push(subj)
        break
      }
    }
    return acc
  }, [])

  if (subjectPattern.length > 0) {
    subject = subjectPattern[0]
    if (subjectPattern.length > 1) tags = subjectPattern
    confidence = 0.85
  }

  const timeRegex = /(?:\b(?:at|by|before)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi
  let parsedHour: number | undefined
  let parsedMinute = 0
  let timeMatch: RegExpExecArray | null

  while ((timeMatch = timeRegex.exec(lower)) !== null) {
    const h = parseInt(timeMatch[1], 10)
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const meridian = timeMatch[3]?.toLowerCase()
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (meridian === 'pm' && h < 12) parsedHour = h + 12
      else if (meridian === 'am' && h === 12) parsedHour = 0
      else if (meridian) parsedHour = h
      else if (h <= 12) parsedHour = h
      if (meridian) {
        title = title.replace(timeMatch[0], '').trim()
        confidence = 0.9
        break
      }
    }
  }

  const dayRegex = new RegExp(`\\b(${Object.keys(DAYS).join('|')})\\b`, 'i')
  const dayMatch = lower.match(dayRegex)
  if (dayMatch) {
    const dayKey = dayMatch[1].toLowerCase()
    const dayOffset = DAYS[dayKey]
    if (dayOffset !== undefined) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (dayKey === 'nextweek' || dayKey === 'next week') {
        dueDate = new Date(today)
        dueDate.setDate(today.getDate() + 7)
      } else if (dayOffset <= 2 && dayKey !== 'monday' && dayKey !== 'tuesday') {
        dueDate = new Date(today)
        dueDate.setDate(today.getDate() + dayOffset)
      } else if (dayOffset >= 1 && dayOffset <= 7) {
        dueDate = getNextWeekday(dayOffset)
      }
      if (parsedHour !== undefined) {
        dueDate!.setHours(parsedHour, parsedMinute, 0, 0)
      }
      title = title.replace(dayMatch[0], '').trim()
      confidence = 0.9
    }
  }

  if (!dueDate && parsedHour !== undefined) {
    dueDate = new Date()
    dueDate.setHours(parsedHour, parsedMinute, 0, 0)
    if (dueDate < new Date()) dueDate.setDate(dueDate.getDate() + 1)
  }

  const tagRegex = /#(\w+)/g
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = tagRegex.exec(input)) !== null) {
    tags.push(tagMatch[1])
    title = title.replace(tagMatch[0], '').trim()
  }

  title = title.replace(/\s+/g, ' ').trim()
  title = title.replace(/^(to|for|due)\s+/i, '').trim()

  return { title, subject, priority, dueDate, tags: tags.length > 0 ? tags : undefined, confidence }
}

export function formatQuickPreview(parsed: ParsedCapture): string {
  const parts: string[] = [parsed.title]
  if (parsed.subject) parts.push(`📚 ${parsed.subject}`)
  if (parsed.priority !== 'medium') parts.push(parsed.priority === 'high' ? '🔴 High' : '🟢 Low')
  if (parsed.dueDate) parts.push(`📅 ${format(parsed.dueDate, 'MMM d, h:mm a')}`)
  if (parsed.tags?.length) parts.push(`#${parsed.tags.join(' #')}`)
  return parts.join(' · ')
}
