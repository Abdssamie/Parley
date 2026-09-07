import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (session.data?.user) {
    return <Navigate to="/dashboard" />
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split('@')[0],
      })

      if (error) {
        setErrorMessage(error.message || 'Could not create account.')
      } else {
        void navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background text-foreground overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="flex items-center gap-2 mb-2 group">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Parley</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-sm text-muted-foreground">
            Get started with autonomous influencer discovery and deal automation.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-9 h-10 text-sm bg-background/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Work Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-10 text-sm bg-background/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">
              Password (min. 8 characters)
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-9 h-10 text-sm bg-background/50 border-border"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-10 font-medium cursor-pointer shadow-sm mt-2">
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground space-y-2">
          <p>
            Already registered?{' '}
            <Link to="/sign-in" className="font-semibold text-primary hover:underline">
              Sign In
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
