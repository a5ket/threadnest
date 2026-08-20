'use client'

import { ImageUploadField } from '@/common/components/image-upload-field'
import { useState } from 'react'
import { useRemoveNestIcon, useUploadNestIcon } from '../nest.hooks'

interface NestIconFieldProps {
  nestSlug: string
  nestName: string
  iconUrl: string | null
}

export function NestIconField({ nestSlug, nestName, iconUrl: initialIconUrl }: NestIconFieldProps) {
  const [iconUrl, setIconUrl] = useState(initialIconUrl)

  const uploadIcon = useUploadNestIcon({
    onSuccess: (updated) => setIconUrl(updated.iconUrl ?? null)
  })

  const removeIcon = useRemoveNestIcon({
    onSuccess: (updated) => setIconUrl(updated.iconUrl ?? null)
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-sm font-semibold'>Icon</h2>

      <div className='flex items-center gap-4'>
        <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-muted'>
          {iconUrl
            ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt='' className='h-full w-full object-cover' />
              )
            : (
                <span className='text-lg font-medium text-muted-foreground'>{nestName.charAt(0).toUpperCase()}</span>
              )}
        </div>

        <ImageUploadField
          label='icon'
          hasImage={Boolean(iconUrl)}
          isUploading={uploadIcon.isPending}
          isRemoving={removeIcon.isPending}
          outputSize={256}
          shape='square'
          onUpload={(file) => uploadIcon.mutate({ nestSlug, file })}
          onRemove={() => removeIcon.mutate(nestSlug)}
        />
      </div>
    </div>
  )
}
