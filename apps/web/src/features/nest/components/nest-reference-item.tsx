import Link from 'next/link'
import { NestReference } from '../nest.types'

export type NestReferenceItemProps = {
  nest: NestReference
}

export function NestReferenceItem({ nest }: NestReferenceItemProps) {
  return (
    <Link href={`/n/${nest.slug}`}>
      <div className='p-2 bg-blue-200 hover:bg-blue-400'>
        {nest.name}
      </div>
    </Link>
  )
}
