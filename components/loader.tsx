'use client'

import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function Loader({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)} role="status" aria-label="Loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.div
          className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{
                opacity: [0.3, 1, 0.3],
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Student OS</p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">Built by Jainam</p>
      </motion.div>
    </div>
  )
}
