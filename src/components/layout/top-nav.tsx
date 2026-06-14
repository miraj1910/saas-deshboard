'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Search,
  Bell,
  Menu,
  Building2,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/hooks/use-sidebar'
import { useMediaQuery } from '@/hooks/use-media-query'
import { NotificationDropdown } from '@/features/notifications/components/notification-dropdown'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function TopNav() {
  const params = useParams()
  const slug = params?.workspaceSlug as string
  const currentWorkspaceName = slug || 'Workspace'
  const { data: session } = useSession()
  const { expanded } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const user = session?.user
  const userName = user?.name ?? 'User'
  const userEmail = user?.email ?? ''
  const initials = getInitials(userName)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-20 flex h-topbar items-center gap-2 border-b bg-background/80 backdrop-blur-lg backdrop-saturate-150 px-4 transition-all duration-300 ease-premium',
          !isMobile && (expanded ? 'ml-sidebar' : 'ml-sidebar-collapsed'),
        )}
      >
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="mr-1">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        )}

        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2 text-sm font-medium rounded-lg hover:bg-surface-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[140px] truncate">{currentWorkspaceName}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Search */}
        <div className={cn('relative transition-all duration-200 ease-premium', searchOpen ? 'w-64' : 'w-9')}>
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search anything..."
                className="h-8 pl-8 pr-8 text-sm rounded-lg"
                autoFocus
                aria-label="Search"
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="rounded-lg"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="rounded-lg relative"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0 text-muted-foreground" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100 text-muted-foreground" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6 bg-border/50" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full hover:ring-2 hover:ring-ring/30 transition-all duration-150">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 animate-scale-in">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/workspaces" className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Workspaces
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${slug}/settings`} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className={cn(
        'transition-all duration-300 ease-premium',
        !isMobile && (expanded ? 'ml-sidebar' : 'ml-sidebar-collapsed'),
      )}>
        <div className="h-topbar" />
      </div>
    </>
  )
}

function MobileSidebar() {
  const params = useParams()
  const pathname = usePathname()
  const slug = params?.workspaceSlug as string

  const items = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clients', href: '/clients' },
    { label: 'Projects', href: '/projects' },
    { label: 'Time', href: '/time' },
    { label: 'Invoices', href: '/invoices' },
    { label: 'Settings', href: '/settings' },
  ]

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-topbar items-center gap-3 px-4 border-b border-sidebar-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent text-xs font-bold text-white shadow-button">
          F
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">FlowDesk</span>
          <span className="text-[10px] text-sidebar-muted">Agency OS</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {items.map((item) => {
          const active = pathname === `/${slug}${item.href}` || pathname.startsWith(`/${slug}${item.href}/`)
          return (
            <Link
              key={item.href}
              href={`/${slug}${item.href}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-premium',
                active
                  ? 'bg-sidebar-accent/10 text-sidebar-accent'
                  : 'text-sidebar-muted hover:bg-surface-3 hover:text-sidebar-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
