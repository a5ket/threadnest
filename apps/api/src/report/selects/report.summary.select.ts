import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const REPORT_SUMMARY_SELECT = {
  id: true,
  targetType: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  reporter: { select: USER_REFERENCE_SELECT },
  resolvedBy: { select: USER_REFERENCE_SELECT },
  thread: { select: { id: true, slug: true, title: true } },
  comment: { select: { id: true, content: true, thread: { select: { slug: true, title: true } } } }
} satisfies Prisma.ContentReportSelect
