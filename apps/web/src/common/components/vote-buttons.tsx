'use client'

type VoteValue = 'UPVOTE' | 'DOWNVOTE'

interface VoteButtonsProps {
  score: number
  viewerVote: VoteValue | null | undefined
  disabled?: boolean
  onUpvote: () => void
  onDownvote: () => void
  onRemove: () => void
}

export function VoteButtons({ score, viewerVote, disabled, onUpvote, onDownvote, onRemove }: VoteButtonsProps) {
  return (
    <div className='flex items-center gap-1'>
      <button
        type='button'
        disabled={disabled}
        aria-pressed={viewerVote === 'UPVOTE'}
        aria-label='Upvote'
        onClick={() => (viewerVote === 'UPVOTE' ? onRemove() : onUpvote())}
        className={`rounded px-1 leading-none disabled:opacity-50 ${viewerVote === 'UPVOTE' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        ▲
      </button>

      <span className='min-w-[1.5rem] text-center text-sm tabular-nums'>{score}</span>

      <button
        type='button'
        disabled={disabled}
        aria-pressed={viewerVote === 'DOWNVOTE'}
        aria-label='Downvote'
        onClick={() => (viewerVote === 'DOWNVOTE' ? onRemove() : onDownvote())}
        className={`rounded px-1 leading-none disabled:opacity-50 ${viewerVote === 'DOWNVOTE' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
      >
        ▼
      </button>
    </div>
  )
}
