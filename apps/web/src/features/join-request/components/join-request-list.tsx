import { JoinRequestItem } from './join-request-item'
import type { JoinRequest } from '@/features/join-request/join-request.types'

interface JoinRequestListProps {
  nestSlug: string
  requests: JoinRequest[]
}

export function JoinRequestList({ nestSlug, requests }: JoinRequestListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {requests.map((request) => (
        <JoinRequestItem key={request.id} nestSlug={nestSlug} request={request} />
      ))}

      {requests.length === 0 && (
        <p className='text-sm text-muted-foreground'>No join requests yet.</p>
      )}
    </ul>
  )
}
