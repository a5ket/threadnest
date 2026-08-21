'use client'

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

const RightRailContext = createContext<{
  content: React.ReactNode | null
  setContent: (content: React.ReactNode | null) => void
} | null>(null)

export function RightRailProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState<React.ReactNode | null>(null)

  return (
    <RightRailContext.Provider value={{ content, setContent }}>
      {children}
    </RightRailContext.Provider>
  )
}

export function useRightRailContent() {
  const ctx = useContext(RightRailContext)
  if (!ctx) throw new Error('useRightRailContent must be used within RightRailProvider')
  return ctx.content
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
