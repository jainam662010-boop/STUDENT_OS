'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { modalBackdrop, modalContent } from './motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }
  }, [open])

  useEffect(() => {
    if (!open && previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [open])

  useEffect(() => {
    document.body.classList.toggle('scroll-locked', open)
    return () => document.body.classList.remove('scroll-locked')
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()

      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            ref={contentRef}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-y-auto max-h-[90dvh]',
              className
            )}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold">{title}</h2>
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="p-5 space-y-4">
              {children}
            </div>

            {footer && (
              <div className="flex gap-3 px-5 py-4 border-t border-border">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
