import { ReactNode } from 'react'

export type BadgeVariant = 'neutral' | 'brand' | 'owner' | 'moderator' | 'success' | 'warning' | 'destructive'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-accent text-accent-foreground',
  owner: 'bg-owner/10 text-owner',
  moderator: 'bg-moderator/10 text-moderator',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive'
}

// A matching `border-l-*` class for cards that want to echo a Badge's state as a left accent stripe.
export const BADGE_ACCENT_BORDER: Record<BadgeVariant, string> = {
  neutral: 'border-l-border',
  brand: 'border-l-primary',
  owner: 'border-l-owner',
  moderator: 'border-l-moderator',
  success: 'border-l-success',
  warning: 'border-l-warning',
  destructive: 'border-l-destructive'
}

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', size = 'md', children, className = '' }: BadgeProps) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'

  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium ${padding} ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  )
}
