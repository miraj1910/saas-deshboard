'use client'

import { useSidebar } from '@/hooks/use-sidebar'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <main
      className={cn(
        'relative min-h-screen p-6 transition-all duration-300 ease-premium animate-fade-in',
        !isMobile && (expanded ? 'ml-sidebar' : 'ml-sidebar-collapsed'),
      )}
    >
      {children}
    </main>
  )
}
