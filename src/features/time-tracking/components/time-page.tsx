'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Square, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  startTimer,
  stopTimer,
  submitTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
  listWorkspaceTimeEntries,
  getProjectTasks,
} from '@/features/time-tracking/_actions'

type ProjectOption = { id: string; name: string }
type TaskOption = { id: string; title: string }

type EntryDisplay = {
  id: string
  description: string | null
  projectName: string | null
  taskTitle: string | null
  durationMinutes: number
  status: string
  userId: string
  userName: string | null
  startTime: Date
  endTime: Date | null
}

type TimePageProps = {
  workspaceId: string
  projects: ProjectOption[]
  currentUserId: string
  canApprove: boolean
  canReadAll: boolean
}

const statusConfig: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SUBMITTED: { label: 'Submitted', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

function ActiveTimerBanner({ entry, onStop, isProcessing }: {
  entry: EntryDisplay
  onStop: (id: string) => void
  isProcessing: boolean
}) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmtLive = (startTime: Date) => {
    const diffMs = now - new Date(startTime).getTime()
    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    const mm = m.toString().padStart(2, '0')
    const ss = s.toString().padStart(2, '0')
    if (h > 0) return `${h}h ${mm}m ${ss}s`
    return `${mm}m ${ss}s`
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-2xl font-mono font-semibold tabular-nums">
          {fmtLive(entry.startTime)}
        </p>
        <p className="text-sm font-medium truncate">
          {entry.projectName}
          {entry.taskTitle && <span className="text-muted-foreground"> &middot; {entry.taskTitle}</span>}
        </p>
        {entry.description && (
          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
        )}
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={isProcessing}
        onClick={() => onStop(entry.id)}
      >
        {isProcessing ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Square className="mr-1.5 h-4 w-4" />
        )}
        Stop
      </Button>
    </div>
  )
}

