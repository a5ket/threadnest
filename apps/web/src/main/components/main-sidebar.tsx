import { useIsSignedIn, useMeNests } from '@/features/me/me.hooks'
import { NestReferenceItem } from '@/features/nest/components/nest-reference-item'
import { CreateNestButton } from './create-nest-button'

export function MainSidebar() {
  const isSignedIn = useIsSignedIn()
  const userNests = useMeNests()

  return (
    <div className='bg-green-500 flex flex-col h-full'>
      <div>
        {isSignedIn ? 'Signed In' : 'Unsigned In'}
      </div>
      <div>
        Nests
        {userNests.map((nest) => <NestReferenceItem key={nest.slug} nest={nest} />)}
        <CreateNestButton />
      </div>

    </div>
  )
}
