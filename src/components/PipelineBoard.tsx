import React, { useState } from 'react'
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
  Clock,
  ExternalLink,
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
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: 'discovered',
    label: 'Discovered',
    description: 'Intelligence scraped, ready for outreach',
    icon: Search,
  },
  {
    id: 'pitched',
    label: 'Pitched',
    description: 'Outreach dispatched via AgentMail',
    icon: Send,
  },
  {
    id: 'negotiating',
    label: 'Negotiating',
    description: 'Active counter-offers (<= 125% cap)',
    icon: MessageSquare,
  },
  {
    id: 'review_required',
    label: 'Review Required',
    description: 'Human Approval Gate (> 125% cap)',
    icon: ShieldAlert,
  },
  {
    id: 'accepted',
    label: 'Accepted',
    description: 'Terms agreed, contract/brief link active',
    icon: CheckCircle2,
  },
  {
    id: 'declined',
    label: 'Declined / Ghosted',
    description: 'Passed or timed out (> 5 days)',
    icon: XCircle,
  },
]

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  threads,
  onSelectThread,
  onApproveCounter,
  onSimulateReply,
}) => {
  const [declinedSubFilter, setDeclinedSubFilter] = useState<'all' | 'declined' | 'ghosted'>('all')

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 items-start">
      {STAGES.map((stage) => {
        let stageThreads = threads.filter((t) => {
          if (stage.id === 'declined') {
            if (declinedSubFilter === 'declined') return t.stage === 'declined'
            if (declinedSubFilter === 'ghosted') return t.stage === 'ghosted'
            return t.stage === 'declined' || t.stage === 'ghosted'
          }
          return t.stage === stage.id
        })

        const StageIcon = stage.icon
        const isHumanGateColumn = stage.id === 'review_required'

        return (
          <div
            key={stage.id}
            className={`flex flex-col rounded-xl border bg-card/60 p-2.5 shadow-xs transition-colors ${
              isHumanGateColumn ? 'border-border/90 bg-muted/20' : 'border-border'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5 mb-2.5 border border-border/60">
              <div className="flex items-center gap-2 min-w-0">
                <StageIcon className="h-4 w-4 shrink-0 text-foreground" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-foreground tracking-tight block truncate">
                    {stage.label}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold shrink-0 h-5 px-1.5">
                {stageThreads.length}
              </Badge>
            </div>

            {/* Sub-filter pill for Declined / Ghosted column */}
            {stage.id === 'declined' && (
              <div className="flex items-center gap-1 mb-2 px-0.5">
                <button
                  type="button"
                  onClick={() => setDeclinedSubFilter('all')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                    declinedSubFilter === 'all'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDeclinedSubFilter('declined')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                    declinedSubFilter === 'declined'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Declined
                </button>
                <button
                  type="button"
                  onClick={() => setDeclinedSubFilter('ghosted')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                    declinedSubFilter === 'ghosted'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ghosted
                </button>
              </div>
            )}

            {/* Cards List */}
            <div className="flex-1 space-y-2.5 min-h-[160px]">
              {stageThreads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                  No creators in {stage.label.toLowerCase()}
                </div>
              ) : (
                stageThreads.map((thread) => {
                  const creator = thread.creator
                  const budget = thread.campaign?.budget ?? 2000
                  const reqRate = thread.requestedRate ?? thread.proposedFee
                  const delta = reqRate - budget
                  const pct = Math.round((delta / budget) * 100)
                  const isOverBudget = reqRate > budget

                  return (
                    <Card
                      key={thread._id}
                      className={`group relative cursor-pointer border transition-all duration-150 shadow-xs hover:shadow-md bg-card ${
                        thread.pendingApproval || stage.id === 'review_required'
                          ? 'border-border hover:border-foreground/40 bg-muted/30'
                          : 'border-border/80 hover:border-border'
                      }`}
                      onClick={() => onSelectThread(thread._id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Creator Header & Brand Fit Score */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {creator?.name ?? 'Unknown Creator'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {creator?.audienceNiche ?? 'Tech'} • {creator?.platform ?? 'YouTube'}
                            </p>
                          </div>

                          {creator?.brandFitScore && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium border-border/80 bg-muted/40 text-foreground shrink-0"
                            >
                              <Sparkles className="mr-0.5 h-2.5 w-2.5 text-muted-foreground" />
                              {creator.brandFitScore}%
                            </Badge>
                          )}
                        </div>

                        {/* Firecrawl Scraped Snippet */}
                        {creator?.scrapedSummary && (
                          <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                            {creator.scrapedSummary}
                          </p>
                        )}

                        {/* Rule Trigger Tag */}
                        {thread.ruleTriggered && (
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-medium tracking-tight uppercase px-1.5 py-0 h-4"
                            >
                              {thread.ruleTriggered === 'rule_a' && 'Rule A: Auto-Accept'}
                              {thread.ruleTriggered === 'rule_b' && 'Rule B: Counter <=125%'}
                              {thread.ruleTriggered === 'rule_c' && 'Rule C: Hard Block'}
                              {thread.ruleTriggered === 'rule_d' && 'Rule D: Declined'}
                            </Badge>
                          </div>
                        )}

                        {/* Ghosted Indicator */}
                        {thread.stage === 'ghosted' && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>No reply for &gt;5 days</span>
                          </div>
                        )}

                        {/* Pending Approval Alert Banner */}
                        {(thread.pendingApproval || stage.id === 'review_required') && (
                          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-foreground border border-border">
                            <ShieldAlert className="h-3 w-3 shrink-0 text-foreground" />
                            <span className="truncate">Approval Gate: Counter Drafted</span>
                          </div>
                        )}

                        {/* Rate & Budget Comparison Footer */}
                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                          <div className="min-w-0">
                            <span className="text-[10px] text-muted-foreground uppercase">Rate: </span>
                            <span className="font-semibold text-foreground text-xs">
                              ${reqRate.toLocaleString()}
                            </span>
                            {isOverBudget ? (
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                (+{pct}%)
                              </span>
                            ) : (
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                (cap: ${budget.toLocaleString()})
                              </span>
                            )}
                          </div>

                          {thread.sentimentScore !== undefined && (
                            <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1 h-4">
                              {thread.sentimentScore}/10
                            </Badge>
                          )}
                        </div>

                        {/* Direct Card Actions (All wired, no dead elements) */}
                        <div
                          className="flex items-center gap-1.5 pt-1"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          {thread.pendingApproval || stage.id === 'review_required' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onApproveCounter(thread._id)}
                                className="h-6 flex-1 text-[10px] font-medium"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectThread(thread._id)}
                                className="h-6 text-[10px] border-border text-foreground hover:bg-muted px-2"
                              >
                                Review
                              </Button>
                            </>
                          ) : stage.id === 'negotiating' || stage.id === 'pitched' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSimulateReply(thread._id)}
                              className="h-6 flex-1 text-[10px] border-border text-foreground hover:bg-muted"
                              title="Simulate inbound creator reply"
                            >
                              <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                              Sim Reply
                            </Button>
                          ) : thread.contractLink ? (
                            <a
                              href={thread.contractLink}
                              target="_blank"
                              rel="noreferrer"
                              className="h-6 flex-1 text-[10px] inline-flex items-center justify-center rounded-md border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="mr-1 h-2.5 w-2.5" />
                              Contract Link
                            </a>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectThread(thread._id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Open negotiation thread"
                            aria-label="Open negotiation thread"
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

