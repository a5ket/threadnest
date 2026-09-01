export function AuthDivider() {
  return (
    <div className='flex items-center gap-3'>
      <div className='h-px flex-1 bg-border' />
      <span className='text-xs text-muted-foreground'>or continue with email</span>
      <div className='h-px flex-1 bg-border' />
    </div>
  )
}
