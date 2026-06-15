'use client'

import { useTranslation } from '@/components/providers'
import { LanguageToggle } from '@/components/dashboard/language-toggle'
import { ThemeToggle } from '@/components/dashboard/theme-toggle'
import { Heart } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-background dark:to-purple-950/30">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-700/15" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-700/15" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[300px] w-[300px] rounded-full bg-orange-200/15 blur-3xl dark:bg-orange-700/10" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur-sm dark:border-border dark:bg-background/70">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/60 bg-white/50 py-4 backdrop-blur-sm dark:border-border dark:bg-background/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AbilityHub. Sva prava zadržana.
        </div>
      </footer>
    </div>
  )
}
