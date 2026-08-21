import { NestAvatar } from '@/common/components/nest-avatar'
import Link from 'next/link'
import { NestReference } from '../nest.types'

export type NestReferenceItemProps = {
  nest: NestReference
}

export function NestReferenceItem({ nest }: NestReferenceItemProps) {
  return (
    <Link href={`/n/${nest.slug}`} className='flex items-center gap-2 truncate rounded-md px-3 py-1.5 text-sm hover:bg-muted'>
      <NestAvatar name={nest.name} slug={nest.slug} size={22} />
      <span className='truncate'>{nest.name}</span>
    </Link>
  )
}
