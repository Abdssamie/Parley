import React from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const UserMenu: React.FC = () => {
  const session = authClient.useSession()
  const navigate = useNavigate()
  const user = session.data?.user

  const handleSignOut = async () => {
    await authClient.signOut()
    void navigate({ to: '/sign-in' })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/70 bg-secondary/50 text-xs shadow-xs">
        <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
          {user?.name ? user.name.charAt(0).toUpperCase() : <User className="size-3" />}
        </div>
        <span className="font-medium max-w-[140px] truncate text-foreground">
          {user?.name || user?.email || 'Authenticated User'}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer gap-1.5"
        title="Sign Out"
      >
        <LogOut className="size-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  )
}
