'use client'

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

const RightRailContext = createContext<{
  content: React.ReactNode | null
  hiddenCount: number
  setContent: (content: React.ReactNode | null) => void
  setHiddenCount: (updater: (count: number) => number) => void
} | null>(null)

export function RightRailProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState<React.ReactNode | null>(null)
  const [hiddenCount, setHiddenCount] = useState(0)

  return (
    <RightRailContext.Provider value={{ content, hiddenCount, setContent, setHiddenCount }}>
      {children}
    </RightRailContext.Provider>
  )
}

export function useRightRailContent() {
  const ctx = useContext(RightRailContext)
  if (!ctx) throw new Error('useRightRailContent must be used within RightRailProvider')
  return ctx.content
}

// A count rather than a bool so the rail stays hidden if more than one mounted component
// (e.g. during a route transition) asks for it at once.
export function useRightRailHidden() {
  const ctx = useContext(RightRailContext)
  if (!ctx) throw new Error('useRightRailHidden must be used within RightRailProvider')
  return ctx.hiddenCount > 0
}

// Pages with nothing useful to put in the right rail call this to remove it entirely,
// instead of falling back to the default unrelated content.
export function useHideRightRail() {
  const ctx = useContext(RightRailContext)
  if (!ctx) throw new Error('useHideRightRail must be used within RightRailProvider')
  const { setHiddenCount } = ctx

  useEffect(() => {
    setHiddenCount((count) => count + 1)
    return () => setHiddenCount((count) => count - 1)
  }, [setHiddenCount])
}

// Pages call this to replace the default right rail with page-specific content —
// cleared automatically on unmount so navigating away restores the default.
export function useSetRightRail(content: React.ReactNode) {
  const ctx = useContext(RightRailContext)
  if (!ctx) throw new Error('useSetRightRail must be used within RightRailProvider')
  const { setContent } = ctx

  useEffect(() => {
    setContent(content)
    return () => setContent(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])
}
