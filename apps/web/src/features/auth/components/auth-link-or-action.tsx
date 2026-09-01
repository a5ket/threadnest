import Link from 'next/link'
import { ReactNode } from 'react'

interface AuthLinkOrActionProps {
  href: string
  onAction?: () => void
  className?: string
  children: ReactNode
}

// In the dedicated /login, /register, /reset-password pages this navigates like a normal link.
// Inside the auth modal, an onAction callback is passed instead so it switches the modal's
// view in place rather than navigating away and closing the modal's context.
export function AuthLinkOrAction({ href, onAction, className, children }: AuthLinkOrActionProps) {
  if (onAction) {
    return (
      <button type='button' onClick={onAction} className={className}>
        {children}
      </button>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
