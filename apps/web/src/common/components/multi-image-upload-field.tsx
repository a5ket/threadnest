'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

function ImageIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
      <rect x='2.5' y='3.5' width='15' height='13' rx='1.5' />
      <circle cx='6.5' cy='7.5' r='1.25' />
      <path d='M3 14l4.5-4.5a1.5 1.5 0 012.1 0L14 14M11.5 11.5l1-1a1.5 1.5 0 012.1 0L17 13' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export interface UploadedAttachment {
  key: string
  width: number
  height: number
}

export interface AttachmentItem extends UploadedAttachment {
  url: string
}

interface PendingUpload {
  id: string
  file: File
  previewUrl: string
}

interface MultiImageUploadFieldProps {
  items: AttachmentItem[]
  onItemsChange: (items: AttachmentItem[]) => void
  onUploadingChange?: (isUploading: boolean) => void
  maxFiles: number
  onUpload: (file: File) => Promise<UploadedAttachment>
}

export function MultiImageUploadField({ items, onItemsChange, onUploadingChange, maxFiles, onUpload }: MultiImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [error, setError] = useState<string | null>(null)
  const remaining = maxFiles - items.length - pending.length

  useEffect(() => {
    onUploadingChange?.(pending.length > 0)
  }, [pending.length, onUploadingChange])

  const uploadOne = (file: File) => {
    const id = `${file.name}-${file.lastModified}-${Math.random()}`
    const previewUrl = URL.createObjectURL(file)
    setPending((prev) => [...prev, { id, file, previewUrl }])

    onUpload(file)
      .then((uploaded) => {
        // The local blob URL becomes the item's display URL — the server doesn't hand back
        // a fetchable URL for a not-yet-attached upload, and we already have this one.
        onItemsChange([...items, { ...uploaded, url: previewUrl }])
      })
      .catch(() => {
        setError(`Failed to upload ${file.name}`)
        URL.revokeObjectURL(previewUrl)
      })
      .finally(() => {
        setPending((prev) => prev.filter((p) => p.id !== id))
      })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''

    if (files.length === 0) return

    setError(null)
    const accepted = files.slice(0, Math.max(0, remaining))

    for (const file of accepted) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} is larger than ${MAX_SIZE_MB}MB`)
        continue
      }

      uploadOne(file)
    }
  }

  const removeItem = (key: string) => {
    const removed = items.find((item) => item.key === key)
    if (removed && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url)
    }
    onItemsChange(items.filter((item) => item.key !== key))
  }

  return (
    <div className='flex flex-col gap-2'>
      <input ref={inputRef} type='file' accept={ACCEPTED_TYPES} multiple className='hidden' onChange={handleChange} />

      <div className='flex flex-wrap gap-2'>
        {items.map((item) => (
          <div key={item.key} className='group relative h-20 w-20 overflow-hidden rounded-md bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt='' className='h-full w-full object-cover' />
            <button
              type='button'
              onClick={() => removeItem(item.key)}
              aria-label='Remove image'
              className='absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 group-hover:opacity-100'
            >
              ×
            </button>
          </div>
        ))}

        {pending.map((p) => (
          <div key={p.id} className='relative h-20 w-20 overflow-hidden rounded-md bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt='' className='h-full w-full object-cover opacity-50' />
            <div className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground'>...</div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            aria-label='Add image'
            title='Add image'
            className='flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted'
          >
            <ImageIcon />
          </button>
        )}
      </div>

      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
