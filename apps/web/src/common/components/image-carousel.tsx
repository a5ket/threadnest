'use client'

import { useState } from 'react'
import { Lightbox } from './lightbox'

interface CarouselImage {
  id: string
  url: string
  width: number
  height: number
}

interface ImageCarouselProps {
  images: CarouselImage[]
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const hasMultiple = images.length > 1
  const current = images[index]

  if (!current) return null

  return (
    <>
      <div className='relative'>
        <button
          type='button'
          onClick={() => setLightboxOpen(true)}
          className='block w-full cursor-zoom-in'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt=''
            className='max-h-[32rem] w-full rounded-md object-contain'
          />
        </button>

        {hasMultiple && (
          <>
            <button
              type='button'
              onClick={() => setIndex((index - 1 + images.length) % images.length)}
              aria-label='Previous image'
              className='absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
            >
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
                <path d='M12 15l-5-5 5-5' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>

            <button
              type='button'
              onClick={() => setIndex((index + 1) % images.length)}
              aria-label='Next image'
              className='absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
            >
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
                <path d='M8 5l5 5-5 5' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>

            <div className='absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5'>
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type='button'
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>

            <span className='absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white'>
              {index + 1}
              {' / '}
              {images.length}
            </span>
          </>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
