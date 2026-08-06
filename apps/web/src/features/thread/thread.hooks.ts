'use client'

import { createMutationHook } from '@/common/api-mutation'
import { ThreadCreateDto, ThreadUpdateDto } from '@/generated/api/models'
import { nestThreadCreate, nestThreadDelete, nestThreadUpdate } from './thread.api'

export const useCreateThread = createMutationHook(
  ({ nestSlug, ...dto }: { nestSlug: string } & ThreadCreateDto) => nestThreadCreate(nestSlug, dto),
  201
)

export const useUpdateThread = createMutationHook(
  ({ nestSlug, threadSlug, ...dto }: { nestSlug: string, threadSlug: string } & ThreadUpdateDto) =>
    nestThreadUpdate(nestSlug, threadSlug, dto),
  200
)

export const useDeleteThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadDelete(nestSlug, threadSlug),
  204
)
