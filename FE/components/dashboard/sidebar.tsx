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
  PlugZap
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
    { href: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { href: '/dashboard/children', icon: Users, label: t('nav.children') },
    { href: '/dashboard/applications', icon: AppWindow, label: t('nav.applications') },
    { href: '/dashboard/integrations', icon: PlugZap, label: 'Integracije' },
    { href: '/dashboard/statistics', icon: BarChart3, label: t('nav.statistics') },
    { href: '/dashboard/settings', icon: Settings, label: t('nav.settings') },
  ]

  const adminItems = [
    { href: '/dashboard/admin', icon: Shield, label: t('nav.admin') },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex h-16 items-center border-b px-4',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-sidebar-foreground">
                {t('common.appName')}
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onToggle}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className={cn(
                  'my-4 border-t border-sidebar-border',
                  isCollapsed && 'mx-2'
                )} />
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Collapse button when collapsed */}
        {isCollapsed && (
          <div className="border-t p-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-8"
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
