import React from 'react'
import { Cpu } from 'lucide-react'
import { NeutralStatCard } from '@/components/ui/neutral-card'

interface CampaignMetricsProps {
  campaign: {
    _id?: string
    title: string
    budget?: number
    targetNiche: string
    deliverableRequirements: string
    status: string
    autonomyMode?: 'full_autonomy' | 'human_in_the_loop'
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
      review_required?: number
      accepted: number
      declined: number
      ghosted?: number
    }
  } | null
  onToggleAutonomyMode?: () => void
}

export const CampaignMetrics: React.FC<CampaignMetricsProps> = ({
  campaign,
  metrics,
  onToggleAutonomyMode,
}) => {
  const budget = campaign?.budget ?? 2000
  const committedSpend = metrics?.totalCommittedSpend ?? 0
  const pendingApprovals = metrics?.pendingApprovals ?? 0
  const totalInPipeline = metrics?.totalThreads ?? 0
  const autonomyMode = campaign?.autonomyMode ?? 'human_in_the_loop'

  return (
    <div className="space-y-4">
      {/* Campaign Brief Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-foreground shadow-xs">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            <div className="inline-flex items-center rounded-md border border-border bg-secondary/80 px-2 py-0.5 text-xs text-foreground font-medium">
              Live Campaign
            </div>
            <span className="text-xs text-muted-foreground font-medium truncate">
              Niche: {campaign?.targetNiche ?? 'Developer Tools'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
            {campaign?.title ?? 'Campaign Workspace'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl font-normal">
            Deliverables:{' '}
            <span className="text-foreground font-medium">
              {campaign?.deliverableRequirements ?? '1 Video + 1 Post'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 px-4 py-3 rounded-lg border border-border shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Campaign Cap
            </div>
            <div className="text-lg font-bold text-foreground">
              ${budget.toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">allocated</span>
            </div>
          </div>
          <div className="h-8 w-px bg-border"></div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Autonomy Gate
            </div>
            <button
              type="button"
              onClick={onToggleAutonomyMode}
              className={`flex items-center justify-end gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border transition-colors ${
                autonomyMode === 'full_autonomy'
                  ? 'border-border bg-secondary text-foreground'
                  : 'border-border/80 bg-background text-foreground hover:bg-secondary'
              }`}
              title="Click to toggle Full Autonomy vs Human-in-the-Loop"
            >
              <Cpu className="h-3 w-3 text-muted-foreground" />
              <span>{autonomyMode === 'full_autonomy' ? 'Full Autonomy' : 'Human-in-the-Loop'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Neutral Stat Metrics Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <NeutralStatCard
          title="Committed Spend"
          value={`$${committedSpend.toLocaleString()}`}
          badgeText="Locked"
          badgeTrend="up"
          trendText="Secured in accepted deals"
          trendSubtext={`$${budget.toLocaleString()} campaign cap`}
        />

        <NeutralStatCard
          title="Active in Pipeline"
          value={totalInPipeline}
          badgeText="Live"
          badgeTrend="up"
          trendText="Multi-channel negotiation"
          trendSubtext="Across all 6 state stages"
        />

        <NeutralStatCard
          title="In Negotiation"
          value={metrics?.stageCounts?.negotiating ?? 0}
          badgeText="Rule B"
          badgeTrend="neutral"
          trendText="Active counter-offers"
          trendSubtext="Within 125% budget bounds"
        />

        <NeutralStatCard
          title="Review Required"
          value={pendingApprovals}
          badgeText={pendingApprovals > 0 ? `${pendingApprovals} Pending` : 'Cleared'}
          badgeTrend={pendingApprovals > 0 ? 'down' : 'up'}
          trendText={pendingApprovals > 0 ? 'Approval Gate active' : 'All within cap'}
          trendSubtext={pendingApprovals > 0 ? 'Rate > 125% or sentiment flag' : 'Zero blockers'}
        />
      </div>
    </div>
  )
}

