'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadButton } from '@/lib/uploadthing'
import type { FileWithUploader } from '@/features/files/queries'
import { deleteProjectFile } from '@/features/files/_actions'
import { Download, Trash2, FileText, Image, Archive, File } from 'lucide-react'

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />
  if (type.includes('zip') || type.includes('compress')) return <Archive className="h-4 w-4" />
  if (type.includes('pdf') || type.includes('document') || type.includes('sheet') || type.includes('presentation') || type.includes('text')) return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

type ProjectFilesSectionProps = {
  projectId: string
  workspaceId: string
  workspaceSlug: string
  initialFiles: FileWithUploader[]
  canUpload: boolean
  canDelete: boolean
}

export function ProjectFilesSection({
  projectId,
  workspaceId,
  workspaceSlug,
  initialFiles,
  canUpload,
  canDelete,
}: ProjectFilesSectionProps) {
  const [files, setFiles] = useState<FileWithUploader[]>(initialFiles)

  const handleUploadComplete = useCallback(() => {
    window.location.reload()
  }, [])

  const handleDelete = useCallback(async (fileId: string) => {
    const result = await deleteProjectFile(workspaceId, fileId)
    if (result.success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    }
  }, [workspaceId])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Project Files</CardTitle>
        {canUpload && (
          <UploadButton
            endpoint="projectFile"
            headers={{
              'x-workspace-id': workspaceId,
              'x-project-id': projectId,
            }}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              console.error('Upload error:', error)
            }}
          />
        )}
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No files attached to this project yet.</p>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 py-3">
                {getFileIcon(file.type)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} &middot; {formatDate(file.createdAt)}
                    {file.uploadedBy && <span> &middot; by {file.uploadedBy.name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download {file.originalName}</span>
                    </a>
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {file.originalName}</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
