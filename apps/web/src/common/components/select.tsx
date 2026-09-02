'use client'

import { useEffect, useRef, useState } from 'react'

interface SelectOption<T extends string | number> {
  value: T
  label: string
}

interface SelectProps<T extends string | number> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  disabled?: boolean
  id?: string
  className?: string
}

export function Select<T extends string | number>({ value, onChange, options, disabled, id, className }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const selected = options.find((option) => option.value === value)

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type='button'
        id={id}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm disabled:opacity-50'
      >
        <span>{selected?.label ?? ''}</span>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4 shrink-0 text-muted-foreground'>
          <path d='M5 8l5 5 5-5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>

      {open && !disabled && (
        <div role='listbox' className='absolute left-0 top-full z-50 mt-1 w-full min-w-max overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg'>
          {options.map((option) => (
            <button
              key={option.value}
              type='button'
              role='option'
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm ${option.value === value ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
