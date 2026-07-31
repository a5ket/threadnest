import { AuthOverlay } from '@/features/auth/components/auth-overlay'
import { MainAppShell } from '@/main/components/main-app-shell'

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MainAppShell>
      {children}
      <AuthOverlay />
    </MainAppShell>
  )
}
