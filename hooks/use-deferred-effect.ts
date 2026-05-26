import { useEffect, useRef, useState } from 'react'

type IdleCallbackHandle = { cancel: () => void }

function requestIdleCallbackSafe(cb: () => void): IdleCallbackHandle {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(cb, { timeout: 2000 })
    return { cancel: () => cancelIdleCallback(id) }
  }
  const id = setTimeout(cb, 1)
  return { cancel: () => clearTimeout(id) }
}

export function useDeferredEffect(fn: () => void | (() => void), deps: unknown[] = []): void {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const handle = requestIdleCallbackSafe(() => {
      const cleanup = fnRef.current()
      if (cleanup) {
        const cleanupHandle = requestIdleCallbackSafe(() => cleanup())
        return () => cleanupHandle.cancel()
      }
    })
    return () => handle.cancel()
  }, deps)
}

export function useDeferredRender(delay = 0): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handle = requestIdleCallbackSafe(() => setReady(true))
    if (delay > 0) {
      const timer = setTimeout(() => setReady(true), delay)
      return () => { handle.cancel(); clearTimeout(timer) }
    }
    return () => handle.cancel()
  }, [delay])

  return ready
}
