import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { SessionProvider } from '@/app/providers/session-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saas-dashboard.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'FlowDesk',
    template: '%s | FlowDesk',
  },
  description: 'Operations platform for independent knowledge workers.',
  openGraph: {
    title: 'FlowDesk',
    description: 'Operations platform for independent knowledge workers.',
    url: '/',
    siteName: 'FlowDesk',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowDesk',
    description: 'Operations platform for independent knowledge workers.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
