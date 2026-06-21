import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Nunito, Atkinson_Hyperlegible } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, LanguageProvider, PreferencesProvider } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist-sans'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

// Selectable UI-preference fonts (see lib/preferences.ts FONT_FAMILIES) — must be
// loaded here via next/font so the CSS variables they reference actually resolve
// to these typefaces instead of silently falling back to the system font.
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
})

export const metadata: Metadata = {
  title: {
    default: 'AbilityHub',
    template: '%s | AbilityHub'
  },
  description: 'Centralizovana platforma za upravljanje i praćenje mobilnih aplikacija namijenjenih djeci sa Down sindromom',
  keywords: ['Down sindrom', 'edukacija', 'mobilne aplikacije', 'praćenje napretka', 'roditelji', 'djeca'],
  authors: [{ name: 'AbilityHub Team' }],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bs" suppressHydrationWarning className="bg-background">
      <body className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${atkinsonHyperlegible.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <PreferencesProvider>
                {children}
                <Toaster />
              </PreferencesProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
