import { NotFoundState } from '@/common/components/not-found-state'

export default function CommentNotFound() {
  return (
    <NotFoundState
      title='Comment not found'
      description="This comment doesn't exist, or you can't view it."
    />
  )
}
