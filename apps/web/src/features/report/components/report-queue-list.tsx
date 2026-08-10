import { ReportQueueItem } from './report-queue-item'
import type { Report } from '@/features/report/report.types'

interface ReportQueueListProps {
  nestSlug: string
  reports: Report[]
}

export function ReportQueueList({ nestSlug, reports }: ReportQueueListProps) {
  return (
    <ul className='flex flex-col gap-3'>
      {reports.map((report) => (
        <ReportQueueItem key={report.id} nestSlug={nestSlug} report={report} />
      ))}

      {reports.length === 0 && (
        <p className='text-sm text-muted-foreground'>No reports.</p>
      )}
    </ul>
  )
}
