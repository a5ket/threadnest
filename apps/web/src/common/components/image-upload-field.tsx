'use client'

import { useRef, useState } from 'react'
import { ImageCropperModal } from './image-cropper-modal'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

interface ImageUploadFieldProps {
  label: string
  hasImage: boolean
  isUploading: boolean
  isRemoving?: boolean
  outputSize: number
  shape?: 'circle' | 'square'
  onUpload: (file: File) => void
  onRemove?: () => void
}

export function ImageUploadField({ label, hasImage, isUploading, isRemoving = false, outputSize, shape = 'circle', onUpload, onRemove }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const isPending = isUploading || isRemoving

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_SIZE_MB}MB`)
      return
    }

    setError(null)
    setPendingFile(file)
  }

  const handleCropConfirm = (blob: Blob) => {
    setPendingFile(null)
    onUpload(new File([blob], `${label}.webp`, { type: 'image/webp' }))
  }

  return (
    <div className='flex flex-col gap-2'>
      <input ref={inputRef} type='file' accept={ACCEPTED_TYPES} className='hidden' onChange={handleChange} />

      <div className='flex items-center gap-3'>
        <button
          type='button'
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className='rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50'
        >
          {isUploading ? 'Uploading...' : `Change ${label.toLowerCase()}`}
        </button>

        {hasImage && onRemove && (
          <button
            type='button'
            disabled={isPending}
            onClick={onRemove}
            className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}

      {pendingFile && (
        <ImageCropperModal
          file={pendingFile}
          outputSize={outputSize}
          shape={shape}
          onCancel={() => setPendingFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
