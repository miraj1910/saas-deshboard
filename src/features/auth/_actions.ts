'use server'

import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

function slugify(name: string): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-|-$/g, '')

  if (!slug) slug = 'workspace'

  return slug
}

async function uniqueSlug(base: string): Promise<string> {
  const suffix = Math.random().toString(36).slice(2, 6)
  const candidate = `${base}-${suffix}`
  const exists = await prisma.workspace.findUnique({ where: { slug: candidate } })
  if (exists) return uniqueSlug(base)
  return candidate
}

export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return { success: true, error: null }
  } catch (e) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid email or password' }
        default:
          return { success: false, error: 'Something went wrong. Try again.' }
      }
    }
    throw e
  }
}

export async function registerAction(name: string, email: string, password: string) {
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, name, passwordHash, userType: 'TEAM' },
  })

  const rawSlug = slugify(name)
  const slug = await uniqueSlug(rawSlug)

  const workspace = await prisma.workspace.create({ data: { name, slug } })

  await prisma.workspaceSettings.create({
    data: {
      workspaceId: workspace.id,
      timezone: 'UTC',
      companyName: null,
      companyAddress: null,
      companyTaxId: null,
      primaryColor: '#6366F1',
      theme: { darkMode: false, fontSize: 'normal' },
    },
  })

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      plan: 'FREE',
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  })

  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' },
  })

  sendWelcomeEmail({
    email: user.email,
    name: user.name ?? 'User',
    workspaceName: workspace.name,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'}/login`,
  }).catch(() => {})

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch {
    return { success: true, error: null, slug }
  }

  return { success: true, error: null, slug }
}
