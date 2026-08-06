'use client'

import { createMutationHook } from '@/common/api-mutation'
import { ThreadCreateDto } from '@/generated/api/models'
import { nestThreadCreate } from './thread.api'

export const useCreateThread = createMutationHook(
  ({ nestSlug, ...dto }: { nestSlug: string } & ThreadCreateDto) => nestThreadCreate(nestSlug, dto),
  201
)
