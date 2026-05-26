'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { createCommandRegistry } from './action-registry'
import { CommandPaletteItem } from './command-palette-item'
import { CATEGORY_ORDER, CATEGORY_LABELS, type CommandAction, type CommandGroup } from './types'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { commandPanel, modalBackdrop } from '@/components/motion'

export function CommandPalette() {
  const isOpen = useStore((s) => s.commandPaletteOpen)
  const setOpen = useStore((s) => s.setCommandPaletteOpen)

  const activeView = useStore((s) => s.activeView)
  const theme = useStore((s) => s.theme)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setActiveView = useStore((s) => s.setActiveView)
  const setTheme = useStore((s) => s.setTheme)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const startFocusSession = useStore((s) => s.startFocusSession)

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const sidebarOpenRef = useRef(sidebarOpen)
  sidebarOpenRef.current = sidebarOpen

  const handleClose = useCallback(() => {
    setSearch('')
    setSelectedIndex(0)
    setOpen(false)
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [setOpen])

  useKeyboardShortcut(
    { key: 'k', meta: true, ctrl: true },
    useCallback(() => {
      if (!isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement
      }
      setOpen(!isOpen)
    }, [isOpen, setOpen])
  )

  useKeyboardShortcut(
    { key: 'Escape' },
    useCallback(() => {
      if (isOpen) handleClose()
    }, [isOpen, handleClose])
  )

  const commands = useMemo(() => {
    return createCommandRegistry({
      setActiveView: setActiveView as any,
      setTheme: setTheme as any,
      setSidebarOpen,
      sidebarOpen: sidebarOpenRef.current,
      startFocusSession: startFocusSession as any,
    })
  }, [setActiveView, setTheme, setSidebarOpen, startFocusSession])

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands

    const term = search.toLowerCase()
    return commands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(term)) return true
      if (cmd.description?.toLowerCase().includes(term)) return true
      if (cmd.keywords.some((k) => k.toLowerCase().includes(term))) return true
      return false
    })
  }, [commands, search])

  const groupedCommands = useMemo((): CommandGroup[] => {
    const groups: CommandGroup[] = []

    for (const category of CATEGORY_ORDER) {
      const categoryCommands = filteredCommands.filter((c) => c.category === category)
      if (categoryCommands.length > 0) {
        groups.push({
          category,
          label: CATEGORY_LABELS[category],
          commands: categoryCommands,
        })
      }
    }

    return groups
  }, [filteredCommands])

  const flatList = useMemo(() => {
    return filteredCommands
  }, [filteredCommands])

  const executeCommand = useCallback((command: CommandAction) => {
    handleClose()
    setTimeout(() => {
      command.execute()
    }, 50)
  }, [handleClose])

  useEffect(() => {
    document.body.classList.toggle('scroll-locked', isOpen)
    return () => document.body.classList.remove('scroll-locked')
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(flatList.length - 1, 0)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flatList[selectedIndex]) {
          executeCommand(flatList[selectedIndex])
        }
      } else if (e.key === 'Backspace' && !search) {
        handleClose()
      }
    },
    [flatList, selectedIndex, search, executeCommand, handleClose]
  )

  let flatIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-start lg:items-center justify-center pt-24 lg:pt-0 px-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            variants={commandPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden"
            ref={containerRef}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-base text-foreground placeholder:text-muted-foreground/50"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-activedescendant={
                  flatList[selectedIndex] ? `command-item-${selectedIndex}` : undefined
                }
                aria-controls="command-list"
              />
              <motion.button
                onClick={handleClose}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            <div
              id="command-list"
              role="listbox"
              className="max-h-80 overflow-y-auto"
            >
              {groupedCommands.length > 0 ? (
                groupedCommands.map((group) => (
                  <div key={group.category}>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                    </div>
                    {group.commands.map((command) => {
                      const currentIndex = flatIndex
                      flatIndex++
                      return (
                        <CommandPaletteItem
                          key={command.id}
                          command={command}
                          selected={currentIndex === selectedIndex}
                          onSelect={() => executeCommand(command)}
                          index={currentIndex}
                        />
                      )
                    })}
                  </div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center"
                >
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No commands found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </motion.div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-secondary/30">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-secondary/80">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-secondary/80">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-secondary/80">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-secondary/80">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
