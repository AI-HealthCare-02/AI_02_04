import * as React from 'react'

import { cn } from '@/lib/utils'

// Notion-style input: clean warm border, soft focus ring
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        'h-10 w-full min-w-0 px-3 py-2',
        // Typography
        'text-sm text-foreground placeholder:text-muted-foreground',
        // Surface
        'bg-card rounded-[6px]',
        // Notion whisper border
        'border border-border',
        // Transition
        'transition-[border-color,box-shadow] duration-150',
        // Focus: primary-tinted ring
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        // File input
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        // States
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        // Dark mode
        'dark:bg-input/30',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
