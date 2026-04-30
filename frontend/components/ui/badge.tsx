import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Notion-style badges: full pill shape, tinted backgrounds, micro-tracking
const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full',                      // Notion: 9999px full pill
    'px-2.5 py-0.5',
    'text-xs font-semibold tracking-badge',  // Notion: +0.125px at small sizes
    'w-fit whitespace-nowrap shrink-0',
    '[&>svg]:size-3 gap-1 [&>svg]:pointer-events-none',
    'transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
    'overflow-hidden',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary tint: 파스텔 민트 배경 (Notion badge blue 계열)
        default:
          'bg-[var(--badge-bg)] text-[var(--badge-fg)] border border-transparent [a&]:hover:brightness-95',
        // Secondary: warm gray tint
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent [a&]:hover:bg-secondary/80',
        // Destructive
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/20 [a&]:hover:bg-destructive/15 focus-visible:ring-destructive/20',
        // Outline: whisper border only
        outline:
          'text-foreground border border-border bg-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // Success: 녹색 계열
        success:
          'bg-success/15 text-success border border-success/20 [a&]:hover:bg-success/20',
        // Warning: 주황 계열
        warning:
          'bg-warning/15 text-warning-foreground border border-warning/20 [a&]:hover:bg-warning/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
