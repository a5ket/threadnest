'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestCreate } from './nest.api'

export const useCreateNest = createMutationHook(nestCreate, 201)
