'use client'

import { useTheme } from 'next-themes'

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
] as const

interface ThemeOptionsProps {
  onSelect?: () => void
}

export function ThemeOptions({ onSelect }: ThemeOptionsProps) {
  const { theme, setTheme } = useTheme()

  return (
    <>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type='button'
          onClick={() => {
            setTheme(option.value)
            onSelect?.()
          }}
          className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-muted ${theme === option.value ? 'font-medium text-primary' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </>
  )
}