export function TimePage({ workspaceId, projects, currentUserId, canApprove, canReadAll }: TimePageProps) {
  const [entries, setEntries] = useState<EntryDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState('')

  const [showStartForm, setShowStartForm] = useState(false)
  const [startProjectId, setStartProjectId] = useState('')
  const [startTaskId, setStartTaskId] = useState('')
  const [startDescription, setStartDescription] = useState('')
  const [projectTasks, setProjectTasks] = useState<TaskOption[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [starting, setStarting] = useState(false)

  const runningEntry = entries.find((e) => !e.endTime && e.userId === currentUserId)
  const myEntries = canReadAll ? entries : entries.filter((e) => e.userId === currentUserId)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listWorkspaceTimeEntries(workspaceId)
    if (result.success) {
      setEntries(
        result.data.map((e) => ({
          id: e.id,
          description: e.description,
          projectName: e.project?.name ?? null,
          taskTitle: e.task?.title ?? null,
          durationMinutes: e.durationMinutes,
          status: e.status,
          userId: e.userId,
          userName: e.user?.name ?? null,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
      )
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  function addToList(entry: any) {
    const display: EntryDisplay = {
      id: entry.id,
      description: entry.description,
      projectName: entry.project?.name ?? null,
      taskTitle: entry.task?.title ?? null,
      durationMinutes: entry.durationMinutes,
      status: entry.status,
      userId: entry.userId,
      userName: entry.user?.name ?? null,
      startTime: entry.startTime,
      endTime: entry.endTime,
    }
    setEntries((prev) => [display, ...prev])
  }

  function updateInList(entryId: string, entry: any) {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              durationMinutes: entry.durationMinutes,
              status: entry.status,
              endTime: entry.endTime,
              projectName: entry.project?.name ?? e.projectName,
              taskTitle: entry.task?.title ?? e.taskTitle,
            }
          : e,
      ),
    )
  }

  function addProcessing(id: string) {
    setProcessingIds((prev) => new Set(prev).add(id))
  }

  function removeProcessing(id: string) {
    setProcessingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleStartTimer() {
    setActionError('')
    setStarting(true)
    const result = await startTimer(workspaceId, {
      projectId: startProjectId,
      taskId: startTaskId || null,
      description: startDescription || null,
    })
    if (result.success) {
      addToList(result.data)
      setShowStartForm(false)
      setStartProjectId('')
      setStartTaskId('')
      setStartDescription('')
      setProjectTasks([])
    } else {
      setActionError(result.error)
    }
    setStarting(false)
  }

  async function handleStopTimer(entryId: string) {
    setActionError('')
    addProcessing(entryId)
    const result = await stopTimer(workspaceId, entryId)
    if (result.success) {
      updateInList(entryId, result.data)
    } else {
      setActionError(result.error)
    }
    removeProcessing(entryId)
  }

  async function handleSubmit(entryId: string) {
    setActionError('')
    addProcessing(entryId)
    const result = await submitTimeEntry(workspaceId, entryId)
    if (result.success) {
      updateInList(entryId, result.data)
    } else {
      setActionError(result.error)
    }
    removeProcessing(entryId)
  }

  async function handleApprove(entryId: string) {
    setActionError('')
    addProcessing(entryId)
    const result = await approveTimeEntry(workspaceId, entryId)
    if (result.success) {
      updateInList(entryId, result.data)
    } else {
      setActionError(result.error)
    }
    removeProcessing(entryId)
  }

  async function handleReject(entryId: string) {
    setActionError('')
    addProcessing(entryId)
    const result = await rejectTimeEntry(workspaceId, entryId)
    if (result.success) {
      updateInList(entryId, result.data)
    } else {
      setActionError(result.error)
    }
    removeProcessing(entryId)
  }

  async function handleProjectChange(projectId: string) {
    setStartProjectId(projectId)
    setStartTaskId('')
    setProjectTasks([])
    if (!projectId) return
    setTasksLoading(true)
    const result = await getProjectTasks(workspaceId, projectId)
    if (result.success) {
      setProjectTasks(result.data)
    }
    setTasksLoading(false)
  }

  function resetStartForm() {
    setShowStartForm(false)
    setStartProjectId('')
    setStartTaskId('')
    setStartDescription('')
    setProjectTasks([])
    setActionError('')
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">
            {runningEntry ? (
              <span className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Active Timer
              </span>
            ) : (
              'Timer'
            )}
          </CardTitle>
          {!runningEntry && !showStartForm && (
            <Button size="sm" onClick={() => setShowStartForm(true)}>
              <Play className="mr-1.5 h-4 w-4" />
              Start Timer
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {runningEntry ? (
            <ActiveTimerBanner
              entry={runningEntry}
              onStop={handleStopTimer}
              isProcessing={processingIds.has(runningEntry.id)}
            />
          ) : showStartForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timer-project">Project *</Label>
                <Select
                  id="timer-project"
                  value={startProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              {projectTasks.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="timer-task">Task</Label>
                  <Select
                    id="timer-task"
                    value={startTaskId}
                    onChange={(e) => setStartTaskId(e.target.value)}
                  >
                    <option value="">No task</option>
                    {projectTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {tasksLoading && (
                <p className="text-xs text-muted-foreground">Loading tasks...</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="timer-desc">Description</Label>
                <Input
                  id="timer-desc"
                  value={startDescription}
                  onChange={(e) => setStartDescription(e.target.value)}
                  placeholder="What are you working on?"
                />
              </div>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!startProjectId || starting}
                  onClick={handleStartTimer}
                >
                  {starting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 h-4 w-4" />
                  )}
                  Start
                </Button>
                <Button variant="outline" size="sm" onClick={resetStartForm}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active timer.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          ) : myEntries.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No time entries yet. Start the timer to begin tracking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    {canReadAll && <th scope="col" className="px-4 py-3 font-medium">User</th>}
                    <th scope="col" className="px-4 py-3 font-medium">Description</th>
                    <th scope="col" className="px-4 py-3 font-medium">Project</th>
                    <th scope="col" className="px-4 py-3 font-medium">Task</th>
                    <th scope="col" className="px-4 py-3 font-medium">Duration</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myEntries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                      {canReadAll && (
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {entry.userName ?? '—'}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="truncate max-w-[200px]">{entry.description ?? '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtDate(entry.startTime)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entry.projectName ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entry.taskTitle ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-xs">
                        {fmtDuration(entry.durationMinutes)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={statusConfig[entry.status]?.variant ?? 'secondary'}>
                          {statusConfig[entry.status]?.label ?? entry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {processingIds.has(entry.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {!entry.endTime && entry.userId === currentUserId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStopTimer(entry.id)}
                                aria-label="Stop timer"
                              >
                                <Square className="mr-1 h-3.5 w-3.5" />
                                Stop
                              </Button>
                            )}
                            {entry.status === 'DRAFT' && entry.endTime && entry.userId === currentUserId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubmit(entry.id)}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Submit
                              </Button>
                            )}
                            {entry.status === 'SUBMITTED' && entry.userId !== currentUserId && canApprove && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(entry.id)}
                                  aria-label="Approve time entry"
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(entry.id)}
                                  aria-label="Reject time entry"
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
