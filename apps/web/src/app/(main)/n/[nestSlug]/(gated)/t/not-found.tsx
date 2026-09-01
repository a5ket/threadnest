import { NotFoundState } from '@/common/components/not-found-state'

export default function ThreadNotFound() {
  return (
    <NotFoundState
      title='Thread not found'
      description="This thread doesn't exist, or you can't view it."
    />
  )
}
