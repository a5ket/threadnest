'use client'

import { useEffect, useRef } from 'react'

interface InfiniteScrollSentinelProps {
  onVisible: () => void
  disabled?: boolean
}

// IntersectionObserver's default root (the viewport) doesn't account for clipping by an
// intermediate `overflow-hidden` ancestor above the actual scroll container, so it can
// report the sentinel as never intersecting even while it's visibly on screen. Walk up
// to the nearest scrollable ancestor and use that as root instead.
function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null

  while (current) {
    const { overflowY } = getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current
    }
    current = current.parentElement
  }

  return null
}

export function InfiniteScrollSentinel({ onVisible, disabled }: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onVisible()
      }
    }, { root: findScrollParent(node), rootMargin: '200px' })

    observer.observe(node)
    return () => observer.disconnect()
  }, [onVisible, disabled])

  return <div ref={ref} aria-hidden='true' className='h-1' />
}
