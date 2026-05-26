import type { ComponentType } from 'react'

export type CommandCategory = 'navigation' | 'actions' | 'preferences' | 'data'

export interface CommandAction {
  id: string
  title: string
  description?: string
  category: CommandCategory
  icon?: ComponentType<{ className?: string }>
  keywords: string[]
  shortcut?: string
  execute: () => void
}

export interface CommandGroup {
  category: CommandCategory
  label: string
  commands: CommandAction[]
}

export const CATEGORY_ORDER: CommandCategory[] = ['navigation', 'actions', 'preferences', 'data']

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  preferences: 'Preferences',
  data: 'Data',
}
