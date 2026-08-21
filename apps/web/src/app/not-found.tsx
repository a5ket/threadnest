import { NotFoundState } from '@/common/components/not-found-state'

export default function NotFound() {
  return (
    <NotFoundState
      title='Page not found'
      description="The page you're looking for doesn't exist."
    />
  )
}
