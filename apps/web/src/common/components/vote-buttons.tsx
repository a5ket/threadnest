'use client'

type VoteValue = 'UPVOTE' | 'DOWNVOTE'

interface VoteButtonsProps {
  score: number
  viewerVote: VoteValue | null | undefined
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  onUpvote: () => void
  onDownvote: () => void
  onRemove: () => void
}

function UpvoteIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
      <path d='M4 12l6-6 6 6' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

function DownvoteIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
      <path d='M4 8l6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export function VoteButtons({ score, viewerVote, disabled, orientation = 'horizontal', onUpvote, onDownvote, onRemove }: VoteButtonsProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div className={`flex items-center ${isVertical ? 'flex-col gap-0.5' : 'gap-1'}`}>
      <button
        type='button'
        disabled={disabled}
        aria-pressed={viewerVote === 'UPVOTE'}
        aria-label='Upvote'
        onClick={() => (viewerVote === 'UPVOTE' ? onRemove() : onUpvote())}
        className={`flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50 ${viewerVote === 'UPVOTE' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <UpvoteIcon />
      </button>

      <span className='min-w-[1.5rem] text-center text-sm font-medium tabular-nums'>{score}</span>

      <button
        type='button'
        disabled={disabled}
        aria-pressed={viewerVote === 'DOWNVOTE'}
        aria-label='Downvote'
        onClick={() => (viewerVote === 'DOWNVOTE' ? onRemove() : onDownvote())}
        className={`flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50 ${viewerVote === 'DOWNVOTE' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <DownvoteIcon />
      </button>
    </div>
  )
}
