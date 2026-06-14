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

export const metadata: Metadata = {
  title: {
    default: 'FlowDesk',
    template: '%s | FlowDesk',
  },
  description: 'Operations platform for independent knowledge workers.',
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
