'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface ImageCropperModalProps {
  file: File
  outputSize: number
  shape?: 'circle' | 'square'
  viewportSize?: number
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
// The stage shows more of the image than the crop window itself, so panning/zooming has visible context.
const STAGE_RATIO = 1.6

export function ImageCropperModal({ file, outputSize, shape = 'circle', viewportSize = 280, onCancel, onConfirm }: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const dragState = useRef<{ startX: number, startY: number, centerFracX: number, centerFracY: number } | null>(null)

  const [natural, setNatural] = useState<{ width: number, height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [centerFrac, setCenterFrac] = useState({ x: 0.5, y: 0.5 })
  const [isExporting, setIsExporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const imageUrl = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  const stageSize = viewportSize * STAGE_RATIO
  const stageOffset = (stageSize - viewportSize) / 2

  const baseScale = natural ? viewportSize / Math.min(natural.width, natural.height) : 1

  // Displayed size (in CSS px) of the whole image at a given zoom — always proportional to
  // the image's own natural aspect ratio, so the image itself can never appear stretched.
  const dispSizeAt = (z: number) => ({
    w: natural ? natural.width * baseScale * z : 0,
    h: natural ? natural.height * baseScale * z : 0
  })

  const { w: dispW, h: dispH } = dispSizeAt(zoom)

  // Keeps the crop window fully covered by the image at the given (possibly not-yet-applied) size.
  const clampFrac = (frac: { x: number, y: number }, w: number, h: number) => {
    const marginX = w > 0 ? viewportSize / (2 * w) : 0.5
    const marginY = h > 0 ? viewportSize / (2 * h) : 0.5
    return {
      x: Math.min(1 - marginX, Math.max(marginX, frac.x)),
      y: Math.min(1 - marginY, Math.max(marginY, frac.y))
    }
  }

  // Image's top-left position within the stage (crop window sits centered in the stage).
  const panX = stageOffset + viewportSize / 2 - centerFrac.x * dispW
  const panY = stageOffset + viewportSize / 2 - centerFrac.y * dispH

  const handleImageLoad = () => {
    const img = imgRef.current
    if (!img) return
    setNatural({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragState.current = { startX: e.clientX, startY: e.clientY, centerFracX: centerFrac.x, centerFracY: centerFrac.y }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || dispW === 0 || dispH === 0) return

    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY

    setCenterFrac(clampFrac({
      x: dragState.current.centerFracX - dx / dispW,
      y: dragState.current.centerFracY - dy / dispH
    }, dispW, dispH))
  }

  const handlePointerUp = () => {
    dragState.current = null
    setIsDragging(false)
  }

  const handleZoomChange = (nextZoom: number) => {
    const next = dispSizeAt(nextZoom)
    setZoom(nextZoom)
    setCenterFrac((prev) => clampFrac(prev, next.w, next.h))
  }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !natural) return

    setIsExporting(true)

    const scale = baseScale * zoom
    const sx = (centerFrac.x * dispW - viewportSize / 2) / scale
    const sy = (centerFrac.y * dispH - viewportSize / 2) / scale
    const sSize = viewportSize / scale

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setIsExporting(false)
      return
    }

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize)
    canvas.toBlob((blob) => {
      setIsExporting(false)
      if (blob) onConfirm(blob)
    }, 'image/webp', 0.9)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='flex flex-col gap-4 rounded-lg bg-background p-4 shadow-lg'>
        <h2 className='text-sm font-semibold'>Adjust image</h2>

        <div
          className='relative touch-none overflow-hidden rounded-md bg-neutral-900'
          style={{ width: `${stageSize}px`, height: `${stageSize}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imageUrl}
              alt=''
              draggable={false}
              onLoad={handleImageLoad}
              className='absolute select-none object-cover'
              style={{ width: `${dispW}px`, height: `${dispH}px`, maxWidth: 'none', left: `${panX}px`, top: `${panY}px` }}
            />
          )}

          {/* Dims everything outside the crop window so the framing is clear at a glance. */}
          <div
            className='pointer-events-none absolute'
            style={{
              width: `${viewportSize}px`,
              height: `${viewportSize}px`,
              left: `${stageOffset}px`,
              top: `${stageOffset}px`,
              borderRadius: shape === 'circle' ? '9999px' : '8px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              outline: '1px solid rgba(255, 255, 255, 0.7)'
            }}
          />
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Zoom</span>
          <input
            type='range'
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className='flex-1'
          />
        </div>

        <div className='flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
          >
            Cancel
          </button>

          <button
            type='button'
            disabled={!natural || isExporting}
            onClick={handleConfirm}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
