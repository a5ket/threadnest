import { PropsWithChildren } from 'react'

export type AppShellProps = {
  header?: React.ReactNode
  sidebar?: React.ReactNode
  rightRail?: React.ReactNode
} & PropsWithChildren

export function AppShell({ header, sidebar, rightRail, children }: AppShellProps) {
  return (
    <div className='flex h-full flex-col'>
      {header}

      <div className='flex min-h-0 flex-1'>
        {sidebar}

        <main className='min-w-0 flex-1 overflow-y-auto'>
          {children}
        </main>

        {rightRail}
      </div>
    </div>
  )
}
