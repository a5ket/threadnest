import { PlatformActionLogFilterBar } from '@/features/platform-action-log/components/platform-action-log-filter-bar'
import { PlatformActionLogList } from '@/features/platform-action-log/components/platform-action-log-list'
import { getPlatformActionLogsServer } from '@/features/platform-action-log/platform-action-log.server'
import { PlatformActionLogFilters } from '@/features/platform-action-log/platform-action-log.types'
import { PlatformActionLogResponseDtoType } from '@/generated/api/models'

interface AdminActionLogsPageProps {
  searchParams: Promise<{
    type?: string
    actorId?: string
    targetUserId?: string
    nestId?: string
    createdAfter?: string
    createdBefore?: string
  }>
}

const TYPE_VALUES: string[] = Object.values(PlatformActionLogResponseDtoType)

export default async function AdminActionLogsPage({ searchParams }: AdminActionLogsPageProps) {
  const params = await searchParams

  const filters: PlatformActionLogFilters = {
    type: params.type && TYPE_VALUES.includes(params.type) ? (params.type as PlatformActionLogResponseDtoType) : undefined,
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    nestId: params.nestId,
    createdAfter: params.createdAfter,
    createdBefore: params.createdBefore
  }

  const page = await getPlatformActionLogsServer(filters)

  return (
    <div className='flex flex-col gap-6 p-6'>
      <h1 className='text-lg font-semibold'>Platform action log</h1>

      <PlatformActionLogFilterBar />

      <PlatformActionLogList filters={filters} initialPage={page} />
    </div>
  )
}
