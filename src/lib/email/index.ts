import { Resend } from 'resend'
import type {
  SendEmailOptions,
  WelcomeEmailData,
  InviteEmailData,
  InvoiceSentEmailData,
  ProjectUpdateEmailData,
  PasswordResetEmailData,
} from './types'
import { renderWelcomeEmail } from './templates/welcome'
import { renderInviteEmail } from './templates/invite'
import { renderInvoiceSentEmail } from './templates/invoice-sent'
import { renderProjectUpdateEmail } from './templates/project-update'
import { renderPasswordResetEmail } from './templates/password-reset'

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'FlowDesk <noreply@flowdesk.app>'
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured. Set it in your environment variables.',
    )
  }
  return new Resend(apiKey)
}

function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn(
      '[Email] RESEND_API_KEY not configured. Skipping email send.',
    )
    return { success: false, error: 'Email not configured' }
  }

  try {
    const resend = getResendClient()
    const to = Array.isArray(options.to) ? options.to : [options.to]

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType,
      })),
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Email] Send exception:', message)
    return { success: false, error: message }
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: data.email,
    subject: `Welcome to FlowDesk, ${data.name}!`,
    html: renderWelcomeEmail(data),
  })
}

export async function sendInviteEmail(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: data.email,
    subject: `You're invited to join ${data.workspaceName} on FlowDesk`,
    html: renderInviteEmail(data),
  })
}

export async function sendInvoiceSentEmail(data: InvoiceSentEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: data.email,
    subject: `Invoice ${data.invoiceNumber} from ${data.workspaceName}`,
    html: renderInvoiceSentEmail(data),
  })
}

export async function sendProjectUpdateEmail(data: ProjectUpdateEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: data.email,
    subject: `Project Update: ${data.projectName} ${data.status}`,
    html: renderProjectUpdateEmail(data),
  })
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: data.email,
    subject: 'Reset your FlowDesk password',
    html: renderPasswordResetEmail(data),
  })
}

export type {
  SendEmailOptions,
  WelcomeEmailData,
  InviteEmailData,
  InvoiceSentEmailData,
  ProjectUpdateEmailData,
  PasswordResetEmailData,
  EmailAttachment,
} from './types'
