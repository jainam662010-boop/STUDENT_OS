'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Sparkles, X, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useToast } from '@/components/ui/toast'
import { parseQuickCapture, formatQuickPreview } from '@/lib/quick-capture'
import { cn } from '@/lib/utils'
import { spring } from './motion'

export function QuickCapture({ expanded: externalExpanded, onClose: externalOnClose }: {
  expanded?: boolean
  onClose?: () => void
}) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof parseQuickCapture> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useStore((s) => s.addTask)
  const addXP = useStore((s) => s.addXP)
  const { showToast } = useToast()

  const isControlled = externalExpanded !== undefined
  const expanded = isControlled ? externalExpanded : internalExpanded
  const setExpanded = useCallback((v: boolean) => {
    if (isControlled) {
      if (!v) externalOnClose?.()
    } else {
      setInternalExpanded(v)
    }
  }, [isControlled, externalOnClose])

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  useEffect(() => {
    if (input.trim().length > 3) {
      const parsed = parseQuickCapture(input)
      setPreview(parsed)
    } else {
      setPreview(null)
    }
  }, [input])

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    const parsed = parseQuickCapture(input)
    addTask({
      title: parsed.title,
      description: parsed.subject ? `Subject: ${parsed.subject}` : undefined,
      subject: parsed.subject,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      tags: parsed.tags,
      status: 'todo',
    })
    addXP(10)
    showToast({
      type: 'xp',
      title: 'Task captured!',
      description: `+10 XP · "${parsed.title.slice(0, 40)}${parsed.title.length > 40 ? '…' : ''}"`,
    })
    setInput('')
    setPreview(null)
    setExpanded(false)
  }, [input, addTask, addXP, showToast, setExpanded])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setExpanded(false)
      setInput('')
      setPreview(null)
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {!expanded ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setExpanded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20"
            aria-label="Quick capture task"
          >
            <Zap className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={spring.bouncy}
            className="absolute bottom-full right-0 mb-2 w-80 sm:w-96"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Quick Capture</span>
                <button
                  onClick={() => { setExpanded(false); setInput(''); setPreview(null) }}
                  className="ml-auto p-1 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Study physics tomorrow at 2pm #exam"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground/40"
                  aria-label="Task description"
                />

                <AnimatePresence>
                  {preview && preview.title && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mt-2 pt-2 border-t border-border"
                    >
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                        <span>{formatQuickPreview(preview)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-t border-border">
                <div className="flex gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground font-mono">⏎</kbd>
                  <span className="text-[10px] text-muted-foreground">Add</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    input.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-muted-foreground/40 cursor-not-allowed'
                  )}
                >
                  Add Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
