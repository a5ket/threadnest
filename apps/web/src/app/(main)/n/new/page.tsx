'use client'

import { CreateNestForm } from '@/features/nest/components/create-nest-form'
import { useRouter } from 'next/navigation'

export default function NewNestPage() {
  const router = useRouter()

  return (
    <div className='flex justify-center p-6'>
      <CreateNestForm onCreated={(nest) => router.push(`/n/${nest.slug}`)} />
    </div>
  )
}
