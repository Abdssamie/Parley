import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Sparkles, Bot, Mail, Globe, Plus, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NavbarProps {
  onOpenResearch: () => void
  onOpenSettings: () => void
  onSimulateReply: () => void
  isSimulating: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenResearch,
  onOpenSettings,
  onSimulateReply,
  isSimulating,
}) => {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Collab<span className="text-indigo-600 dark:text-indigo-400">Agent</span>
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Autonomous Creator CRM
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentPath === '/'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Pipeline CRM
            </Link>
          </nav>
        </div>

        {/* Sponsor Tech Stack Badges */}
        <div className="hidden lg:flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Globe className="h-3 w-3 text-orange-500" />
            Firecrawl Scraper
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Mail className="h-3 w-3 text-blue-500" />
            AgentMail Inboxes
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            OpenAI Negotiator
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-indigo-200 bg-indigo-50/70 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Zap className="h-3 w-3 text-indigo-600" />
            Convex Live Sync
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateReply}
            disabled={isSimulating}
            className="h-9 gap-1.5 border-emerald-300 bg-emerald-50/60 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            title="Simulate incoming creator counter-offer for judges to test live"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Simulate Creator Reply</span>
            <span className="sm:hidden">Simulate</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenResearch}
            className="h-9 gap-1.5 bg-indigo-600 text-xs font-semibold text-white shadow hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Research & Pitch</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-9 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Campaign Rules
          </Button>
        </div>
      </div>
    </header>
  )
}
