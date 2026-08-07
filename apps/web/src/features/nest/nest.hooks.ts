'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestCreate, nestDelete } from './nest.api'

export const useCreateNest = createMutationHook(nestCreate, 201)
export const useDeleteNest = createMutationHook(nestDelete, 204)
