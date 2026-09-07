import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Target,
  Users,
  Mail,
  Settings,
  Search,
} from 'lucide-react'
import { NeutralStatCard, NeutralWaveChartCard } from '@/components/ui/neutral-card'

export const LandingHero: React.FC = () => {
  const [period, setPeriod] = useState<'3m' | '30d' | '7d'>('3m')
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20 border-b border-border/40 bg-gradient-to-b from-background via-background to-background/80">
      {/* Background Dot Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Creator outreach & negotiations,{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              on autopilot
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Parley discovers top creators, vets audience metrics, and autonomously negotiates rate cards within your strict budget guardrails.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base font-semibold cursor-pointer shadow-md gap-2">
                  <span>Go to Workspace</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-up">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold cursor-pointer shadow-md gap-2">
                    <span>Start Free</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button variant="outline" size="lg" className="h-12 px-6 text-base font-medium cursor-pointer">
                    <span>Sign In</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Visual Container with Top Light Effect and Bottom Fade */}
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="relative group">
            {/* Top background glow effect - positioned above the dashboard */}
            <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/45 rounded-full blur-3xl pointer-events-none" />

            {/* Dashboard Mockup Card */}
            <div className="relative rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col md:flex-row">
                {/* Left Mini Sidebar */}
                <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-border/50 bg-[#161619] p-4 space-y-5 select-none">
                  <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                    <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                      <Sparkles className="size-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs tracking-tight text-foreground">Parley CRM</span>
                      <span className="text-[10px] text-muted-foreground">Admin Workspace</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Dashboards
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/60 text-xs font-medium text-foreground">
                      <LayoutDashboard className="size-3.5 text-primary" />
                      <span>Overview</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground">
                      <Target className="size-3.5" />
                      <span>Campaigns</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Outreach
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground">
                      <Users className="size-3.5" />
                      <span>Creators CRM</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground">
                      <Mail className="size-3.5" />
                      <span>Negotiation Inbox</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/40">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Settings
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:text-foreground">
                      <Settings className="size-3.5" />
                      <span>Guardrails</span>
                    </div>
                  </div>
                </div>

                {/* Right Main Dashboard Panel */}
                <div className="flex-1 min-w-0 p-5 md:p-6 space-y-5 bg-[#1a1a1d]">
                  {/* Top Mini Header */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50 max-w-xs w-full">
                      <Search className="size-3.5 text-muted-foreground" />
                      <span>Search campaigns, creators...</span>
                      <kbd className="ml-auto text-[10px] font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/50">
                        ⌘K
                      </kbd>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="hidden sm:inline hover:text-foreground cursor-pointer">Pipeline</span>
                      <span className="hidden sm:inline hover:text-foreground cursor-pointer">Campaigns</span>
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        P
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Title */}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Executive Overview</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Real-time autonomous outreach metrics and deal pipeline status
                    </p>
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <NeutralStatCard
                      title="Total Budget"
                      value="$23,500"
                      badgeText="+12.5%"
                      badgeTrend="up"
                      trendText="Trending up this month"
                      trendSubtext="2 campaigns allocated"
                    />
                    <NeutralStatCard
                      title="Active Campaigns"
                      value="1"
                      trendText="High velocity pacing"
                      trendSubtext="0 in planning, 1 live"
                    />
                    <NeutralStatCard
                      title="Audience Reach"
                      value="6.7M"
                      trendText="Strong audience retention"
                      trendSubtext="21 verified talent dossiers"
                    />
                    <NeutralStatCard
                      title="Negotiation Pipeline"
                      value="1"
                      badgeText="+4.5%"
                      badgeTrend="up"
                      trendText="Steady performance"
                      trendSubtext="Auto-negotiating within caps"
                    />
                  </div>

                  {/* Signature Dual-Line Wave Chart */}
                  <NeutralWaveChartCard
                    title="Outreach & Engagement Velocity"
                    subtitle="Real-time multi-channel engagement and negotiation message impressions"
                    activePeriod={period}
                    onPeriodChange={setPeriod}
                  />

                  {/* Pipeline Table Preview */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#1e1e22]/90 p-4 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">Active Talent Negotiations</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          4 in progress
                        </span>
                      </div>
                      <span className="text-zinc-400 text-[11px]">Real-time thread state</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-zinc-400">
                            <th className="pb-2 font-medium">Creator</th>
                            <th className="pb-2 font-medium">Platform</th>
                            <th className="pb-2 font-medium">Stage</th>
                            <th className="pb-2 font-medium">Target Cap</th>
                            <th className="pb-2 font-medium text-right">Agreed Offer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                          <tr>
                            <td className="py-2.5 font-medium text-zinc-100">@techreview_daily</td>
                            <td className="py-2.5 text-zinc-400">YouTube Dedicated</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Negotiating
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-zinc-400">$2,500</td>
                            <td className="py-2.5 font-mono text-emerald-400 font-semibold text-right">$2,200</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium text-zinc-100">@sarah_fitlife</td>
                            <td className="py-2.5 text-zinc-400">Instagram Reel</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Agreed & Locked
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-zinc-400">$1,800</td>
                            <td className="py-2.5 font-mono text-emerald-400 font-semibold text-right">$1,650</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-medium text-zinc-100">@gaming_nexus</td>
                            <td className="py-2.5 text-zinc-400">Twitch + TikTok</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Pitched
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-zinc-400">$3,200</td>
                            <td className="py-2.5 font-mono text-zinc-400 text-right">—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom fade effect - gradient overlay that fades the preview into the background */}
              <div className="absolute bottom-0 left-0 w-full h-32 md:h-44 bg-gradient-to-b from-background/0 via-background/70 to-background rounded-b-xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
