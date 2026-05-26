'use client'

import { memo, motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import {
  LayoutDashboard,
  Timer,
  Calendar,
  CheckSquare,
  Target,
  BarChart3,
  Settings,
  Sparkles,
  Menu,
  ChevronLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring, sidebarPanel, sidebarOverlay } from './motion'
import { QuickCapture } from './quick-capture'
import { ProfileAvatar } from './profile-avatar'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type SidebarContentProps = {
  isMobile: boolean
  onNavClick?: () => void
}

function SidebarContent({ isMobile, onNavClick }: SidebarContentProps) {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const progress = useStore((s) => s.progress)
  const userName = useStore((s) => s.userName)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const todayMinutes = useStore((s) => {
    const todayStr = new Date().toDateString()
    let total = 0
    for (let i = 0; i < s.focusSessions.length; i++) {
      const fs = s.focusSessions[i]
      if (fs.endTime && new Date(fs.endTime).toDateString() === todayStr) {
        total += fs.duration
      }
    }
    return total
  })

  const handleNav = (id: string) => {
    setActiveView(id as typeof activeView)
    if (isMobile) setSidebarOpen(false)
    onNavClick?.()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="absolute inset-0 bg-sidebar lg:bg-sidebar/95" />
      <div className="relative z-10 flex flex-col h-full">
        <div className={cn('flex items-center h-12 shrink-0', sidebarOpen ? 'px-4' : 'px-3')}>
          <div className={cn('flex items-center gap-2.5 overflow-hidden', !sidebarOpen && 'justify-center w-full')}>
            <motion.div
              className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={spring.snappy}
                className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap"
              >
                Student OS
              </motion.span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto no-scrollbar" aria-label="Main menu">
          <ul className={cn('space-y-0.5', sidebarOpen ? 'px-2' : 'px-1.5')} role="list">
            {navItems.map((item, i) => {
              const isActive = activeView === item.id
              const Icon = item.icon
              return (
                <motion.li
                  key={item.id}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <button
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={!sidebarOpen ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors relative',
                      sidebarOpen ? 'px-2.5 py-2' : 'justify-center p-2',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-lg bg-sidebar-accent"
                        initial={{ opacity: 0, scale: 0.93 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2.5 w-full">
      <motion.span
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
        )}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </motion.span>
                      {sidebarOpen && (
                        <motion.span
                          className={cn(
                            'truncate relative z-10',
                            isActive
                              ? 'text-sidebar-foreground font-medium'
                              : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80'
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border">
          <div className={cn('py-2', !sidebarOpen && 'flex justify-center')}>
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                <ProfileAvatar size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{userName}</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div className="relative w-3.5 h-3.5 shrink-0" whileHover={{ scale: 1.05 }}>
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sidebar-border" />
                        <motion.circle
                          cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5"
                          strokeDasharray={34.56}
                          strokeDashoffset={34.56 - ((progress.xp % 1000) / 1000) * 34.56}
                          className="text-primary" strokeLinecap="round"
                          animate={{ strokeDashoffset: 34.56 - ((progress.xp % 1000) / 1000) * 34.56 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </svg>
                    </motion.div>
                    <p className="text-[11px] text-sidebar-foreground/40">{progress.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-sidebar-foreground/30">
                    <div className="w-full h-1 rounded-full bg-sidebar-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((todayMinutes / dailyGoal) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span>
                      {todayMinutes}m / {dailyGoal}m
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <ProfileAvatar size="sm" />
            )}
          </div>

          <div className={cn('pb-2 flex items-center gap-1', sidebarOpen ? 'px-2' : 'flex-col px-1.5')}>
            {sidebarOpen && (
              <div className="flex-1">
                <QuickCapture />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'flex items-center justify-center rounded-lg text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
                sidebarOpen ? 'gap-1.5 px-2 py-1.5 text-xs' : 'p-1.5 w-full'
              )}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <motion.span
                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </motion.span>
              {sidebarOpen && <span>Collapse</span>}
            </button>
            {!sidebarOpen && (
              <div className="pt-1">
                <QuickCapture />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Sidebar = memo(function Sidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              variants={sidebarOverlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              aria-hidden="true"
            />

            <motion.aside
              variants={sidebarPanel}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 bottom-0 z-50 w-64 max-w-[80vw] border-r border-sidebar-border lg:hidden"
              aria-label="Main navigation"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:relative lg:border-r lg:border-sidebar-border',
          'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden',
          sidebarOpen ? 'lg:w-60' : 'lg:w-14'
        )}
        aria-label="Main navigation"
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  )
})

export const MobileNav = memo(function MobileNav() {
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-bottom" aria-label="Mobile navigation">
      <div className="bg-card/85 backdrop-blur-xl border-t border-border shadow-2xl">
        <div className="flex overflow-x-auto no-scrollbar gap-0.5" role="list" style={{ overscrollBehavior: 'contain' }}>
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as typeof activeView)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-1.5 flex-1 min-w-0 transition-colors relative',
                  isActive ? 'text-foreground' : 'text-muted-foreground/60'
                )}
              >
                <motion.div
                  className="relative"
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                <span className={cn('text-[9px] font-medium whitespace-nowrap', isActive && 'text-primary')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
})

export const MobileHeader = memo(function MobileHeader() {
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const progress = useStore((s) => s.progress)
  const activeView = useStore((s) => s.activeView)
  const currentPage = navItems.find((item) => item.id === activeView)

  return (
    <header className="sticky top-0 z-30 lg:hidden safe-top bg-card/85 backdrop-blur-xl border-b border-border" role="banner">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Open sidebar"
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </motion.button>
          <h1 className="text-sm font-medium">{currentPage?.label || 'Dashboard'}</h1>
        </div>
        <motion.div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground"
          whileHover={{ scale: 1.02 }}
        >
          <Zap className="w-3 h-3 text-primary" aria-hidden="true" />
          <span>{progress.xp.toLocaleString()}</span>
        </motion.div>
      </div>
    </header>
  )
})
