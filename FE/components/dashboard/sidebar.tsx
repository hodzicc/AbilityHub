'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/components/providers'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Home,
  Users,
  AppWindow,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  Heart,
  Palette,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user } = useAuth()

  const navItems = [
    { href: '/dashboard',              icon: Home,      label: t('nav.dashboard'),     color: 'text-indigo-300' },
    { href: '/children',     icon: Users,     label: t('nav.children'),      color: 'text-orange-300' },
    { href: '/applications', icon: AppWindow, label: t('nav.applications'),  color: 'text-amber-300' },
    // Per-child statistics (weekly check-ins, heatmap, category filters) don't apply
    // to admins — their usage-per-app + aggregate figures already live on the dashboard.
    ...(user?.role !== 'admin'
      ? [{ href: '/statistics', icon: BarChart3, label: t('nav.statistics'), color: 'text-emerald-300' }]
      : []),
    // UI preferences are per-child, so this item makes no sense for admins (who have no children).
    ...(user?.role !== 'admin'
      ? [{ href: '/preferences', icon: Palette, label: t('nav.preferences'), color: 'text-pink-300' }]
      : []),
    { href: '/settings',     icon: Settings,  label: t('nav.settings'),      color: 'text-purple-300' },
  ]

  const adminItems = [
    { href: '/admin', icon: Shield, label: t('nav.admin'), color: 'text-rose-300' },
  ]

  // Exact match, or a descendant path — so /children lights up on /children/{id} but a
  // future sibling like /children-archive never does. A bare startsWith() would match it.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex h-16 items-center border-b border-sidebar-border px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/30">
              <Heart className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-sidebar-foreground tracking-tight">
                {t('common.appName')}
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-indigo-300' : item.color)} />
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              )
            })}

            {user?.role === 'admin' && (
              <>
                <div className={cn('my-3 border-t border-sidebar-border', isCollapsed && 'mx-1')} />
                {!isCollapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    Admin
                  </p>
                )}
                {adminItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-indigo-300' : item.color)} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {isCollapsed && (
          <div className="flex justify-center border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
