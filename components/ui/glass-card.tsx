'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children?: React.ReactNode
  hover?: boolean
  elevated?: boolean
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, hover = false, elevated = false, glass = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glass ? 'glass-card' : elevated ? 'card-elevated' : 'card-surface',
          hover && [
            'cursor-pointer',
            'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'hover:-translate-y-0.5 hover:shadow-lg',
            'active:translate-y-0 active:scale-[0.99]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
