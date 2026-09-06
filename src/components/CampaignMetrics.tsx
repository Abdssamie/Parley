import React from 'react'
import { DollarSign, Users, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CampaignMetricsProps {
  campaign: {
    title: string
    budgetCap: number
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
  const budgetCap = campaign?.budgetCap ?? 2000
  const committedSpend = metrics?.totalCommittedSpend ?? 0
  const pendingApprovals = metrics?.pendingApprovals ?? 0
  const totalInPipeline = metrics?.totalThreads ?? 0

  return (
    <div className="space-y-4">
      {/* Campaign Brief Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-xs uppercase font-semibold">
              Live Campaign
            </Badge>
            <span className="text-xs text-slate-400 font-medium">Niche: {campaign?.targetNiche ?? 'Developer Tools'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {campaign?.title ?? 'Campaign Workspace'}
          </h1>
          <p className="text-xs text-slate-300 sm:text-sm max-w-2xl font-normal">
            Deliverables: <span className="text-indigo-200 font-semibold">{campaign?.deliverableRequirements ?? '1 Video + 1 Post'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-300">Target Budget Cap</div>
            <div className="text-xl font-bold text-emerald-400">
              ${budgetCap.toLocaleString()} <span className="text-xs font-normal text-slate-300">/ creator</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-300">Autonomous Gate</div>
            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Auto-negotiating
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Committed Spend</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              ${committedSpend.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Locked into accepted contracts
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Creators</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalInPipeline}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Across all pipeline stages
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Negotiation</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {metrics?.stageCounts?.negotiating ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Active email counter-offers
            </p>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm transition-colors ${
          pendingApprovals > 0
            ? 'border-red-300 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${pendingApprovals > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                Needs Review
              </span>
              <div className={`rounded-lg p-2 ${
                pendingApprovals > 0
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 animate-pulse'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}>
                {pendingApprovals > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
            </div>
            <div className={`mt-2 text-2xl font-bold ${pendingApprovals > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
              {pendingApprovals}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {pendingApprovals > 0 ? 'Counter-offers waiting on human approval' : 'All agent replies within budget bounds'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
