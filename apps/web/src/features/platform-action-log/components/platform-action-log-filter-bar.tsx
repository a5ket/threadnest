'use client'

import { PlatformActionLogResponseDtoType } from '@/generated/api/models'
import { userGetByUsername } from '@/generated/api/users/users'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const TYPE_OPTIONS = Object.values(PlatformActionLogResponseDtoType)

const TYPE_LABELS: Record<PlatformActionLogResponseDtoType, string> = {
  ROLE_GRANTED: 'Role granted',
  ROLE_CHANGED: 'Role changed',
  ROLE_REVOKED: 'Role revoked',
  USER_SUSPENDED: 'User suspended',
  USER_UNSUSPENDED: 'User unsuspended',
  THREAD_REMOVED: 'Thread removed',
  COMMENT_REMOVED: 'Comment removed',
  CONTENT_BULK_REMOVED: 'Content bulk removed',
  REPORT_REVIEWED: 'Report reviewed'
}

export function PlatformActionLogFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [actorUsername, setActorUsername] = useState('')
  const [targetUsername, setTargetUsername] = useState('')
  const [createdAfter, setCreatedAfter] = useState(searchParams.get('createdAfter')?.slice(0, 10) ?? '')
  const [createdBefore, setCreatedBefore] = useState(searchParams.get('createdBefore')?.slice(0, 10) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const nestId = searchParams.get('nestId')
  const nestSlug = searchParams.get('nestSlug')

  const applyFilters = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsResolving(true)

    try {
      const params = new URLSearchParams()

      if (type) params.set('type', type)
      if (nestId) params.set('nestId', nestId)
      if (nestSlug) params.set('nestSlug', nestSlug)
      if (createdAfter) params.set('createdAfter', createdAfter)
      if (createdBefore) params.set('createdBefore', createdBefore)

      if (actorUsername.trim()) {
        const result = await userGetByUsername(actorUsername.trim())
        if (result.status !== 200) {
          setError(`No user found with username "${actorUsername.trim()}".`)
          return
        }
        params.set('actorId', result.data.data.userId)
      }

      if (targetUsername.trim()) {
        const result = await userGetByUsername(targetUsername.trim())
        if (result.status !== 200) {
          setError(`No user found with username "${targetUsername.trim()}".`)
          return
        }
        params.set('targetUserId', result.data.data.userId)
      }

      router.push(`${pathname}?${params.toString()}`)
    }
    catch {
      setError('Unable to connect. Check your internet connection.')
    }
    finally {
      setIsResolving(false)
    }
  }

  const clearFilters = () => {
    setType('')
    setActorUsername('')
    setTargetUsername('')
    setCreatedAfter('')
    setCreatedBefore('')
    setError(null)
    router.push(pathname)
  }

  const hasActiveFilters = searchParams.size > 0

  return (
    <form onSubmit={applyFilters} className='flex flex-col gap-3 rounded-md border border-border p-4'>
      <div className='flex flex-wrap items-end gap-3'>
        <label className='flex flex-col gap-1 text-xs text-muted-foreground'>
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className='rounded-md border border-input bg-background px-2 py-1.5 text-sm'
          >
            <option value=''>All</option>
            {TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>{TYPE_LABELS[value]}</option>
            ))}
          </select>
        </label>

        <label className='flex flex-col gap-1 text-xs text-muted-foreground'>
          Actor username
          <input
            type='text'
            value={actorUsername}
            onChange={(e) => setActorUsername(e.target.value)}
            placeholder='e.g. alice'
            autoComplete='off'
            className='rounded-md border border-input bg-background px-2 py-1.5 text-sm'
          />
        </label>

        <label className='flex flex-col gap-1 text-xs text-muted-foreground'>
          Target username
          <input
            type='text'
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder='e.g. bob'
            autoComplete='off'
            className='rounded-md border border-input bg-background px-2 py-1.5 text-sm'
          />
        </label>

        <label className='flex flex-col gap-1 text-xs text-muted-foreground'>
          From
          <input
            type='date'
            value={createdAfter}
            onChange={(e) => setCreatedAfter(e.target.value)}
            className='rounded-md border border-input bg-background px-2 py-1.5 text-sm'
          />
        </label>

        <label className='flex flex-col gap-1 text-xs text-muted-foreground'>
          To
          <input
            type='date'
            value={createdBefore}
            onChange={(e) => setCreatedBefore(e.target.value)}
            className='rounded-md border border-input bg-background px-2 py-1.5 text-sm'
          />
        </label>

        <button
          type='submit'
          disabled={isResolving}
          className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isResolving ? 'Applying...' : 'Apply'}
        </button>

        {hasActiveFilters && (
          <button
            type='button'
            onClick={clearFilters}
            className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
          >
            Clear
          </button>
        )}
      </div>

      {nestSlug && (
        <p className='text-xs text-muted-foreground'>
          {'Filtering by nest: '}
          <span className='font-medium text-foreground'>{nestSlug}</span>
        </p>
      )}

      {error && (
        <p role='alert' className='text-sm text-destructive'>{error}</p>
      )}
    </form>
  )
}
