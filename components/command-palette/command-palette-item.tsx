'use client'

import { motion } from 'framer-motion'
import type { CommandAction } from './types'
import { cn } from '@/lib/utils'

interface CommandPaletteItemProps {
  command: CommandAction
  selected: boolean
  onSelect: () => void
  index: number
}

export function CommandPaletteItem({
  command,
  selected,
  onSelect,
  index,
}: CommandPaletteItemProps) {
  const Icon = command.icon

  return (
    <motion.div
      onClick={onSelect}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.008, duration: 0.12 }}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
        selected
          ? 'bg-secondary border-l-2 border-l-primary'
          : 'hover:bg-secondary/50 border-l-2 border-l-transparent'
      )}
      role="option"
      aria-selected={selected}
      id={`command-item-${index}`}
    >
      {Icon && (
        <motion.div
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}
      {!Icon && <div className="w-8 shrink-0" />}
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          selected ? 'text-foreground' : 'text-foreground/90'
        )}>
          {command.title}
        </p>
        {command.description && (
          <p className="text-xs text-muted-foreground truncate">
            {command.description}
          </p>
        )}
      </div>
      
      {command.shortcut && (
        <div className="flex items-center gap-1 shrink-0">
          {command.shortcut.split(' ').map((key, i) => (
            <kbd
              key={i}
              className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-muted-foreground font-mono"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
    </motion.div>
  )
}
