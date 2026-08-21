import { SettingsNav } from '@/main/components/settings-nav'

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='flex flex-1 flex-col gap-6 p-6 md:flex-row md:gap-8'>
      <aside className='shrink-0 md:w-48'>
        <h1 className='mb-3 px-3 text-lg font-semibold md:hidden'>Settings</h1>
        <SettingsNav />
      </aside>

      <div className='min-w-0 flex-1'>
        {children}
      </div>
    </div>
  )
}
