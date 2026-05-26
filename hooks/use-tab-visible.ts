'use client'

import { useState, useEffect } from 'react'

export function useTabVisible(): boolean {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setIsVisible(!document.hidden)
    const handler = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return isVisible
}
