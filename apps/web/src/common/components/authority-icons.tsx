// Outline shield for nest-moderator actions (scoped to their own community).
export function ModeratorIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.75' className='h-3.5 w-3.5'>
      <path d='M10 2.5l6 2.2v4.3c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8V4.7l6-2.2Z' strokeLinejoin='round' />
    </svg>
  )
}

// Filled shield for platform-authority actions (bypasses nest moderation, site-wide).
export function PlatformIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor' className='h-3.5 w-3.5'>
      <path d='M10 2l6.2 2.3v4.4c0 4.2-2.7 7-6.2 8.3-3.5-1.3-6.2-4.1-6.2-8.3V4.3L10 2Z' />
    </svg>
  )
}
