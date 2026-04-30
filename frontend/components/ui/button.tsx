import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base: Notion-style — 빠른 transition, active 시 scale down
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold tracking-[-0.1px]",
    "transition-all duration-150 ease-out",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary: 파스텔 민트 배경 + 어두운 텍스트
        default:
          'bg-primary text-primary-foreground rounded-[6px] hover:brightness-95 shadow-whisper',
        // Destructive
        destructive:
          'bg-destructive text-destructive-foreground rounded-[6px] hover:bg-destructive/90 focus-visible:ring-destructive/30',
        // Outline: whisper border, secondary hover
        outline:
          'border border-border bg-card text-foreground rounded-[6px] hover:bg-secondary hover:scale-[1.01] shadow-whisper',
        // Secondary: warm gray surface
        secondary:
          'bg-secondary text-secondary-foreground rounded-[6px] hover:bg-secondary/80 hover:scale-[1.01]',
        // Ghost: transparent, accent on hover
        ghost:
          'text-foreground rounded-[6px] hover:bg-accent hover:text-accent-foreground',
        // Link: text only
        link:
          'text-primary underline-offset-4 hover:underline',
        // Pill: Notion-style status badge button (full pill, tinted)
        pill:
          'rounded-full bg-accent text-accent-foreground text-xs font-semibold tracking-badge px-3 py-1 hover:brightness-95',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm:      'h-8 px-3 gap-1.5 text-xs has-[>svg]:px-2.5',
        lg:      'h-11 px-6 text-base has-[>svg]:px-4',
        xl:      'h-12 px-8 text-base',
        icon:    'size-9',
        'icon-sm':  'size-8',
        'icon-lg':  'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
