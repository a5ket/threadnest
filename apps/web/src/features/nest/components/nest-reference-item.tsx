import Link from 'next/link'
import { NestReference } from '../nest.types'

export type NestReferenceItemProps = {
  nest: NestReference
}

export function NestReferenceItem({ nest }: NestReferenceItemProps) {
  return (
    <Link href={`/n/${nest.slug}`} className='block truncate rounded-md px-3 py-1.5 text-sm hover:bg-muted'>
      {nest.name}
    </Link>
  )
}
