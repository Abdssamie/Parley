import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Sparkles, LayoutDashboard, LogIn, Menu, X, ArrowRight } from 'lucide-react'

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-base leading-none">Parley</span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">Autonomous CRM</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="gap-2 cursor-pointer shadow-sm">
                <LayoutDashboard className="size-4" />
                <span>Open Dashboard</span>
                <ArrowRight className="size-3.5 opacity-70" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="ghost" size="sm" className="text-sm font-medium cursor-pointer">
                  <LogIn className="mr-1.5 size-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm" className="gap-1.5 cursor-pointer shadow-sm">
                  <span>Get Started</span>
                  <ArrowRight className="size-3.5 opacity-70" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-1"
          >
            FAQ
          </a>
          <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center gap-2">
                  <LayoutDashboard className="size-4" />
                  <span>Open Dashboard</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
