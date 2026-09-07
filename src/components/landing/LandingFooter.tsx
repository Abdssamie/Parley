import React from 'react'
import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-background py-10 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-3.5" />
            </div>
            <span className="font-bold tracking-tight text-sm text-foreground">Parley</span>
            <span className="text-xs text-muted-foreground">• Autonomous Influencer CRM</span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link to="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Parley, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
