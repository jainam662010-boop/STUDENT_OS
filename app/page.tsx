'use client'

import { useEffect, lazy, Suspense, useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { Sidebar, MobileNav, MobileHeader } from '@/components/navigation'
import { RootErrorBoundary, ViewErrorBoundary } from '@/components/error-boundary'
import { ChunkErrorBoundary } from '@/components/chunk-error-boundary'
import { Loader } from '@/components/loader'
import { Footer } from '@/components/footer'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { ToastProvider } from '@/components/ui/toast'
import { InstallPrompt } from '@/components/install-prompt'
import { WelcomeScreen } from '@/components/welcome-screen'
import { StorageMonitor } from '@/components/storage-monitor'
import { useDeferredRender } from '@/hooks/use-deferred-effect'

const Dashboard = lazy(() => import('@/components/dashboard').then(m => ({ default: m.Dashboard })))
const FocusMode = lazy(() => import('@/components/focus-mode').then(m => ({ default: m.FocusMode })))
const TaskManagement = lazy(() => import('@/components/tasks').then(m => ({ default: m.TaskManagement })))
const HabitTracking = lazy(() => import('@/components/habits').then(m => ({ default: m.HabitTracking })))
const StudyPlanner = lazy(() => import('@/components/planner').then(m => ({ default: m.StudyPlanner })))
const Analytics = lazy(() => import('@/components/analytics').then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import('@/components/settings').then(m => ({ default: m.Settings })))

// Lazy-load intro components to reduce critical bundle size
const CinematicIntro = lazy(() => import('@/components/cinematic-intro').then(m => ({ default: m.CinematicIntro })))
const LaunchIntro = lazy(() => import('@/components/launch-intro').then(m => ({ default: m.LaunchIntro })))

type View = 'dashboard' | 'focus' | 'planner' | 'tasks' | 'habits' | 'analytics' | 'settings'

const VALID_VIEWS: readonly View[] = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings'] as const

const VIEW_TO_SECTION: Record<View, string> = {
  dashboard: 'Dashboard',
  focus: 'Focus Mode',
  planner: 'Planner',
  tasks: 'Tasks',
  habits: 'Habits',
  analytics: 'Analytics',
  settings: 'Settings',
}

const VIEW_ORDER: View[] = ['dashboard', 'focus', 'planner', 'tasks', 'habits', 'analytics', 'settings']

export function applyTheme(theme: string) {
  const root = document.documentElement
  root.classList.remove('light', 'dark', 'amoled')
  if (theme === 'light') return
  root.classList.add('dark')
  if (theme === 'amoled') root.classList.add('amoled')
}

function isValidView(view: unknown): view is View {
  return VALID_VIEWS.includes(view as View)
}

function getViewFromUrl(): View | null {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  if (view && isValidView(view)) return view
  return null
}

export function getStoredTheme(): 'light' | 'dark' | 'amoled' | null {
  try {
    const keys = ['student-os-storage-v3', 'student-os-storage-v2']
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(raw) } catch { continue }
      const state = parsed.state || parsed
      if (state && typeof state === 'object') {
        const s = state as Record<string, unknown>
        if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'amoled') return s.theme as 'light' | 'dark' | 'amoled'
      }
    }
  } catch { /* noop */ }
  return null
}

function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (useStore.persist.hasHydrated()) onStoreChange()
      const unsub = useStore.persist.onFinishHydration(() => onStoreChange())
      return () => unsub()
    },
    () => useStore.persist.hasHydrated(),
    () => false
  )
}

function checkOnboardingComplete(): boolean {
  try {
    const keys = ['student-os-storage-v3', 'student-os-storage-v2']
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const state = parsed.state || parsed
      if (state && state.onboardingComplete === true) return true
    }
  } catch {}
  return false
}

function hasIntroBeenSeen(): boolean {
  try { return sessionStorage.getItem('student-os-intro-seen') === 'true' } catch { return true }
}

