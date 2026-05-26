import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl',
          'transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'active:scale-[0.97] hover:scale-[1.02]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100',
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/15',
          variant === 'secondary' && 'bg-secondary hover:bg-secondary/80 text-foreground',
          variant === 'ghost' && 'hover:bg-secondary text-muted-foreground hover:text-foreground',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:opacity-90',
          size === 'sm' && 'px-2.5 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-5 py-2.5 text-sm',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
