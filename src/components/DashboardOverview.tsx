import * as React from 'react'
import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import {
  DollarSign,
  Users,
  Target,
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Eye,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { AppNavView } from './app-sidebar'

interface DashboardOverviewProps {
  onNavigate: (view: AppNavView) => void
  onOpenResearch: () => void
  onOpenNewCampaign: () => void
  onOpenNewCreator: () => void
  onSelectCampaign: (campaign: Doc<'campaigns'>) => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenResearch,
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

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Executive Dashboard</span>
            <Badge variant="outline" className="text-xs font-mono">
              Live WebSocket Sync
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Realtime autonomous outreach metrics, campaign allocations, and talent acquisition.
          </p>
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
            variant="outline"
            onClick={onOpenNewCreator}
            className="flex items-center gap-1.5 text-xs shadow-xs"
          >
            <Users className="size-3.5" />
            <span>Add Creator</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenResearch}
            className="flex items-center gap-1.5 text-xs shadow-xs font-medium"
          >
            <Sparkles className="size-3.5" />
            <span>AI Pitch Agent</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Budget */}
        <Card className="shadow-xs cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('campaigns')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Budget
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              ${stats.totalBudget.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{campaigns.length} total campaigns</span>
              <span className="text-primary font-medium flex items-center">
                View table <ArrowUpRight className="size-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="shadow-xs cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => onNavigate('campaigns')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Campaigns
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.activeCampaigns}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{stats.planningCampaigns} in planning</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                Manage <ArrowUpRight className="size-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Creators & Reach */}
        <Card className="shadow-xs cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => onNavigate('creators')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Creator Reach
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Eye className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatNumber(stats.totalFollowers)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{stats.totalCreators} creators enrolled</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center">
                Directory <ArrowUpRight className="size-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Autonomous Pipeline */}
        <Card className="shadow-xs cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => onNavigate('pipeline')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Negotiation Pipeline
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Compass className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.activeThreads}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{stats.pendingApprovals} pending review</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center">
                Board <ArrowUpRight className="size-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Detailed Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Campaigns Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Active Campaigns</CardTitle>
                <CardDescription className="text-xs">
                  Ongoing marketing sponsorship initiatives with autonomous outreach.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('campaigns')}
                className="text-xs flex items-center gap-1"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No campaigns created yet. Click "New Campaign" to create one.
                </div>
              ) : (
                campaigns.slice(0, 4).map((c) => {
                  const symbol = c.currency === 'EUR' ? '€' : c.currency === 'GBP' ? '£' : '$'

                  return (
                    <div
                      key={c._id}
                      onClick={() => onSelectCampaign(c)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{c.title}</span>
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.targetNiche || c.brief || 'Target audience parameters defined'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">
                          {symbol}{c.budget.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.startDate || 'Immediate'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Creator Leads Preview */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Top Creator Leads</CardTitle>
                <CardDescription className="text-xs">
                  Recently enriched creators ready for outreach dispatch.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('creators')}
                className="text-xs flex items-center gap-1"
              >
                <span>View Directory Table</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </CardHeader>

            <CardContent>
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
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20"
                    >
                      <Avatar className="size-8 border border-border shrink-0">
                        <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs truncate">{cr.name}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {cr.platform}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{formatNumber(cr.followers)} followers</span>
                          {cr.brandFitScore && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Fit: {cr.brandFitScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Platform Health & Agent Status */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Agent Intelligence</CardTitle>
              <CardDescription className="text-xs">
                Autonomous negotiation loop & scraper status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Negotiation Agent</span>
                </div>
                <span>Online & Ready</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-500" />
                  <span>Firecrawl Scraper</span>
                </div>
                <span>Connected</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Committed Budget</span>
                  <span className="font-semibold text-foreground">
                    ${stats.committedSpend.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Avg Estimated Cost</span>
                  <span className="font-semibold text-foreground">
                    ${stats.avgCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Potential Impressions</span>
                  <span className="font-semibold text-foreground">
                    {formatNumber(stats.totalViews)}
                  </span>
                </div>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => onNavigate('pipeline')}
                className="w-full flex items-center justify-center gap-2 mt-3 shadow-xs font-medium"
              >
                <Compass className="size-3.5" />
                <span>Open Live Kanban Pipeline</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
export default DashboardOverview
