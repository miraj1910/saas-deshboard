import type { InviteEmailData } from '../types'
import { emailLayout } from './layout'

export function renderInviteEmail(data: InviteEmailData): string {
  return emailLayout({
    title: `Join ${data.workspaceName} on FlowDesk`,
    previewText: `You've been invited to join ${data.workspaceName}`,
    body: `
      <div style="text-align: center; padding: 32px 0;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">You're Invited!</h1>
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Hi there,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          <strong>${escapeHtml(data.inviterName)}</strong> has invited you to join
          <strong>${escapeHtml(data.workspaceName)}</strong> on FlowDesk as a
          <strong>${escapeHtml(formatRole(data.role))}</strong>.
        </p>
        <a href="${escapeHtml(data.inviteUrl)}"
           style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff;
                  text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Accept Invitation
        </a>
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
          This invitation expires in 7 days. If you were not expecting this invitation,
          you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

function formatRole(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    TEAM_MEMBER: 'Team Member',
    CLIENT: 'Client',
  }
  return labels[role] ?? role
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