export default function StudentOS() {
  const activeView = useStore((s) => s.activeView)
  const theme = useStore((s) => s.theme)
  const setActiveView = useStore((s) => s.setActiveView)
  const onboardingComplete = useStore((s) => s.onboardingComplete)
  const reducedMotion = useStore((s) => s.reducedMotion)

  const hydrated = useHydrated()
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showIntro, setShowIntro] = useState<boolean | null>(null)
  const [showLaunchIntro, setShowLaunchIntro] = useState(false)

  const isInitialMount = useRef(true)
  const lastView = useRef<View>(activeView)
  const isNavigatingFromPopstate = useRef(false)
  const [direction, setDirection] = useState(0)

  // Defer intro detection to avoid blocking first paint
  useEffect(() => {
    setMounted(true)
    const wasOnboarded = checkOnboardingComplete()
    if (wasOnboarded) {
      const seen = hasIntroBeenSeen()
      setShowIntro(!seen)
      if (!seen) {
        try { sessionStorage.setItem('student-os-intro-seen', 'true') } catch {}
      }
    } else {
      setShowIntro(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      setShowOnboarding(!onboardingComplete)
    }
  }, [mounted, onboardingComplete])

  // Combine theme + reducedMotion application into single effect
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'amoled')
    if (theme !== 'light') root.classList.add('dark')
    if (theme === 'amoled') root.classList.add('amoled')
    root.classList.toggle('motion-reduced', reducedMotion)
  }, [theme, reducedMotion])

  useEffect(() => {
    function handlePopstate() {
      const view = getViewFromUrl()
      if (view) {
        isNavigatingFromPopstate.current = true
        setActiveView(view)
        lastView.current = view
      }
    }
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [setActiveView])

  useEffect(() => {
    if (isInitialMount.current) {
      const view = getViewFromUrl()
      if (view) {
        setActiveView(view)
        lastView.current = view
      }
      isInitialMount.current = false
      return
    }

    if (isNavigatingFromPopstate.current) {
      isNavigatingFromPopstate.current = false
      return
    }

    if (activeView !== lastView.current) {
      const oldIdx = VIEW_ORDER.indexOf(lastView.current)
      const newIdx = VIEW_ORDER.indexOf(activeView)
      setDirection(newIdx > oldIdx ? 1 : -1)
      lastView.current = activeView
      const params = new URLSearchParams(window.location.search)
      params.set('view', activeView)
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`
      window.history.pushState(null, '', newUrl)
    }
  }, [activeView, setActiveView])

  const pageTransitionDir = {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.97 },
  }

  const handleViewRender = useCallback((view: View) => {
    switch (view) {
      case 'dashboard': return <Dashboard />
      case 'focus': return <FocusMode />
      case 'tasks': return <TaskManagement />
      case 'habits': return <HabitTracking />
      case 'planner': return <StudyPlanner />
      case 'analytics': return <Analytics />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }, [])

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
    if (onboardingComplete) {
      setShowLaunchIntro(true)
    }
  }, [onboardingComplete])

  const handleLaunchIntroComplete = useCallback(() => {
    setShowLaunchIntro(false)
  }, [])

  // Show nothing on first paint — avoid flash, then decide what to show
  const shouldRender = mounted && hydrated && showIntro !== null
  if (!shouldRender) return null

  if (showIntro) {
    return (
      <Suspense fallback={null}>
        <CinematicIntro onComplete={handleIntroComplete} />
      </Suspense>
    )
  }

  if (showLaunchIntro) {
    return (
      <Suspense fallback={null}>
        <LaunchIntro onComplete={handleLaunchIntroComplete} />
      </Suspense>
    )
  }

  if (showOnboarding) {
    return (
      <motion.div
        key="onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <WelcomeScreen />
      </motion.div>
    )
  }

  return (
    <motion.div
      key="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <RootErrorBoundary>
        <ChunkErrorBoundary>
        <ToastProvider>
          <CommandPalette />
          <InstallPrompt />
          <StorageMonitor />
          <div className="flex h-dynamic">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>

            <Sidebar />

            <main id="main-content" className="flex-1 flex flex-col min-w-0" tabIndex={-1}>
              <MobileHeader />

              <div className="flex-1 overflow-y-auto scroll-container min-h-0">
                <div className="px-4 lg:px-6 py-4 lg:py-6 pb-28 lg:pb-6">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={activeView}
                      custom={direction}
                      variants={pageTransitionDir}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="max-w-5xl mx-auto"
                    >
                      <ViewErrorBoundary sectionName={VIEW_TO_SECTION[activeView]}>
                        <Suspense fallback={<Loader />}>
                          {handleViewRender(activeView)}
                        </Suspense>
                      </ViewErrorBoundary>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <Footer />
            </main>

            <MobileNav />
          </div>
        </ToastProvider>
        </ChunkErrorBoundary>
      </RootErrorBoundary>
    </motion.div>
  )
}
