'use client'

import { forwardRef, type TextareaHTMLAttributes, useEffect, useRef } from 'react'

function resize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AutoResizeTextarea({ onInput, className, ...props }, forwardedRef) {
    const innerRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (innerRef.current) resize(innerRef.current)
    }, [])

    return (
      <textarea
        ref={(el) => {
          innerRef.current = el
          if (typeof forwardedRef === 'function') forwardedRef(el)
          else if (forwardedRef) forwardedRef.current = el
        }}
        onInput={(e) => {
          resize(e.currentTarget)
          onInput?.(e)
        }}
        rows={1}
        className={`resize-none overflow-hidden ${className ?? ''}`}
        {...props}
      />
    )
  }
)
