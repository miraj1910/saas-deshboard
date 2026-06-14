'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/hooks/use-sidebar'
import { useMediaQuery } from '@/hooks/use-media-query'

type NavItem = {
  label: string
  icon: LucideIcon
  href: string
  badge?: string
}

const topNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Clients', icon: Users, href: '/clients' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Time', icon: Clock, href: '/time' },
  { label: 'Invoices', icon: FileText, href: '/invoices' },
]

const bottomNav: NavItem[] = [
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const slug = params?.workspaceSlug as string
  const { expanded, toggle } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const href = (path: string) => `/${slug}${path}`

  const isActive = (item: NavItem) => {
    if (item.href === '/dashboard') return pathname === href('/dashboard') || pathname === `/${slug}`
    return pathname.startsWith(href(item.href))
  }

  if (isMobile) return null

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-premium',
        expanded ? 'w-sidebar' : 'w-sidebar-collapsed',
      )}
    >
      {/* Workspace Identity */}
      <div className="flex h-topbar items-center gap-3 px-4">
        <div className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent text-xs font-bold text-white shrink-0',
          'shadow-button',
        )}>
          <span className="relative z-10">F</span>
          <div className="absolute inset-0 rounded-lg bg-gradient-accent opacity-80" />
        </div>
        {expanded && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">FlowDesk</span>
            <span className="text-[10px] text-sidebar-muted truncate">Agency OS</span>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border/50" />

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {topNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={href(item.href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-premium',
                active
                  ? 'bg-sidebar-accent/10 text-sidebar-accent'
                  : 'text-sidebar-muted hover:bg-surface-3 hover:text-sidebar-foreground',
              )}
            >
              {/* Active indicator bar */}
              {active && expanded && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-full bg-gradient-accent" />
              )}
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-150 ease-premium',
                active && 'scale-110',
              )} />
              {expanded && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-gradient-accent px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border/50" />

      {/* Bottom Navigation */}
      <div className="px-2 py-2">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={href(item.href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-premium',
                active
                  ? 'bg-sidebar-accent/10 text-sidebar-accent'
                  : 'text-sidebar-muted hover:bg-surface-3 hover:text-sidebar-foreground',
              )}
            >
              {active && expanded && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-full bg-gradient-accent" />
              )}
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-150 ease-premium',
                active && 'scale-110',
              )} />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      <Separator className="bg-sidebar-border/50" />

      {/* Collapse Toggle */}
      <div className="flex items-center justify-center px-3 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className="text-sidebar-muted hover:text-sidebar-foreground transition-all duration-150 ease-premium"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div className={cn(
            'transition-transform duration-200 ease-premium',
            !expanded && 'rotate-180',
          )}>
            <ChevronLeft className="h-4 w-4" />
          </div>
        </Button>
      </div>
    </aside>
  )
}
