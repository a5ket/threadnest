'use client'

import { CreateThreadForm } from '@/features/thread/components/create-thread-form'
import { useParams, useRouter } from 'next/navigation'

export default function NewThreadPage() {
  const router = useRouter()
  const { nestSlug } = useParams<{ nestSlug: string }>()

  return (
    <div className='flex justify-center p-6'>
      <CreateThreadForm
        nestSlug={nestSlug}
        onCreated={(thread) => router.push(`/n/${nestSlug}/t/${thread.slug}`)}
      />
    </div>
  )
}
