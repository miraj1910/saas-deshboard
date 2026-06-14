import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/auth.config'

const prismaAdapter = PrismaAdapter(prisma)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...prismaAdapter,
    createUser: (data) =>
      prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? '',
          passwordHash: 'OAUTH',
          userType: 'TEAM',
          avatarUrl: data.image,
        },
      }),
    getUser: (id) => prisma.user.findUnique({ where: { id } }),
    getUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    updateUser: ({ id, ...data }) =>
      prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name ?? '' }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.image !== undefined && { avatarUrl: data.image }),
        },
      }),
  },
  ...config,
})
