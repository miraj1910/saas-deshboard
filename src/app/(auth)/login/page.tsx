import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          F
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in to FlowDesk</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>
      <Suspense fallback={<div className="h-[300px] animate-pulse rounded-lg bg-muted/50" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="font-medium text-foreground underline underline-offset-4 hover:text-teal-600">
          Sign up
        </a>
      </p>
    </div>
  )
}
