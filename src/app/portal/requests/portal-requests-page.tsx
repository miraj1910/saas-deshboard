'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createClientRequest } from '@/features/portal/actions'
import type { PortalRequest } from '@/features/portal/types'

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

const statusLabel: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'secondary'> = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'secondary',
}

export function PortalRequestsPage({ requests: initial }: { requests: PortalRequest[] }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)

    const result = await createClientRequest(title.trim(), description.trim() || null)

    if (result.success) {
      setRequests((prev) => [
        {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim() || null,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setTitle('')
      setDescription('')
      setShowForm(false)
    } else {
      setError(result.error ?? 'Failed to create request')
    }

    setSubmitting(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Requests</h1>
          <p className="text-sm text-muted-foreground">Submit and track requests</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Request
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Submit a Request</CardTitle>
              <CardDescription>Describe what you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your request"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="description">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more detail..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={submitting || !title.trim()}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Submit
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {requests.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <p className="text-sm text-muted-foreground">No requests yet</p>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Submit your first request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{req.title}</CardTitle>
                  <Badge variant={statusVariant[req.status] ?? 'secondary'}>
                    {statusLabel[req.status] ?? req.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {req.description && (
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Submitted {fmtDate(req.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
