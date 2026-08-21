import { SortTabLink } from '@/common/components/sort-tab-link'
import { PlatformReportQueueList } from '@/features/platform-report/components/platform-report-queue-list'
import { getPlatformReportsServer } from '@/features/platform-report/platform-report.server'
import { PlatformReportListStatus } from '@/generated/api/models'

const STATUS_TABS: { label: string, param: string, value: PlatformReportListStatus | undefined }[] = [
  { label: 'Pending', param: 'pending', value: PlatformReportListStatus.PENDING },
  { label: 'Resolved', param: 'resolved', value: PlatformReportListStatus.RESOLVED },
  { label: 'Dismissed', param: 'dismissed', value: PlatformReportListStatus.DISMISSED },
  { label: 'All', param: 'all', value: undefined }
]

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const activeTab = STATUS_TABS.find((tab) => tab.param === statusParam) ?? STATUS_TABS[0]
  const status = activeTab.value

  const reports = await getPlatformReportsServer(status)

  return (
    <div className='flex flex-col gap-6 p-6'>
      <h1 className='text-lg font-semibold'>Platform reports</h1>

      <div className='flex items-center gap-2'>
        {STATUS_TABS.map((tab) => (
          <SortTabLink key={tab.label} href={`/admin?status=${tab.param}`} active={activeTab.param === tab.param}>
            {tab.label}
          </SortTabLink>
        ))}
      </div>

      <PlatformReportQueueList reports={reports} />
    </div>
  )
}
