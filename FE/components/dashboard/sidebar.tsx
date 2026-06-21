'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/components/providers'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    { href: '/dashboard/children',     icon: Users,     label: t('nav.children'),      color: 'text-orange-300' },
    { href: '/dashboard/applications', icon: AppWindow, label: t('nav.applications'),  color: 'text-amber-300' },
    { href: '/dashboard/statistics',   icon: BarChart3, label: t('nav.statistics'),    color: 'text-emerald-300' },
    { href: '/dashboard/settings',     icon: Settings,  label: t('nav.settings'),      color: 'text-purple-300' },
  ]

  const adminItems = [
    { href: '/dashboard/admin', icon: Shield, label: t('nav.admin'), color: 'text-rose-300' },
  ]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
                    {t('admin.roleShort.admin')}
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

        {/* User card at bottom */}
        <div className={cn('border-t border-sidebar-border p-3', isCollapsed && 'flex justify-center')}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {user?.role === 'admin' ? t('admin.roleShort.admin') : t('admin.roleShort.parent')}
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
