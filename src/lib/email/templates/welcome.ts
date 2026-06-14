import type { WelcomeEmailData } from '../types'
import { emailLayout } from './layout'

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  return emailLayout({
    title: 'Welcome to FlowDesk',
    previewText: `Welcome to FlowDesk, ${data.name}!`,
    body: `
      <div style="text-align: center; padding: 32px 0;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Welcome to FlowDesk</h1>
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Hi ${escapeHtml(data.name)},</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
          Your workspace <strong>${escapeHtml(data.workspaceName)}</strong> is ready.
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          You can now manage projects, track time, create invoices, and collaborate with your team.
          Everything is organized and accessible from your dashboard.
        </p>
        <a href="${escapeHtml(data.loginUrl)}"
           style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff;
                  text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          If you did not create this account, please ignore this email.
        </p>
      </div>
    `,
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
