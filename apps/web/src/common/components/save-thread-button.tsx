'use client'

interface SaveThreadButtonProps {
  saved: boolean
  disabled?: boolean
  onSave: () => void
  onUnsave: () => void
}

export function SaveThreadButton({ saved, disabled, onSave, onUnsave }: SaveThreadButtonProps) {
  return (
    <button
      type='button'
      disabled={disabled}
      aria-pressed={saved}
      onClick={() => (saved ? onUnsave() : onSave())}
      className={`text-sm hover:underline disabled:opacity-50 ${saved ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
