'use client'

import { useEffect } from 'react'

interface LightboxImage {
  url: string
  width: number
  height: number
}

interface LightboxProps {
  images: LightboxImage[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const hasMultiple = images.length > 1
  const current = images[index]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasMultiple) onIndexChange((index - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight' && hasMultiple) onIndexChange((index + 1) % images.length)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, images.length, hasMultiple, onIndexChange, onClose])

  if (!current) return null

  return (
    <div
      className='fixed inset-0 z-50 overflow-hidden bg-black'
      onClick={onClose}
    >
      {/* Blurred, darkened copy of the current image as ambient backdrop, instead of flat black. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.url}
        src={current.url}
        alt=''
        aria-hidden='true'
        className='absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl'
      />

      <div className='absolute inset-0 flex items-center justify-center'>
        <button
          type='button'
          onClick={(e) => { e.stopPropagation(); onClose() }}
          aria-label='Close'
          className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
        >
          <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
            <path d='M5 5l10 10M15 5L5 15' strokeLinecap='round' />
          </svg>
        </button>

        {hasMultiple && (
          <span className='absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/80'>
            {index + 1}
            {' / '}
            {images.length}
          </span>
        )}

        {hasMultiple && (
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + images.length) % images.length) }}
            aria-label='Previous image'
            className='absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4'
          >
            <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-5 w-5'>
              <path d='M12 15l-5-5 5-5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt=''
          onClick={(e) => e.stopPropagation()}
          className='max-h-[90vh] max-w-[90vw] object-contain shadow-2xl'
        />

        {hasMultiple && (
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % images.length) }}
            aria-label='Next image'
            className='absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4'
          >
            <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-5 w-5'>
              <path d='M8 5l5 5-5 5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
