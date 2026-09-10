import React from 'react'
import {
  Search,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mail,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Id } from '../../convex/_generated/dataModel'
import type { EnrichedThread, PipelineStage } from '../types'

export type { EnrichedThread, PipelineStage }

interface PipelineBoardProps {
  threads: EnrichedThread[]
  onSelectThread: (threadId: Id<'threads'>) => void
  onApproveCounter: (threadId: Id<'threads'>) => void
  onSimulateReply: (threadId: Id<'threads'>) => void
}

const STAGES: Array<{
  id: PipelineStage
  label: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor: string
  borderColor: string
  bgHeader: string
}> = [
  {
    id: 'discovered',
    label: 'Discovered',
    icon: Search,
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800',
    bgHeader: 'bg-slate-50 dark:bg-slate-900',
  },
  {
    id: 'pitched',
    label: 'Pitched',
    icon: Send,
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-900/50',
    bgHeader: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  {
    id: 'negotiating',
    label: 'Negotiating',
    icon: MessageSquare,
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-900/50',
    bgHeader: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  {
    id: 'accepted',
    label: 'Accepted',
    icon: CheckCircle2,
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    bgHeader: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  {
    id: 'declined',
    label: 'Declined',
    icon: XCircle,
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-900/50',
    bgHeader: 'bg-red-50/50 dark:bg-red-950/20',
  },
]

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  threads,
  onSelectThread,
  onApproveCounter,
  onSimulateReply,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {STAGES.map((stage) => {
        const stageThreads = threads.filter((t) => t.stage === stage.id)
        const StageIcon = stage.icon

        return (
          <div
            key={stage.id}
            className={`flex flex-col rounded-2xl border ${stage.borderColor} bg-slate-100/60 p-3 dark:bg-slate-900/40`}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between rounded-xl ${stage.bgHeader} p-3 mb-3 border border-slate-200/60 dark:border-slate-800/60`}>
              <div className="flex items-center gap-2">
                <StageIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {stage.label}
                </span>
              </div>
              <Badge variant="secondary" className={`text-xs font-bold ${stage.badgeColor}`}>
                {stageThreads.length}
              </Badge>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {stageThreads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
                  No creators in {stage.label.toLowerCase()}
                </div>
              ) : (
                stageThreads.map((thread) => {
                  const creator = thread.creator
                  const budget = thread.campaign?.budget ?? 2000
                  const isOverBudget = thread.proposedFee > budget

                  return (
                    <Card
                      key={thread._id}
                      className={`group relative cursor-pointer border transition-all duration-150 hover:shadow-md ${
                        thread.pendingApproval
                          ? 'border-red-400 bg-red-50/20 hover:border-red-500 dark:border-red-800 dark:bg-red-950/10'
                          : 'border-slate-200 bg-white hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600'
                      }`}
                      onClick={() => onSelectThread(thread._id)}
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Creator Header & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                              {creator?.name ?? 'Unknown Creator'}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {creator?.audienceNiche ?? 'Tech'}
                            </p>
                          </div>

                          {creator?.brandFitScore && (
                            <Badge
                              className={`text-[11px] font-bold ${
                                creator.brandFitScore >= 90
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : creator.brandFitScore >= 75
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              {creator.brandFitScore}% fit
                            </Badge>
                          )}
                        </div>

                        {/* Creator Intelligence Snippet */}
                        {creator?.scrapedSummary && (
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                            {creator.scrapedSummary}
                          </p>
                        )}

                        {/* Past Sponsors Verified */}
                        {creator?.pastSponsors && creator.pastSponsors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {creator.pastSponsors.slice(0, 3).map((sponsor) => (
                              <span
                                key={sponsor}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              >
                                {sponsor}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Pending Approval Alert Banner */}
                        {thread.pendingApproval && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-red-100/80 px-2 py-1 text-[11px] font-semibold text-red-800 dark:bg-red-950/70 dark:text-red-300">
                            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-red-600" />
                            <span>Action: Counter-offer needs review</span>
                          </div>
                        )}

                        {/* Fee & Status Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Fee: </span>
                            <span
                              className={`font-bold ${
                                isOverBudget
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              ${thread.proposedFee.toLocaleString()}
                            </span>
                          </div>

                          {thread.humanOverride && (
                            <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300">
                              Manual
                            </Badge>
                          )}
                        </div>

                        {/* Direct Card Actions */}
                        <div className="flex items-center gap-1.5 pt-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          {thread.pendingApproval && (
                            <Button
                              size="sm"
                              onClick={() => onApproveCounter(thread._id)}
                              className="h-7 flex-1 bg-emerald-600 text-[10px] font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve Draft
                            </Button>
                          )}

                          {stage.id === 'negotiating' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSimulateReply(thread._id)}
                              className="h-7 flex-1 border-slate-200 text-[10px] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                              title="Simulate inbound email from this creator"
                            >
                              <Mail className="mr-1 h-3 w-3 text-indigo-500" />
                              Sim Reply
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectThread(thread._id)}
                            className="h-7 px-2 text-[10px] text-slate-600 hover:text-indigo-600 dark:text-slate-400"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
