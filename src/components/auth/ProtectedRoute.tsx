import React from 'react'
import { Navigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = authClient.useSession()

  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-xs">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  if (!session.data?.user) {
    return <Navigate to="/sign-in" />
  }

  return <>{children}</>
}
