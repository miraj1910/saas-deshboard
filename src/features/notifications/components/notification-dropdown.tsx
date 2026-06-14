'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCheck, Clock, UserCheck, FolderCheck, Receipt, UserPlus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { markAsRead, markAllAsRead } from '@/features/notifications/_actions'
import { Skeleton } from '@/components/ui/skeleton'
import type { NotificationType } from '@prisma/client'
import type { NotificationItem } from '@/features/notifications/types'

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  TASK_ASSIGNED: UserCheck,
  PROJECT_COMPLETED: FolderCheck,
  INVOICE_PAID: Receipt,
  TIME_ENTRY_APPROVED: Clock,
  CLIENT_CREATED: UserPlus,
}

function timeAgo(d: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(d).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

export function NotificationDropdown({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications?: NotificationItem[]
  initialUnreadCount?: number
}) {
  const params = useParams()
  const slug = params?.workspaceSlug as string
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications ?? [])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount ?? 0)
  const [loading, setLoading] = useState(!initialNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?workspaceSlug=${slug}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (!initialNotifications) {
      fetchData()
    }
  }, [initialNotifications, fetchData])

  useEffect(() => {
    if (!open) return
    fetchData()
  }, [open, fetchData])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(slug, id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(slug)
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })))
    setUnreadCount(0)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-none text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-2 py-1 text-xs font-normal text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
          <Separator />

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((n, idx) => {
                  const Icon = TYPE_ICONS[n.type] ?? FileText
                  const isUnread = !n.readAt

                  return (
                    <div key={n.id}>
                      {idx > 0 && <Separator />}
                      <Link
                        href={`/${slug}${n.link ?? ''}`}
                        className={cn(
                          'flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
                          isUnread && 'bg-accent/30',
                        )}
                        onClick={(e) => {
                          if (isUnread) handleMarkAsRead(n.id)
                          setOpen(false)
                        }}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{n.title}</p>
                          {n.message && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {n.message}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground/60">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
