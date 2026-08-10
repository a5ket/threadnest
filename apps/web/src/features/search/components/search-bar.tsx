'use client'

import { useDebouncedValue } from '@/common/hooks/use-debounced-value'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useGlobalSearch } from '../search.hooks'
import { SearchResultsDropdown } from './search-results-dropdown'

export function SearchBar() {
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const debouncedTerm = useDebouncedValue(term, 300)
  const search = useGlobalSearch(debouncedTerm)

  useEffect(() => {
    if (!desktopOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDesktopOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [desktopOpen])

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus()
  }, [mobileOpen])

  const closeAll = () => {
    setDesktopOpen(false)
    setMobileOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = term.trim()
    if (!trimmed) return
    closeAll()
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const showDropdown = term.trim().length > 0

  return (
    <>
      {/* Desktop / tablet: inline search bar with a floating results panel */}
      <div ref={containerRef} className='relative hidden w-full max-w-sm md:block'>
        <form onSubmit={handleSubmit}>
          <input
            type='search'
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setDesktopOpen(true)
            }}
            onFocus={() => setDesktopOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDesktopOpen(false)
            }}
            placeholder='Search nests, threads, and users...'
            className='w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm'
          />
        </form>

        {desktopOpen && showDropdown && (
          <div className='absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-background shadow-lg'>
            <SearchResultsDropdown
              term={debouncedTerm}
              nests={search.nests}
              threads={search.threads}
              users={search.users}
              isLoading={search.isLoading}
              hasResults={search.hasResults}
              onNavigate={closeAll}
            />
          </div>
        )}
      </div>

      {/* Mobile: icon trigger that opens a full-screen search overlay */}
      <button
        type='button'
        onClick={() => setMobileOpen(true)}
        aria-label='Search'
        className='rounded-md p-2 hover:bg-muted md:hidden'
      >
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-5 w-5'>
          <circle cx='9' cy='9' r='6' />
          <path d='M17 17l-4-4' strokeLinecap='round' />
        </svg>
      </button>

      {mobileOpen && (
        <div className='fixed inset-0 z-50 flex flex-col bg-background md:hidden'>
          <div className='flex items-center gap-2 border-b border-border p-3'>
            <form onSubmit={handleSubmit} className='flex-1'>
              <input
                ref={mobileInputRef}
                type='search'
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setMobileOpen(false)
                }}
                placeholder='Search nests, threads, and users...'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
            </form>

            <button type='button' onClick={() => setMobileOpen(false)} className='text-sm text-muted-foreground'>
              Cancel
            </button>
          </div>

          {showDropdown && (
            <SearchResultsDropdown
              term={debouncedTerm}
              nests={search.nests}
              threads={search.threads}
              users={search.users}
              isLoading={search.isLoading}
              hasResults={search.hasResults}
              onNavigate={closeAll}
            />
          )}
        </div>
      )}
    </>
  )
}
