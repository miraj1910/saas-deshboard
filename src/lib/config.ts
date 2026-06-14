export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000',
  emailFrom: process.env.EMAIL_FROM ?? 'FlowDesk <noreply@flowdesk.app>',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@flowdesk.com',
}
