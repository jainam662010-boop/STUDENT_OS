'use client'

import { useEffect, useRef } from 'react'

export type KeyCombo = {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: () => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      const isModMatch =
        (!combo.meta && !combo.ctrl) ||
        (combo.meta && (e.metaKey || e.ctrlKey)) ||
        (combo.ctrl && e.ctrlKey)

      const isShiftMatch =
        !combo.shift || (combo.shift && e.shiftKey)

      const isKeyMatch =
        e.key.toLowerCase() === combo.key.toLowerCase()

      if (isKeyMatch && isModMatch && isShiftMatch) {
        if (combo.preventDefault !== false) {
          e.preventDefault()
        }
        e.stopPropagation()
        callbackRef.current()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [combo.key, combo.meta, combo.ctrl, combo.shift, combo.preventDefault, enabled])
}
