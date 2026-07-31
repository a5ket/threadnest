'use client'

import { getQueryClient } from '@/common/query-client'
import { MeStoreProvider } from '@/features/me/components/me-store-provider'
import type { BootstrapData } from '@/features/me/me.types'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({
  initialMe,
  children
}: {
  initialMe: BootstrapData | null
  children: React.ReactNode
}) {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <MeStoreProvider initialData={initialMe}>
        {children}
      </MeStoreProvider>
    </QueryClientProvider>
  )
}
