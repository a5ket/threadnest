import { PlatformReportQueueItem } from './platform-report-queue-item'
import type { PlatformReport } from '@/features/platform-report/platform-report.types'

interface PlatformReportQueueListProps {
  reports: PlatformReport[]
}

export function PlatformReportQueueList({ reports }: PlatformReportQueueListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {reports.map((report) => (
        <PlatformReportQueueItem key={report.id} report={report} />
      ))}

      {reports.length === 0 && (
        <p className='text-sm text-muted-foreground'>No reports.</p>
      )}
    </ul>
  )
}
