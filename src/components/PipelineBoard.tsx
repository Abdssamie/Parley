import React, { useState } from 'react'
import {
  Search,
  Send,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Plus,
} from 'lucide-react'
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanCommitMeta,
} from '@/components/ui/kanban'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  onApproveCounter: _onApproveCounter,
}) => {
  // 1. Kanban Columns State (synced during render without useEffect)
  const [prevThreads, setPrevThreads] = useState(threads)
  const [columns, setColumns] = useState(() => buildColumns(threads))

  if (prevThreads !== threads) {
    setPrevThreads(threads)
    setColumns(buildColumns(threads))
  }

  // 2. Quick Add Creator to Stage State
  const [isAddCreatorOpen, setIsAddCreatorOpen] = useState(false)
  const [targetAddStage, setTargetAddStage] = useState<PipelineStage>('discovered')
  const [selectedCreatorId, setSelectedCreatorId] = useState<Id<'creators'> | ''>('')
  const [customProposedFee, setCustomProposedFee] = useState<number>(campaignBudget)
  const [customDeliverables, setCustomDeliverables] = useState<string>('1 Dedicated Integration')

  // 3. Convex Mutations
  const updateStageMutation = useMutation(api.threads.updateStage)
  const createThreadInStageMutation = useMutation(api.threads.createThreadInStage)
  const allCreators = useQuery(api.creators.list, {})

  // 4. Drag and Drop Commit Handler
  const handleValueCommit = (
    _nextValue: Record<string, EnrichedThread[]>,
    meta: KanbanCommitMeta<EnrichedThread>
  ) => {
    if (meta.kind === 'column') {
      return
    }

    const threadId = String(meta.event.active.id) as Id<'threads'>
    const targetStage = meta.overContainer as PipelineStage

    void updateStageMutation({
      id: threadId,
      stage: targetStage,
    }).catch((err: unknown) => {
      console.error('Failed to update stage:', err)
      setColumns(meta.previousValue)
    })
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

  return (
    <div className="space-y-3">
      {/* Main Kanban Board */}
      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item._id}
        onValueCommit={handleValueCommit}
      >
        <KanbanBoard className="flex gap-3.5 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)] snap-x">
          {STAGES.map((stage) => {
            const stageItems = columns[stage.id] ?? []
            const StageIcon = stage.icon

            return (
              <KanbanColumn
                key={stage.id}
                value={stage.id}
                className="w-72 shrink-0 rounded-xl border border-border bg-card p-3 shadow-xs snap-start flex flex-col"
              >
                {/* Column Header — Inside the column card, not a card itself */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <StageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                      {stage.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {stageItems.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleOpenAddCreator(stage.id, e)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title={`Add creator directly to ${stage.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Cards Container */}
                <KanbanColumnContent value={stage.id} className="space-y-2.5 min-h-[140px]">
                  {stageItems.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-6 px-3 text-center text-xs text-muted-foreground hover:border-foreground/20 cursor-pointer transition-colors"
                      onClick={(e) => handleOpenAddCreator(stage.id, e)}
                    >
                      <span className="text-xs font-medium text-muted-foreground">No deals</span>
                      <span className="text-[11px] text-muted-foreground/60 mt-0.5">Click to add</span>
                    </div>
                  ) : (
                    stageItems.map((thread) => {
                      const creator = thread.creator
                      const initials = (creator?.name ?? 'Creator')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()

                      const dealAmount = thread.requestedRate ?? thread.proposedFee ?? creator?.estCost ?? 0
                      const formattedAmount = `$${dealAmount.toLocaleString()}`
                      const isOverBudget = campaignBudget ? dealAmount > campaignBudget : false
                      const formattedDate = new Date(thread.lastActivityAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })

                      return (
                        <KanbanItem
                          key={thread._id}
                          value={thread._id}
                        >
                          <KanbanItemHandle cursor={false} className="w-full">
                            <div
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                onSelectThread(thread._id)
                              }}
                              className="cursor-pointer rounded-xl border border-border/80 bg-background hover:border-foreground/30 hover:bg-muted/10 transition-all duration-150 shadow-xs p-3.5 space-y-3"
                            >
                              {/* Top row: Name & Deal Amount */}
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground truncate">
                                  {creator?.name ?? 'Unknown Creator'}
                                </h3>
                                <span
                                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md leading-none border ${
                                    isOverBudget
                                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                      : 'border-border bg-muted/60 text-foreground'
                                  }`}
                                  title={isOverBudget ? `Exceeds target budget ($${campaignBudget.toLocaleString()})` : 'Deal Rate'}
                                >
                                  {formattedAmount}
                                </span>
                              </div>

                              {/* Bottom row: Avatar + Niche & Date */}
                              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="size-6 border border-border shrink-0">
                                    <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-xs">
                                    {creator?.audienceNiche || creator?.email || 'General'}
                                  </span>
                                </div>

                                <span className="shrink-0 text-xs">
                                  {formattedDate}
                                </span>
                              </div>
                            </div>
                          </KanbanItemHandle>
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
                <div className="w-72 rounded-xl border border-primary bg-card p-3 shadow-xl">
                  <span className="text-xs font-semibold text-foreground">
                    {stage?.label ?? String(value)}
                  </span>
                </div>
              )
            }

            const thread = threads.find((t) => t._id === value)
            if (!thread) return null
            const creator = thread.creator
            const initials = (creator?.name ?? 'Creator')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
            const dealAmount = thread.requestedRate ?? thread.proposedFee ?? creator?.estCost ?? 0
            const formattedAmount = `$${dealAmount.toLocaleString()}`
            const isOverBudget = campaignBudget ? dealAmount > campaignBudget : false
            const formattedDate = new Date(thread.lastActivityAt || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <div className="w-72 rounded-xl border border-primary bg-background p-3.5 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {creator?.name ?? 'Unknown Creator'}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md leading-none border ${
                      isOverBudget
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-border bg-muted/60 text-foreground'
                    }`}
                  >
                    {formattedAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="size-6 border border-border shrink-0">
                      <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs">
                      {creator?.audienceNiche || creator?.email || 'General'}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs">
                    {formattedDate}
                  </span>
                </div>
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

