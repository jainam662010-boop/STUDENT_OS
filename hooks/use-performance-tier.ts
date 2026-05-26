'use client'

import { useState, useEffect } from 'react'

export type PerformanceTier = 'low' | 'medium' | 'high'

function detectTier(): PerformanceTier {
  try {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1

    const cores = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4

    if (isMobile && (cores <= 4 || memory <= 2)) return 'low'
    if (isMobile && (cores <= 6 || memory <= 4)) return 'medium'
    if (cores >= 8 && memory >= 8) return 'high'
    if (cores <= 4 || memory <= 2) return 'low'

    return 'medium'
  } catch {
    return 'medium'
  }
}

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('high')

  useEffect(() => {
    setTier(detectTier())
  }, [])

  return tier
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}
