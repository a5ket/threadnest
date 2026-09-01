'use client'

import { getQueryClient } from '@/common/query-client'
import { SocketProvider } from '@/common/realtime/socket-provider'
import { MeStoreProvider } from '@/features/me/components/me-store-provider'
import type { MeBootstrapResult } from '@/features/me/me.types'
import { NotificationSocketListener } from '@/features/notification/components/notification-socket-listener'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({
  initialMe,
  children
}: {
  initialMe: MeBootstrapResult
  children: React.ReactNode
}) {
  const [queryClient] = useState(getQueryClient)

  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <QueryClientProvider client={queryClient}>
        <MeStoreProvider initialMe={initialMe}>
          <SocketProvider>
            <NotificationSocketListener />
            {children}
          </SocketProvider>
        </MeStoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
