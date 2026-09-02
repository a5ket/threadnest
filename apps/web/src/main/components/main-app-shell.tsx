'use client'

import type { NestDiscoveryItem } from '@/features/nest/nest.types'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useState } from 'react'
import { AppRightrail } from '../../common/components/app-rightrail'
import { AppShell } from '../../common/components/app-shell'
import { RightRailProvider } from '../../common/components/right-rail-context'
import { SidebarDrawer } from '../../common/components/sidebar-drawer'
import { MainHeader } from './main-header'
import { MainSidebar } from './main-sidebar'

interface MainAppShellProps extends PropsWithChildren {
  popularNests: NestDiscoveryItem[]
}

export function MainAppShell({ children, popularNests }: MainAppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setSidebarOpen(false)
  }

  const sidebar = <MainSidebar />

  return (
    <RightRailProvider>
      <div className='flex h-screen flex-col'>
        <MainHeader
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className='relative min-h-0 flex-1 overflow-hidden'>
          <AppShell
            sidebar={(
              <aside className='hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-canvas xl:block'>
                {sidebar}
              </aside>
            )}
            rightRail={<AppRightrail popularNests={popularNests} />}
          >
            {children}
          </AppShell>

          <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
            {sidebar}
          </SidebarDrawer>
        </div>
      </div>
    </RightRailProvider>
  )
}
