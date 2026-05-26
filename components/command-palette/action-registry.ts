'use client'

import type { CommandAction } from './types'
import {
  LayoutDashboard, Timer, Calendar, CheckSquare, Target,
  BarChart3, Settings, Sun, Moon, Monitor, Download,
  Trash2, Plus, Play,
} from 'lucide-react'

export type ViewType = 'dashboard' | 'focus' | 'planner' | 'tasks' | 'habits' | 'analytics' | 'settings'
export type ThemeType = 'light' | 'dark' | 'amoled'

export interface RegistryActions {
  setActiveView: (view: ViewType) => void
  setTheme: (theme: ThemeType) => void
  setSidebarOpen: (open: boolean) => void
  sidebarOpen: boolean
  startFocusSession: (type: 'pomodoro' | 'deep-work' | 'custom') => void
  openAddTask?: () => void
  openAddHabit?: () => void
  openAddEvent?: () => void
  exportData?: () => void
  clearData?: () => void
}

export function createCommandRegistry(actions: RegistryActions): CommandAction[] {
  const {
    setActiveView, setTheme, setSidebarOpen, sidebarOpen,
    startFocusSession, openAddTask, openAddHabit, openAddEvent,
    exportData, clearData
  } = actions

  const commands: CommandAction[] = []

  // Navigation
  commands.push({
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    description: 'View your study overview',
    category: 'navigation',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'home', 'overview', 'stats', 'start'],
    shortcut: 'G D',
    execute: () => setActiveView('dashboard'),
  })

  commands.push({
    id: 'nav-focus',
    title: 'Go to Focus',
    description: 'Start a focus session',
    category: 'navigation',
    icon: Timer,
    keywords: ['focus', 'timer', 'pomodoro', 'deep work', 'concentration'],
    shortcut: 'G F',
    execute: () => setActiveView('focus'),
  })

  commands.push({
    id: 'nav-planner',
    title: 'Go to Planner',
    description: 'Plan your study sessions',
    category: 'navigation',
    icon: Calendar,
    keywords: ['planner', 'calendar', 'schedule', 'events', 'timeline'],
    shortcut: 'G P',
    execute: () => setActiveView('planner'),
  })

  commands.push({
    id: 'nav-tasks',
    title: 'Go to Tasks',
    description: 'Manage your tasks',
    category: 'navigation',
    icon: CheckSquare,
    keywords: ['tasks', 'todo', 'todos', 'assignments', 'homework'],
    shortcut: 'G T',
    execute: () => setActiveView('tasks'),
  })

  commands.push({
    id: 'nav-habits',
    title: 'Go to Habits',
    description: 'Track your habits',
    category: 'navigation',
    icon: Target,
    keywords: ['habits', 'streak', 'routine', 'consistency', 'daily'],
    shortcut: 'G H',
    execute: () => setActiveView('habits'),
  })

  commands.push({
    id: 'nav-analytics',
    title: 'Go to Analytics',
    description: 'View your progress',
    category: 'navigation',
    icon: BarChart3,
    keywords: ['analytics', 'stats', 'progress', 'insights', 'charts'],
    shortcut: 'G A',
    execute: () => setActiveView('analytics'),
  })

  commands.push({
    id: 'nav-settings',
    title: 'Go to Settings',
    description: 'Customize your experience',
    category: 'navigation',
    icon: Settings,
    keywords: ['settings', 'preferences', 'theme', 'config', 'options'],
    shortcut: 'G S',
    execute: () => setActiveView('settings'),
  })

  // Actions
  if (openAddTask) {
    commands.push({
      id: 'add-task',
      title: 'Add Task',
      description: 'Create a new task',
      category: 'actions',
      icon: Plus,
      keywords: ['task', 'todo', 'new', 'create', 'homework', 'assignment', 'add'],
      shortcut: 'N',
      execute: openAddTask,
    })
  }

  if (openAddHabit) {
    commands.push({
      id: 'add-habit',
      title: 'Add Habit',
      description: 'Create a new habit',
      category: 'actions',
      icon: Plus,
      keywords: ['habit', 'new', 'create', 'routine', 'daily', 'add'],
      execute: openAddHabit,
    })
  }

  if (openAddEvent) {
    commands.push({
      id: 'add-event',
      title: 'Add Event',
      description: 'Schedule a study event',
      category: 'actions',
      icon: Plus,
      keywords: ['event', 'calendar', 'schedule', 'appointment', 'meeting', 'add'],
      execute: openAddEvent,
    })
  }

  commands.push({
    id: 'start-focus',
    title: 'Start Focus Session',
    description: 'Begin a Pomodoro timer',
    category: 'actions',
    icon: Play,
    keywords: ['focus', 'timer', 'start', 'pomodoro', 'deep work', 'session'],
    execute: () => {
      setActiveView('focus')
      setTimeout(() => startFocusSession('pomodoro'), 50)
    },
  })

  // Preferences
  commands.push({
    id: 'theme-light',
    title: 'Switch to Light Mode',
    description: 'Bright theme',
    category: 'preferences',
    icon: Sun,
    keywords: ['light', 'theme', 'bright', 'white'],
    execute: () => setTheme('light'),
  })

  commands.push({
    id: 'theme-dark',
    title: 'Switch to Dark Mode',
    description: 'Dark theme',
    category: 'preferences',
    icon: Moon,
    keywords: ['dark', 'theme', 'dim', 'night'],
    execute: () => setTheme('dark'),
  })

  commands.push({
    id: 'theme-amoled',
    title: 'Switch to AMOLED Mode',
    description: 'Pure black theme',
    category: 'preferences',
    icon: Monitor,
    keywords: ['amoled', 'theme', 'black', 'oled', 'darkest'],
    execute: () => setTheme('amoled'),
  })

  commands.push({
    id: 'toggle-sidebar',
    title: 'Toggle Sidebar',
    description: 'Show or hide the navigation',
    category: 'preferences',
    icon: Monitor,
    keywords: ['sidebar', 'navigation', 'toggle', 'hide', 'show'],
    shortcut: '⌘ B',
    execute: () => setSidebarOpen(!sidebarOpen),
  })

  // Data
  if (exportData) {
    commands.push({
      id: 'export-data',
      title: 'Export Data',
      description: 'Download JSON backup',
      category: 'data',
      icon: Download,
      keywords: ['export', 'backup', 'download', 'save', 'data'],
      execute: exportData,
    })
  }

  if (clearData) {
    commands.push({
      id: 'clear-data',
      title: 'Clear All Data',
      description: 'Delete all local data',
      category: 'data',
      icon: Trash2,
      keywords: ['clear', 'delete', 'reset', 'erase', 'data'],
      execute: clearData,
    })
  }

  return commands
}
