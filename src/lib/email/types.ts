export type EmailAttachment = {
  filename: string
  content: string | Buffer
  contentType?: string
}

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export type WelcomeEmailData = {
  email: string
  name: string
  workspaceName: string
  loginUrl: string
}

export type InviteEmailData = {
  email: string
  inviterName: string
  workspaceName: string
  inviteUrl: string
  role: string
}

export type InvoiceSentEmailData = {
  email: string
  clientName: string
  invoiceNumber: string
  totalAmount: string
  dueDate: string
  invoiceUrl: string
  workspaceName: string
}

export type ProjectUpdateEmailData = {
  email: string
  projectName: string
  clientName: string
  status: string
  projectUrl: string
  workspaceName: string
}

export type PasswordResetEmailData = {
  email: string
  name: string
  resetUrl: string
  expiresIn: string
}
