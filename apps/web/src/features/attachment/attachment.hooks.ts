'use client'

import { createMutationHook } from '@/common/api-mutation'
import { attachmentUpload } from '@/generated/api/attachments/attachments'

export const useUploadAttachment = createMutationHook(
  (file: File) => attachmentUpload({ file }),
  200
)
