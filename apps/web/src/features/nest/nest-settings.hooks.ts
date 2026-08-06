'use client'

import { createMutationHook } from '@/common/api-mutation'
import { NestSettingsUpdateDto } from '@/generated/api/models'
import { nestSettingsUpdate } from './nest-settings.api'

export const useUpdateNestSettings = createMutationHook(
  ({ nestSlug, ...dto }: { nestSlug: string } & NestSettingsUpdateDto) => nestSettingsUpdate(nestSlug, dto),
  200
)
