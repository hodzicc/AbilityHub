'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/components/providers'
import { cn } from '@/lib/utils'
import { Settings, Palette, Bell, User } from 'lucide-react'

const settingsNav = [
  { href: '/dashboard/settings', icon: Settings, labelKey: 'settings.general' },
  { href: '/dashboard/settings/preferences', icon: Palette, labelKey: 'settings.preferences' },
  { href: '/dashboard/settings/notifications', icon: Bell, labelKey: 'settings.notifications' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <nav className="flex gap-2 border-b pb-4 overflow-x-auto">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      {/* Content */}
      {children}
    </div>
  )
}
