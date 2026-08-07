'use client'

import { createMutationHook } from '@/common/api-mutation'
import { ThreadCreateDto, ThreadUpdateDto } from '@/generated/api/models'
import { nestThreadCreate, nestThreadDelete, nestThreadLock, nestThreadPin, nestThreadUnlock, nestThreadUnpin, nestThreadUpdate } from './thread.api'

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

export const useLockThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadLock(nestSlug, threadSlug),
  200
)

export const useUnlockThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadUnlock(nestSlug, threadSlug),
  200
)

export const usePinThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadPin(nestSlug, threadSlug),
  200
)

export const useUnpinThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadUnpin(nestSlug, threadSlug),
  200
)
