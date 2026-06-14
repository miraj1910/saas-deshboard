import { UserType } from '@prisma/client'
import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      userType: UserType
      workspaceSlug: string | null
      onboardingComplete: boolean
    } & DefaultSession['user']
  }

  interface User {
    userType: UserType
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userType: UserType
    workspaceSlug: string | null
    onboardingComplete: boolean
  }
}
