import * as React from 'react'
import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import {
  Target,
  ArrowUpRight,
  UserRoundPlus,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NeutralStatCard, NeutralWaveChartCard } from '@/components/ui/neutral-card'
import type { AppNavView } from './app-sidebar'

interface DashboardOverviewProps {
  onNavigate: (view: AppNavView) => void
  onOpenNewCampaign: () => void
  onOpenNewCreator: () => void
  onSelectCampaign: (campaign: Doc<'campaigns'>) => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenNewCampaign,
  onOpenNewCreator,
  onSelectCampaign,
}) => {
  const campaigns = useQuery(api.campaigns.list, {}) ?? []
  const creators = useQuery(api.creators.list, {}) ?? []
  const activeCampaign = campaigns.length > 0 ? campaigns[0] : null
  const metrics = useQuery(api.campaigns.getMetrics, {
    campaignId: activeCampaign?._id ?? undefined,
  })
  const rawThreads = useQuery(api.threads.listByCampaign, {
    campaignId: activeCampaign?._id ?? undefined,
  }) ?? []

  // Calculated Metrics during render
  const stats = useMemo(() => {
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
    const planningCampaigns = campaigns.filter((c) => c.status === 'planning').length

    let totalFollowers = 0
    let totalViews = 0
    let totalCost = 0
    let costCount = 0

    for (const c of creators) {
      if (c.followers) totalFollowers += c.followers
      if (c.views) totalViews += c.views
      if (c.estCost) {
        totalCost += c.estCost
        costCount += 1
      }
    }

    const avgCost = costCount > 0 ? Math.round(totalCost / costCount) : 0

    return {
      totalBudget,
      activeCampaigns,
      planningCampaigns,
      totalCreators: creators.length,
      totalFollowers,
      totalViews,
      avgCost,
      activeThreads: rawThreads.length,
      pendingApprovals: metrics?.pendingApprovals ?? 0,
      committedSpend: metrics?.totalCommittedSpend ?? 0,
    }
  }, [campaigns, creators, rawThreads, metrics])

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const [chartPeriod, setChartPeriod] = React.useState<'3m' | '30d' | '7d'>('3m')

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Executive Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenNewCampaign}
            className="flex items-center gap-1.5 text-xs shadow-xs"
          >
            <Target className="size-3.5" />
            <span>New Campaign</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenNewCreator}
            className="flex items-center gap-1.5 text-xs shadow-xs"
          >
            <UserRoundPlus className="size-3.5" />
            <span>Add Creator</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid - Neutral Claymorphic Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeutralStatCard
          title="Total Budget"
          value={`$${stats.totalBudget.toLocaleString()}`}
          badgeText="+12.5%"
          badgeTrend="up"
          trendText="Trending up this month"
          trendSubtext={`${campaigns.length} campaigns allocated`}
          onClick={() => onNavigate('campaigns')}
        />

        <NeutralStatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          badgeText="+8.2%"
          badgeTrend="up"
          trendText="High velocity pacing"
          trendSubtext={`${stats.planningCampaigns} in planning, ${stats.activeCampaigns} live`}
          onClick={() => onNavigate('campaigns')}
        />

        <NeutralStatCard
          title="Creator Reach"
          value={formatNumber(stats.totalFollowers)}
          badgeText="+14.2%"
          badgeTrend="up"
          trendText="Strong audience retention"
          trendSubtext={`${stats.totalCreators} verified talent dossiers`}
          onClick={() => onNavigate('creators')}
        />

        <NeutralStatCard
          title="Negotiation Pipeline"
          value={stats.activeThreads}
          badgeText={stats.pendingApprovals > 0 ? `${stats.pendingApprovals} review` : "+4.5%"}
          badgeTrend={stats.pendingApprovals > 0 ? "down" : "up"}
          trendText={stats.pendingApprovals > 0 ? "Pending human review" : "Steady performance"}
          trendSubtext={stats.pendingApprovals > 0 ? `${stats.pendingApprovals} counter-offers waiting` : "Auto-negotiating within caps"}
          onClick={() => onNavigate('pipeline')}
        />
      </div>

      {/* 2b. Neutral Waveform Analytics Card */}
      <NeutralWaveChartCard
        title="Outreach & Engagement Velocity"
        subtitle="Real-time multi-channel engagement and message impressions"
        activePeriod={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {/* 3. Detailed Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Campaigns Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.25)] space-y-4">
            <div className="flex flex-row items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Active Campaigns</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ongoing marketing sponsorship initiatives with autonomous outreach.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('campaigns')}
                className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </div>

            <div className="space-y-2.5">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No campaigns created yet. Click "New Campaign" to create one.
                </div>
              ) : (
                campaigns.slice(0, 4).map((c) => {
                  const symbol = c.currency === 'EUR' ? '€' : c.currency === 'GBP' ? '£' : '$'

                  return (
                    <div
                      key={c._id}
                      onClick={() => onSelectCampaign(c)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-zinc-800/30 hover:bg-zinc-800/60 hover:border-white/10 cursor-pointer transition-all"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white truncate">{c.title}</span>
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-300 capitalize">
                            {c.status}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">
                          {c.targetNiche || c.brief || 'Target audience parameters defined'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm text-white">
                          {symbol}{c.budget.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {c.startDate || 'Immediate'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Quick Creator Leads Preview */}
          <div className="rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.25)] space-y-4">
            <div className="flex flex-row items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Top Creator Leads</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Recently enriched creators ready for outreach dispatch.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('creators')}
                className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white"
              >
                <span>View Directory Table</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {creators.slice(0, 4).map((cr) => {
                const initials = cr.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={cr._id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-zinc-800/30"
                  >
                    <Avatar className="size-8 border border-white/10 shrink-0">
                      <AvatarFallback className="text-[11px] font-semibold bg-white/10 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">{cr.name}</span>
                        <span className="text-[10px] text-zinc-400 border border-white/10 bg-white/[0.05] px-1.5 py-0.5 rounded-md capitalize">
                          {cr.platform}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{formatNumber(cr.followers)} followers</span>
                        {cr.brandFitScore && (
                          <span className="text-zinc-300 font-medium">
                            Fit: {cr.brandFitScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Agent Status */}
        <div className="space-y-6">
          <div className="rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.25)] space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">Agent Intelligence</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Autonomous negotiation loop & scraper status.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/[0.06] text-zinc-200 font-medium">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Negotiation Agent</span>
                </div>
                <span className="text-zinc-400 text-[11px]">Online & Ready</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/[0.06] text-zinc-200 font-medium">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-400" />
                  <span>Web Intelligence</span>
                </div>
                <span className="text-zinc-400 text-[11px]">Connected</span>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Committed Budget</span>
                  <span className="font-semibold text-white">
                    ${stats.committedSpend.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Avg Estimated Cost</span>
                  <span className="font-semibold text-white">
                    ${stats.avgCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Potential Impressions</span>
                  <span className="font-semibold text-white">
                    {formatNumber(stats.totalViews)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('pipeline')}
                className="w-full flex items-center justify-center gap-2 mt-2 border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white shadow-xs font-medium"
              >
                <Compass className="size-3.5" />
                <span>Open Live Kanban Pipeline</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardOverview
