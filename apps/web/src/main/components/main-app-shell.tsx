'use client'

import { usePathname } from 'next/navigation'
import { PropsWithChildren, useState } from 'react'
import { AppRightrail } from '../../common/components/app-rightrail'
import { AppShell } from '../../common/components/app-shell'
import { SidebarDrawer } from '../../common/components/sidebar-drawer'
import { MainHeader } from './main-header'
import { MainSidebar } from './main-sidebar'

export function MainAppShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setSidebarOpen(false)
  }

  const sidebar = <MainSidebar />

  return (
    <div className='flex h-screen flex-col'>
      <MainHeader
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />

      <div className='relative min-h-0 flex-1 overflow-hidden'>
        <AppShell
          sidebar={(
            <aside className='hidden w-64 shrink-0 overflow-y-auto border-r xl:block'>
              {sidebar}
            </aside>
          )}
          rightRail={(
            <aside className='hidden w-80 shrink-0 overflow-y-auto border-l lg:block'>
              <AppRightrail />
            </aside>
          )}
        >
          {children}
        </AppShell>

        <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          {sidebar}
        </SidebarDrawer>
      </div>
    </div>
  )
}
