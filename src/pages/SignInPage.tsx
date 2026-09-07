import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'

export const SignInPage: React.FC = () => {
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect if already authenticated
  if (session.data?.user) {
    return <Navigate to="/dashboard" />
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.')
      } else {
        void navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async () => {
    const demoEmail = 'demo@parley.ai'
    const demoPassword = 'Password123!'
    setEmail(demoEmail)
    setPassword(demoPassword)
    setLoading(true)
    setErrorMessage(null)

    try {
      // First try signing in
      const res = await authClient.signIn.email({
        email: demoEmail,
        password: demoPassword,
      })

      if (res.error) {
        // If demo user doesn't exist yet, automatically create it
        const signUpRes = await authClient.signUp.email({
          email: demoEmail,
          password: demoPassword,
          name: 'Demo Executive',
        })

        if (signUpRes.error) {
          setErrorMessage(signUpRes.error.message || 'Failed to initialize demo account.')
        } else {
          void navigate({ to: '/dashboard' })
        }
      } else {
        void navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background text-foreground overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="flex items-center gap-2 mb-2 group">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Parley</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your autonomous CRM dashboard & negotiation pipeline.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="executive@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-10 text-sm bg-background/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 h-10 text-sm bg-background/50 border-border"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-10 font-medium cursor-pointer shadow-sm">
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full h-9 text-xs border-dashed border-border/80 hover:bg-accent/50 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ShieldCheck className="mr-1.5 size-3.5 text-emerald-500" />
            <span>One-Click Quick Demo Sign In</span>
          </Button>
        </div>

        {/* Footer switcher */}
        <div className="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground space-y-2">
          <p>
            Don't have an account yet?{' '}
            <Link to="/sign-up" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            <Link to="/" className="text-muted-foreground hover:text-foreground hover:underline">
              ← Return to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
