'use client'

import { useNestStore } from '@/features/nest/components/nest-store-provider'

export default function NestPage() {
  const nest = useNestStore((state) => state.nest)

  return (
    <div>
      nest
      <div>
        Nest:
        {nest.name}
      </div>
      <div>
        Description:
        {nest.description}
      </div>
      <div>
        Counts:
        {nest.memberCount}
        {nest.threadCount}
      </div>
      <pre>{JSON.stringify(nest, null, 2)}</pre>
    </div>
  )
}
