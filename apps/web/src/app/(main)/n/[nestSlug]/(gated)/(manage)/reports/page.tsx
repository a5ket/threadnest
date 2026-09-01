import { SortTabLink } from '@/common/components/sort-tab-link'
import { ReportQueueList } from '@/features/report/components/report-queue-list'
import { getNestReportsServer } from '@/features/report/report.server'
import { getNestServer } from '@/features/nest/nest.server'
import { NestReportListStatus } from '@/generated/api/models'
import { notFound } from 'next/navigation'

const STATUS_TABS: { label: string, param: string, value: NestReportListStatus | undefined }[] = [
  { label: 'Pending', param: 'pending', value: NestReportListStatus.PENDING },
  { label: 'Resolved', param: 'resolved', value: NestReportListStatus.RESOLVED },
  { label: 'Dismissed', param: 'dismissed', value: NestReportListStatus.DISMISSED },
  { label: 'All', param: 'all', value: undefined }
]

export default async function NestReportsPage({
  params,
  searchParams
}: {
  params: Promise<{ nestSlug: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { nestSlug } = await params
  const { status: statusParam } = await searchParams
  const activeTab = STATUS_TABS.find((tab) => tab.param === statusParam) ?? STATUS_TABS[0]
  const status = activeTab.value

  const [nest, reports] = await Promise.all([
    getNestServer(nestSlug),
    getNestReportsServer(nestSlug, status)
  ])

  if (!nest || !nest.access.canModerateContent) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Reports</h2>

      <div className='flex items-center gap-2'>
        {STATUS_TABS.map((tab) => (
          <SortTabLink key={tab.label} href={`/n/${nestSlug}/reports?status=${tab.param}`} active={activeTab.param === tab.param}>
            {tab.label}
          </SortTabLink>
        ))}
      </div>

      <ReportQueueList nestSlug={nestSlug} reports={reports} />
    </div>
  )
}
