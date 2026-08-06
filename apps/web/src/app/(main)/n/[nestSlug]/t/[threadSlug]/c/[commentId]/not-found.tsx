export default function CommentNotFound() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-lg font-semibold'>Comment not found</h1>
      <p className='text-sm text-muted-foreground'>This comment doesn&apos;t exist, or you can&apos;t view it.</p>
    </div>
  )
}
