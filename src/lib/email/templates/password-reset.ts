import type { PasswordResetEmailData } from '../types'
import { emailLayout } from './layout'

export function renderPasswordResetEmail(data: PasswordResetEmailData): string {
  return emailLayout({
    title: 'Reset Your FlowDesk Password',
    previewText: 'Reset your FlowDesk password',
    body: `
      <div style="text-align: center; padding: 32px 0;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Reset Your Password</h1>
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
          Hi ${escapeHtml(data.name)},
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          We received a request to reset your password. Click the button below to
          choose a new password.
        </p>
        <a href="${escapeHtml(data.resetUrl)}"
           style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff;
                  text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Reset Password
        </a>
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
          This password reset link will expire in ${escapeHtml(data.expiresIn)}.
          If you did not request a password reset, please ignore this email
          or contact support if you have concerns.
        </p>
      </div>
    `,
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
