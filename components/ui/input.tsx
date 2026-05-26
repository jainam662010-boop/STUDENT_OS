import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-secondary border-0 focus:ring-1 focus:ring-ring outline-none text-sm placeholder:text-muted-foreground transition-shadow',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-secondary border-0 focus:ring-1 focus:ring-ring outline-none text-sm resize-none placeholder:text-muted-foreground transition-shadow',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</label>}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-secondary border-0 focus:ring-1 focus:ring-ring outline-none text-sm transition-shadow',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'
