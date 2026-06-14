'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { config } from '@/lib/config'

export async function requestPasswordResetAction(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { success: true }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  })

  const resetUrl = `${config.appUrl}/reset-password?token=${token}`

  sendPasswordResetEmail({
    email,
    name: user.name ?? 'User',
    resetUrl,
    expiresIn: '1 hour',
  }).catch(() => {})

  return { success: true }
}

export async function resetPasswordAction(token: string, password: string) {
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return { success: false, error: 'Invalid or expired reset link' }
  }

  if (resetToken.usedAt) {
    return { success: false, error: 'This reset link has already been used' }
  }

  if (resetToken.expiresAt < new Date()) {
    return { success: false, error: 'This reset link has expired' }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true }
}
