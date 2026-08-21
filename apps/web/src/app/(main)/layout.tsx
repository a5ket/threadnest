import { AuthOverlay } from '@/features/auth/components/auth-overlay'
import { getNestsServer } from '@/features/nest/nest.server'
import { NestListSortBy } from '@/generated/api/models'
import { MainAppShell } from '@/main/components/main-app-shell'

export default async function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const popularNests = await getNestsServer(NestListSortBy.memberCount)

  return (
    <MainAppShell popularNests={popularNests.items.slice(0, 5)}>
      {children}
      <AuthOverlay />
    </MainAppShell>
  )
}
