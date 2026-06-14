import type { InvoiceSentEmailData } from '../types'
import { emailLayout } from './layout'

export function renderInvoiceSentEmail(data: InvoiceSentEmailData): string {
  return emailLayout({
    title: `Invoice ${data.invoiceNumber} from ${data.workspaceName}`,
    previewText: `Invoice ${data.invoiceNumber} for ${data.totalAmount} is ready`,
    body: `
      <div style="padding: 32px 0;">
        <h1 style="margin: 0 0 24px; font-size: 22px; color: #111827; text-align: center;">
          Invoice ${escapeHtml(data.invoiceNumber)}
        </h1>
        <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">
          Hi ${escapeHtml(data.clientName)},
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
          A new invoice has been issued by <strong>${escapeHtml(data.workspaceName)}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 6px 0 0 6px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Invoice Number</p>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${escapeHtml(data.invoiceNumber)}
              </p>
            </td>
            <td style="padding: 12px 16px; background-color: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Total Amount</p>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${escapeHtml(data.totalAmount)}
              </p>
            </td>
            <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Due Date</p>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${escapeHtml(data.dueDate)}
              </p>
            </td>
          </tr>
        </table>
        <div style="text-align: center;">
          <a href="${escapeHtml(data.invoiceUrl)}"
             style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff;
                    text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            View Invoice
          </a>
        </div>
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          If you have any questions, please reply to this email or contact your project manager.
        </p>
      </div>
    `,
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
