'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { useDebouncedValue } from '@/common/hooks/use-debounced-value'
import { userList } from '@/generated/api/users/users'
import type { UserSearchResult } from '@/features/user/user.types'
import { Avatar } from './avatar'

interface UserSearchInputProps {
  placeholder?: string
  onSelect: (user: UserSearchResult) => void
  excludeUserIds?: string[]
  disabled?: boolean
}

export function UserSearchInput({ placeholder = 'Search by username...', onSelect, excludeUserIds, disabled }: UserSearchInputProps) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedTerm = useDebouncedValue(term, 300)
  const trimmedTerm = debouncedTerm.trim()

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const { data, isLoading } = useQuery({
    queryKey: ['user-search', trimmedTerm],
    queryFn: async () => {
      const result = await userList({ limit: 6, search: trimmedTerm })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.items
    },
    enabled: trimmedTerm.length > 0,
    staleTime: 10_000
  })

  const results = (data ?? []).filter((user) => user.username && !excludeUserIds?.includes(user.id))

  return (
    <div ref={containerRef} className='relative'>
      <input
        type='text'
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder={placeholder}
        autoComplete='off'
        disabled={disabled}
        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
      />

      {open && trimmedTerm.length > 0 && (
        <div className='absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-background py-1 shadow-lg'>
          {isLoading && (
            <p className='px-3 py-2 text-sm text-muted-foreground'>Searching...</p>
          )}

          {!isLoading && results.length === 0 && (
            <p className='px-3 py-2 text-sm text-muted-foreground'>No users found.</p>
          )}

          {!isLoading && results.map((user) => (
            <button
              key={user.id}
              type='button'
              onClick={() => {
                onSelect(user)
                setTerm('')
                setOpen(false)
              }}
              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'
            >
              <Avatar avatarUrl={user.avatarUrl} label={user.displayName ?? user.username ?? '?'} size={20} />
              <span className='font-medium'>{user.displayName ?? user.username}</span>
              {user.displayName && (
                <span className='text-xs text-muted-foreground'>
                  @
                  {user.username}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
