import { NotFoundState } from '@/common/components/not-found-state'

export default function NestNotFound() {
  return (
    <NotFoundState
      title='Nest not found'
      description="This nest doesn't exist, or you can't view it."
      backHref='/discover'
      backLabel='Discover nests'
    />
  )
}
