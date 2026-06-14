import type { ProjectUpdateEmailData } from '../types'
import { emailLayout } from './layout'

export function renderProjectUpdateEmail(data: ProjectUpdateEmailData): string {
  const statusLabel = formatStatus(data.status)

  return emailLayout({
    title: `Project Update: ${data.projectName} ${statusLabel}`,
    previewText: `${data.projectName} has been updated to ${statusLabel}`,
    body: `
      <div style="padding: 32px 0;">
        <h1 style="margin: 0 0 24px; font-size: 22px; color: #111827; text-align: center;">
          Project Update
        </h1>
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Hi there,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          The project <strong>${escapeHtml(data.projectName)}</strong>
          ${data.clientName ? `for <strong>${escapeHtml(data.clientName)}</strong> ` : ''}
          has been marked as <strong>${statusLabel}</strong>.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 6px 16px; background-color: ${statusColor(data.status)}; color: #ffffff; border-radius: 999px; font-size: 12px; font-weight: 600;">
            ${statusLabel}
          </span>
        </div>
        <div style="text-align: center;">
          <a href="${escapeHtml(data.projectUrl)}"
             style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff;
                    text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            View Project
          </a>
        </div>
      </div>
    `,
  })
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
  }
  return labels[status] ?? status
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: '#059669',
    COMPLETED: '#6366f1',
    ARCHIVED: '#6b7280',
  }
  return colors[status] ?? '#6b7280'
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
