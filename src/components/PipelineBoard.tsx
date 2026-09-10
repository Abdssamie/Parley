import React, { useState, useMemo } from 'react'
import {
  Search,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  GripVertical,
  Plus,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react'
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanCommitMeta,
} from '@/components/ui/kanban'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { EnrichedThread, PipelineStage } from '../types'

export type { EnrichedThread, PipelineStage }

export interface PipelineBoardProps {
  threads: EnrichedThread[]
  campaignId: Id<'campaigns'> | null
  campaignBudget?: number
  onSelectThread: (threadId: Id<'threads'>) => void
  onApproveCounter: (threadId: Id<'threads'>) => void
}

interface StageDefinition {
  id: PipelineStage
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const STAGES: StageDefinition[] = [
  {
    id: 'discovered',
    label: 'Discovered',
    description: 'Intelligence collected, ready for initial pitch',
    icon: Search,
  },
  {
    id: 'pitched',
    label: 'Pitched',
    description: 'Outreach sent via AgentMail, awaiting reply',
    icon: Send,
  },
  {
    id: 'negotiating',
    label: 'Negotiating',
    description: 'Active discussions within budget parameters',
    icon: MessageSquare,
  },
  {
    id: 'review_required',
    label: 'Review Required',
    description: 'Approval gate: rate exceeds standard benchmark',
    icon: ShieldAlert,
  },
  {
    id: 'accepted',
    label: 'Accepted',
    description: 'Terms agreed, contract and onboarding active',
    icon: CheckCircle2,
  },
  {
    id: 'declined',
    label: 'Declined / Ghosted',
    description: 'Passed or timed out with no response',
    icon: XCircle,
  },
]

function buildColumns(threadsList: EnrichedThread[]): Record<string, EnrichedThread[]> {
  return {
    discovered: threadsList.filter((t) => t.stage === 'discovered'),
    pitched: threadsList.filter((t) => t.stage === 'pitched'),
    negotiating: threadsList.filter((t) => t.stage === 'negotiating'),
    review_required: threadsList.filter((t) => t.stage === 'review_required'),
    accepted: threadsList.filter((t) => t.stage === 'accepted'),
    declined: threadsList.filter((t) => t.stage === 'declined' || t.stage === 'ghosted'),
  }
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  threads,
  campaignId,
  campaignBudget = 2000,
  onSelectThread,
  onApproveCounter,
}) => {
  // 1. Kanban Columns State (synced during render without useEffect)
  const [prevThreads, setPrevThreads] = useState(threads)
  const [columns, setColumns] = useState(() => buildColumns(threads))

  if (prevThreads !== threads) {
    setPrevThreads(threads)
    setColumns(buildColumns(threads))
  }

  // 2. Interactive Column Selection & Working Mode State
  const [activeStageId, setActiveStageId] = useState<PipelineStage | null>(null)
  const [focusedStageId, setFocusedStageId] = useState<PipelineStage | null>(null)
  const [sortRateDesc, setSortRateDesc] = useState<Record<string, boolean>>({})

  // 3. Quick Add Creator to Stage State
  const [isAddCreatorOpen, setIsAddCreatorOpen] = useState(false)
  const [targetAddStage, setTargetAddStage] = useState<PipelineStage>('discovered')
  const [selectedCreatorId, setSelectedCreatorId] = useState<Id<'creators'> | ''>('')
  const [customProposedFee, setCustomProposedFee] = useState<number>(campaignBudget)
  const [customDeliverables, setCustomDeliverables] = useState<string>('1 Dedicated Integration')

  // 4. Convex Mutations
  const updateStageMutation = useMutation(api.threads.updateStage)
  const batchApproveMutation = useMutation(api.threads.batchApproveStage)
  const createThreadInStageMutation = useMutation(api.threads.createThreadInStage)
  const allCreators = useQuery(api.creators.list, {})

  // 5. Drag and Drop Commit Handler
  const handleValueCommit = (
    _nextValue: Record<string, EnrichedThread[]>,
    meta: KanbanCommitMeta<EnrichedThread>
  ) => {
    if (meta.kind === 'column') {
      return
    }

    const threadId = String(meta.event.active.id) as Id<'threads'>
    const targetStage = meta.overContainer as PipelineStage

    // Update Convex backend
    void updateStageMutation({
      id: threadId,
      stage: targetStage,
    }).catch((err: unknown) => {
      console.error('Failed to update stage:', err)
      setColumns(meta.previousValue)
    })
  }

  // 6. Interactive Column Handlers
  const handleColumnClick = (stageId: PipelineStage) => {
    setActiveStageId((prev) => (prev === stageId ? null : stageId))
  }

  const handleOpenAddCreator = (stageId: PipelineStage, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTargetAddStage(stageId)
    setCustomProposedFee(campaignBudget)
    setIsAddCreatorOpen(true)
  }

  const handleCreateDealInStage = async () => {
    if (!campaignId || !selectedCreatorId) return
    try {
      await createThreadInStageMutation({
        campaignId,
        creatorId: selectedCreatorId as Id<'creators'>,
        stage: targetAddStage,
        proposedFee: customProposedFee,
        agreedDeliverables: customDeliverables,
      })
      setIsAddCreatorOpen(false)
      setSelectedCreatorId('')
    } catch (err) {
      console.error('Failed to add creator to stage:', err)
    }
  }

  const handleBatchApprove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!campaignId) return
    try {
      await batchApproveMutation({ campaignId })
    } catch (err) {
      console.error('Batch approval failed:', err)
    }
  }

  const toggleSortRate = (stageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSortRateDesc((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }))
  }

  const toggleFocusStage = (stageId: PipelineStage, e: React.MouseEvent) => {
    e.stopPropagation()
    setFocusedStageId((prev) => (prev === stageId ? null : stageId))
  }

  // Filter stages if one is isolated in focus view
  const visibleStages = useMemo(() => {
    if (focusedStageId) {
      return STAGES.filter((s) => s.id === focusedStageId)
    }
    return STAGES
  }, [focusedStageId])

  return (
    <div className="space-y-3">
      {/* Focused Stage Banner (if a single stage is isolated) */}
      {focusedStageId && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              Isolated View: {STAGES.find((s) => s.id === focusedStageId)?.label}
            </span>
            <span className="text-muted-foreground">• Showing deals in this stage only</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusedStageId(null)}
            className="h-7 text-xs flex items-center gap-1"
          >
            <Minimize2 className="h-3 w-3" />
            <span>Show All Stages</span>
          </Button>
        </div>
      )}

      {/* Main ReUI Radix Kanban Board */}
      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item._id}
        onValueCommit={handleValueCommit}
      >
        <KanbanBoard className="flex gap-3.5 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)] snap-x">
          {visibleStages.map((stage) => {
            const rawItems = columns[stage.id] ?? []
            const isDesc = sortRateDesc[stage.id] ?? false

            // Optional column sorting
            const stageItems = [...rawItems].sort((a, b) => {
              const feeA = a.requestedRate ?? a.proposedFee
              const feeB = b.requestedRate ?? b.proposedFee
              return isDesc ? feeB - feeA : feeA - feeB
            })

            const totalStageValue = stageItems.reduce((acc, t) => {
              return acc + (t.requestedRate ?? t.proposedFee)
            }, 0)

            const StageIcon = stage.icon
            const isSelected = activeStageId === stage.id
            const isHumanGate = stage.id === 'review_required'

            return (
              <KanbanColumn
                key={stage.id}
                value={stage.id}
                onClick={() => handleColumnClick(stage.id)}
                className={`w-80 shrink-0 rounded-xl border bg-card/70 p-2.5 transition-all duration-150 cursor-pointer snap-start ${
                  isSelected
                    ? 'border-foreground/50 ring-2 ring-primary/20 bg-muted/20 shadow-sm'
                    : isHumanGate
                      ? 'border-border/90 bg-muted/15 hover:border-border'
                      : 'border-border hover:border-border/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5 mb-2 border border-border/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <StageIcon className="h-4 w-4 shrink-0 text-foreground" />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-foreground tracking-tight block truncate">
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[11px] font-semibold h-5 px-1.5">
                      {stageItems.length}
                    </Badge>

                    {/* Quick Add Creator into this stage */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenAddCreator(stage.id, e)}
                      className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={`Add creator directly to ${stage.label}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>

                    {/* Drag Column Handle */}
                    <KanbanColumnHandle
                      className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                      title="Drag to reorder column"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </KanbanColumnHandle>
                  </div>
                </div>

                {/* Stage Financial Metric Strip */}
                <div className="flex items-center justify-between px-1 pb-2 text-[10px] text-muted-foreground border-b border-border/40 mb-2">
                  <span className="font-medium">Total: ${totalStageValue.toLocaleString()}</span>
                  <span>{stageItems.length > 0 ? `$${Math.round(totalStageValue / stageItems.length).toLocaleString()} avg` : 'Empty'}</span>
                </div>

                {/* Interactive Working Toolbar (Visible when column is clicked) */}
                {isSelected && (
                  <div
                    className="rounded-lg border border-border bg-background p-2.5 mb-2.5 space-y-2 shadow-xs animate-in fade-in-50 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        Working with {stage.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveStageId(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-snug">
                      {stage.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Batch Approve button for Review Required stage */}
                      {stage.id === 'review_required' && stageItems.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleBatchApprove}
                          className="h-6 text-[10px] flex items-center gap-1 flex-1 font-medium"
                        >
                          <Check className="h-3 w-3" />
                          <span>Approve All ({stageItems.length})</span>
                        </Button>
                      )}

                      {/* Add Creator to Stage */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleOpenAddCreator(stage.id, e)}
                        className="h-6 text-[10px] flex items-center gap-1 flex-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Creator</span>
                      </Button>

                      {/* Sort by Rate */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => toggleSortRate(stage.id, e)}
                        className="h-6 text-[10px] px-2"
                        title="Sort by rate"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>

                      {/* Focus View */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => toggleFocusStage(stage.id, e)}
                        className="h-6 text-[10px] px-2"
                        title={focusedStageId === stage.id ? 'Exit focus' : 'Isolate stage'}
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cards Container via ReUI KanbanColumnContent */}
                <KanbanColumnContent value={stage.id} className="space-y-2 min-h-[140px]">
                  {stageItems.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground hover:border-foreground/30 transition-colors"
                      onClick={(e) => handleOpenAddCreator(stage.id, e)}
                    >
                      <span className="text-[11px] font-medium text-foreground">No deals in {stage.label}</span>
                      <span className="text-[10px] mt-0.5">Click to add a creator</span>
                    </div>
                  ) : (
                    stageItems.map((thread) => {
                      const creator = thread.creator
                      const reqRate = thread.requestedRate ?? thread.proposedFee
                      const delta = reqRate - campaignBudget
                      const pct = Math.round((delta / campaignBudget) * 100)
                      const isOverBudget = reqRate > campaignBudget

                      return (
                        <KanbanItem
                          key={thread._id}
                          value={thread._id}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            onSelectThread(thread._id)
                          }}
                        >
                          <Card
                            className={`group relative cursor-pointer border transition-all duration-150 shadow-xs hover:shadow-md bg-card ${
                              thread.pendingApproval || stage.id === 'review_required'
                                ? 'border-border hover:border-foreground/40 bg-muted/20'
                                : 'border-border/80 hover:border-border'
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              {/* Creator Header */}
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {creator?.name ?? 'Unknown Creator'}
                                  </h3>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {creator?.audienceNiche ?? 'Tech'} • {creator?.platform ?? 'YouTube'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {creator?.brandFitScore && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-medium border-border/80 bg-muted/40 text-foreground h-4 px-1"
                                    >
                                      {creator.brandFitScore}% Fit
                                    </Badge>
                                  )}

                                  {/* Card Drag Handle */}
                                  <KanbanItemHandle
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing p-0.5"
                                    title="Drag to move card"
                                  >
                                    <GripVertical className="h-3 w-3" />
                                  </KanbanItemHandle>
                                </div>
                              </div>

                              {/* Action Needed Callout */}
                              {(thread.pendingApproval || stage.id === 'review_required') && (
                                <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-[10px] font-medium text-foreground border border-border">
                                  <ShieldAlert className="h-3 w-3 shrink-0 text-foreground" />
                                  <span className="truncate">Approval Gate: Counter Drafted</span>
                                </div>
                              )}

                              {/* Rate & Benchmark Comparison */}
                              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                                <div>
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
                                      (cap: ${campaignBudget.toLocaleString()})
                                    </span>
                                  )}
                                </div>

                                {thread.sentimentScore !== undefined && (
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    {thread.sentimentScore}/10
                                  </span>
                                )}
                              </div>

                              {/* Card Action Buttons */}
                              <div
                                className="flex items-center gap-1.5 pt-1"
                                onClick={(e) => e.stopPropagation()}
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
                                      className="h-6 text-[10px] border-border px-2"
                                    >
                                      Review
                                    </Button>
                                  </>
                                ) : thread.contractLink ? (
                                  <a
                                    href={thread.contractLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="h-6 flex-1 text-[10px] inline-flex items-center justify-center rounded-md border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                                  >
                                    <ExternalLink className="mr-1 h-2.5 w-2.5" />
                                    Contract
                                  </a>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSelectThread(thread._id)}
                                    className="h-6 flex-1 text-[10px] border-border"
                                  >
                                    View Thread
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSelectThread(thread._id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  title="Open thread details"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </KanbanItem>
                      )
                    })
                  )}
                </KanbanColumnContent>
              </KanbanColumn>
            )
          })}
        </KanbanBoard>

        {/* ReUI Drag Overlay */}
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const stage = STAGES.find((s) => s.id === value)
              return (
                <div className="w-80 rounded-xl border border-primary bg-card p-3 shadow-xl">
                  <span className="text-xs font-semibold text-foreground">
                    {stage?.label ?? String(value)}
                  </span>
                </div>
              )
            }

            const thread = threads.find((t) => t._id === value)
            if (!thread) return null

            return (
              <div className="w-72 rounded-lg border border-primary bg-card p-3 shadow-xl">
                <span className="text-xs font-semibold text-foreground">
                  {thread.creator?.name ?? 'Creator'}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ${(thread.requestedRate ?? thread.proposedFee).toLocaleString()}
                </p>
              </div>
            )
          }}
        </KanbanOverlay>
      </Kanban>

      {/* Quick Add Creator to Stage Dialog */}
      <Dialog open={isAddCreatorOpen} onOpenChange={setIsAddCreatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Add Deal to {STAGES.find((s) => s.id === targetAddStage)?.label}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a creator from your CRM to add a new deal directly into this stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="creator-select" className="text-xs font-medium">
                Creator
              </Label>
              <select
                id="creator-select"
                value={selectedCreatorId}
                onChange={(e) => setSelectedCreatorId(e.target.value as Id<'creators'>)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a creator from CRM...</option>
                {(allCreators ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.platform} • {(c.followers ?? 0).toLocaleString()} reach)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proposed-fee" className="text-xs font-medium">
                  Proposed Fee ($)
                </Label>
                <Input
                  id="proposed-fee"
                  type="number"
                  value={customProposedFee}
                  onChange={(e) => setCustomProposedFee(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stage-name" className="text-xs font-medium">
                  Target Stage
                </Label>
                <Input
                  id="stage-name"
                  disabled
                  value={STAGES.find((s) => s.id === targetAddStage)?.label}
                  className="h-8 text-xs bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deliverables" className="text-xs font-medium">
                Deliverables Scope
              </Label>
              <Input
                id="deliverables"
                value={customDeliverables}
                onChange={(e) => setCustomDeliverables(e.target.value)}
                className="h-8 text-xs"
                placeholder="e.g. 1 Dedicated Video + 1 Post"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddCreatorOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedCreatorId}
              onClick={handleCreateDealInStage}
              className="text-xs font-medium"
            >
              Add to {STAGES.find((s) => s.id === targetAddStage)?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

