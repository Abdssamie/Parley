import React from 'react'
import { Sparkles } from 'lucide-react'
import { NeutralStatCard } from '@/components/ui/neutral-card'

interface CampaignMetricsProps {
  campaign: {
    title: string
    budget?: number
    targetNiche: string
    deliverableRequirements: string
    status: string
  } | null
  metrics: {
    totalCreators: number
    totalThreads: number
    totalCommittedSpend: number
    pendingApprovals: number
    stageCounts: {
      discovered: number
      pitched: number
      negotiating: number
      accepted: number
      declined: number
    }
  } | null
}

export const CampaignMetrics: React.FC<CampaignMetricsProps> = ({ campaign, metrics }) => {
  const budget = campaign?.budget ?? 2000
  const committedSpend = metrics?.totalCommittedSpend ?? 0
  const pendingApprovals = metrics?.pendingApprovals ?? 0
  const totalInPipeline = metrics?.totalThreads ?? 0

  return (
    <div className="space-y-4">
      {/* Campaign Brief Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/95 p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-zinc-300 font-medium">
              Live Campaign
            </div>
            <span className="text-xs text-zinc-400 font-medium">Niche: {campaign?.targetNiche ?? 'Developer Tools'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {campaign?.title ?? 'Campaign Workspace'}
          </h1>
          <p className="text-xs text-zinc-400 sm:text-sm max-w-2xl font-normal">
            Deliverables: <span className="text-zinc-200 font-medium">{campaign?.deliverableRequirements ?? '1 Video + 1 Post'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-800/40 px-5 py-3.5 rounded-xl border border-white/5">
          <div className="text-right">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Campaign Budget</div>
            <div className="text-xl font-bold text-white">
              ${budget.toLocaleString()} <span className="text-xs font-normal text-zinc-400">allocated</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Autonomous Gate</div>
            <div className="flex items-center justify-end gap-1 text-xs font-medium text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Auto-negotiating
            </div>
          </div>
        </div>
      </div>

      {/* Neutral Stat Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeutralStatCard
          title="Committed Spend"
          value={`$${committedSpend.toLocaleString()}`}
          badgeText="+12.5%"
          badgeTrend="up"
          trendText="Locked into accepted contracts"
          trendSubtext={`$${budget.toLocaleString()} total campaign cap`}
        />

        <NeutralStatCard
          title="Active Creators"
          value={totalInPipeline}
          badgeText="+8.2%"
          badgeTrend="up"
          trendText="Multi-channel outreach"
          trendSubtext="Across all pipeline stages"
        />

        <NeutralStatCard
          title="In Negotiation"
          value={metrics?.stageCounts?.negotiating ?? 0}
          badgeText="Active"
          badgeTrend="neutral"
          trendText="Active email counter-offers"
          trendSubtext="Autonomous thread dispatching"
        />

        <NeutralStatCard
          title="Needs Review"
          value={pendingApprovals}
          badgeText={pendingApprovals > 0 ? `${pendingApprovals} pending` : "All cleared"}
          badgeTrend={pendingApprovals > 0 ? "down" : "up"}
          trendText={pendingApprovals > 0 ? "Counter-offers awaiting review" : "Steady performance"}
          trendSubtext={pendingApprovals > 0 ? "Requires human approval" : "All replies within budget bounds"}
        />
      </div>
    </div>
  )
}
