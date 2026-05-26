'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore, StudyEvent } from '@/lib/store'
import { staggerContainer, staggerItem, spring } from './motion'
import { Card } from './ui/glass-card'
import { Modal } from './modal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isToday, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, addMonths, subMonths,
} from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Clock, BookOpen,
  GraduationCap, Coffee, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EVENT_TYPES = [
  { value: 'study', label: 'Study', icon: BookOpen, color: 'bg-primary/10 text-primary' },
  { value: 'exam', label: 'Exam', icon: GraduationCap, color: 'bg-destructive/10 text-destructive' },
  { value: 'revision', label: 'Revision', icon: Clock, color: 'bg-chart-2/10 text-chart-2' },
  { value: 'break', label: 'Break', icon: Coffee, color: 'bg-chart-3/10 text-chart-3' },
]

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6)

export function StudyPlanner() {
  const events = useStore((s) => s.events)
  const addEvent = useStore((s) => s.addEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfMonth = monthStart.getDay()
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const getEventsForDate = (date: Date) => events.filter((e) => isSameDay(new Date(e.startTime), date))

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    else if (viewMode === 'month') setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    else setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1))
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={staggerItem} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Planner</h1>
          <p className="text-sm text-muted-foreground">Plan your study sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-secondary p-0.5">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn('px-3 py-1.5 rounded text-sm font-medium transition-colors', viewMode === mode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
                {mode}
              </button>
            ))}
          </div>
          <button onClick={() => { setSelectedDate(new Date()); setShowAddModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add event
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <motion.button
          onClick={() => navigateDate('prev')}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <h2 className="text-sm font-medium text-foreground">
          {viewMode === 'month' ? format(currentDate, 'MMMM yyyy')
            : viewMode === 'week' ? `${format(weekStart, 'MMM d')} — ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
            : format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <motion.button
          onClick={() => navigateDate('next')}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <motion.div variants={staggerItem}>
        {viewMode === 'month' ? (
          <MonthView monthDays={monthDays} paddingDays={paddingDays} currentDate={currentDate}
            events={events} onSelectDate={(date) => { setSelectedDate(date); setShowAddModal(true) }} />
        ) : viewMode === 'week' ? (
          <WeekView weekDays={weekDays} events={events}
            onSelectTime={(date) => { setSelectedDate(date); setShowAddModal(true) }}
            onDeleteEvent={deleteEvent} />
        ) : (
          <DayView date={currentDate} events={getEventsForDate(currentDate)}
            onSelectTime={(date) => { setSelectedDate(date); setShowAddModal(true) }}
            onDeleteEvent={deleteEvent} />
        )}
      </motion.div>

      {showAddModal && selectedDate && (
        <AddEventModal initialDate={selectedDate}
          onClose={() => { setShowAddModal(false); setSelectedDate(null) }}
          onAdd={(event) => { addEvent(event); setShowAddModal(false); setSelectedDate(null) }} />
      )}
    </motion.div>
  )
}

function MonthView({ monthDays, paddingDays, currentDate, events, onSelectDate }: {
  monthDays: Date[]; paddingDays: number; currentDate: Date; events: StudyEvent[]; onSelectDate: (d: Date) => void
}) {
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDayLabels.map((day) => (
          <div key={day} className="p-2.5 text-center text-xs text-muted-foreground font-medium">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="h-24 lg:h-28 p-1.5 border-b border-r border-border bg-muted/20" />
        ))}
        {monthDays.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), day))
          const isCurrentMonth = isSameMonth(day, currentDate)
          return (
            <button key={day.toISOString()} onClick={() => onSelectDate(day)}
              className={cn('h-24 lg:h-28 p-1.5 border-b border-r border-border text-left hover:bg-secondary/50 transition-colors', !isCurrentMonth && 'opacity-40')}>
              <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded-full text-xs', isToday(day) && 'bg-primary text-primary-foreground font-medium')}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => {
                  const et = EVENT_TYPES.find((t) => t.value === event.type)
                  return <div key={event.id} className={cn('text-[10px] px-1 py-0.5 rounded truncate', et?.color)}>{event.title}</div>
                })}
                {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</div>}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function WeekView({ weekDays, events, onSelectTime, onDeleteEvent }: {
  weekDays: Date[]; events: StudyEvent[]; onSelectTime: (d: Date) => void; onDeleteEvent: (id: string) => void
}) {
  return (
    <Card className="p-0 overflow-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-card z-10">
          <div className="p-2.5 border-r border-border" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className={cn('p-2.5 text-center border-r border-border', isToday(day) && 'bg-secondary')}>
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={cn('text-base font-semibold mt-0.5', isToday(day) && 'text-primary')}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border h-14">
              <div className="p-1.5 text-xs text-muted-foreground border-r border-border flex items-start justify-end pr-2">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {weekDays.map((day) => (
                <div key={`${day.toISOString()}-${hour}`}
                  onClick={() => { const s = new Date(day); s.setHours(hour, 0); onSelectTime(s) }}
                  className={cn('border-r border-border cursor-pointer hover:bg-secondary/50 transition-colors', isToday(day) && 'bg-secondary/30')}
                />
              ))}
            </div>
          ))}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), day))
            return dayEvents.map((event) => {
              const sh = new Date(event.startTime).getHours()
              const eh = new Date(event.endTime).getHours()
              const sm = new Date(event.startTime).getMinutes()
              const dur = eh - sh + (new Date(event.endTime).getMinutes() - sm) / 60
              const top = (sh - 6) * 56 + (sm / 60) * 56
              const et = EVENT_TYPES.find((t) => t.value === event.type)
              return (
                <div key={event.id} className={cn('absolute rounded-xl p-2 border cursor-pointer group', et?.color)}
                  style={{ top: `${top}px`, height: `${Math.max(dur * 56, 28)}px`, left: `calc(${(dayIndex + 1) * 12.5}% + 2px)`, width: 'calc(12.5% - 4px)' }}>
                  <p className="text-xs font-medium truncate">{event.title}</p>
                  <p className="text-[10px] opacity-70">{format(new Date(event.startTime), 'h:mm a')}</p>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id) }}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-background/50">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })
          })}
        </div>
      </div>
    </Card>
  )
}

function DayView({ date, events, onSelectTime, onDeleteEvent }: {
  date: Date; events: StudyEvent[]; onSelectTime: (d: Date) => void; onDeleteEvent: (id: string) => void
}) {
  return (
    <Card className="p-0 overflow-auto">
      <div className="min-h-[500px] relative">
        {HOURS.map((hour) => {
          const slotTime = new Date(date); slotTime.setHours(hour, 0, 0, 0)
          return (
            <div key={hour} onClick={() => onSelectTime(slotTime)}
              className="flex h-14 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="w-16 p-1.5 text-xs text-muted-foreground border-r border-border flex items-start justify-end pr-2">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              <div className="flex-1 relative" />
            </div>
          )
        })}
        {events.map((event) => {
          const sh = new Date(event.startTime).getHours()
          const eh = new Date(event.endTime).getHours()
          const sm = new Date(event.startTime).getMinutes()
          const dur = eh - sh + (new Date(event.endTime).getMinutes() - sm) / 60
          const top = (sh - 6) * 56 + (sm / 60) * 56
          const et = EVENT_TYPES.find((t) => t.value === event.type)
          const Icon = et?.icon || BookOpen
          return (
            <div key={event.id} className={cn('absolute left-[4.5rem] right-2 rounded-xl p-2.5 border group', et?.color)}
              style={{ top: `${top}px`, height: `${Math.max(dur * 56, 40)}px` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs opacity-70">{format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}</p>
                  </div>
                </div>
                <button onClick={() => onDeleteEvent(event.id)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-background/50 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AddEventModal({ initialDate, onClose, onAdd }: {
  initialDate: Date; onClose: () => void; onAdd: (event: Omit<StudyEvent, 'id'>) => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<StudyEvent['type']>('study')
  const [date, setDate] = useState(format(initialDate, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(format(initialDate, 'HH:mm'))
  const [endTime, setEndTime] = useState(format(new Date(initialDate.getTime() + 60 * 60 * 1000), 'HH:mm'))
  const [subject, setSubject] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)
    onAdd({ title: title.trim(), type, subject, startTime: startDateTime, endTime: endDateTime })
  }

  return (
    <Modal open onClose={onClose} title="Add event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="event-title" label="Title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Physics revision" autoFocus maxLength={200} />
        <div>
          <label className="text-sm font-medium mb-1.5 block">Type</label>
          <div className="grid grid-cols-4 gap-1.5">
            {EVENT_TYPES.map((et) => {
              const Icon = et.icon
              return (
                <button key={et.value} type="button" onClick={() => setType(et.value as StudyEvent['type'])}
                  className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-colors', type === et.value ? et.color + ' border-current' : 'bg-secondary border-transparent hover:bg-secondary/80')}>
                  <Icon className="w-4 h-4" /><span className="text-xs">{et.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <Input id="event-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="event-start" label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input id="event-end" label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={!title.trim()} className="flex-1">Add event</Button>
        </div>
      </form>
    </Modal>
  )
}
