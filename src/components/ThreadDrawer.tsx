import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Bot,
  User,
  Send,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  Edit3,
  FileText,
  ExternalLink,
  XCircle,
  Check,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Id } from '../../convex/_generated/dataModel'
import type { ThreadDetail, PipelineStage } from '../types'
import { renderTemplate } from '@/lib/template-engine'
import { VariablePicker } from './templates/VariablePicker'

interface ThreadDrawerProps {
  threadId: Id<'threads'> | null
  thread: ThreadDetail
  isOpen: boolean
  onClose: () => void
  onApproveCounter: (threadId: Id<'threads'>) => Promise<void>
  onSubmitHumanMessage: (params: {
    threadId: Id<'threads'>
    subject: string
    body: string
    proposedFee?: number
    stage?: PipelineStage
  }) => Promise<void>
  onSimulateCreatorReply: (params: {
    threadId: Id<'threads'>
    incomingBody: string
  }) => Promise<void>
  onWalkAway?: (threadId: Id<'threads'>) => Promise<void>
}

export const ThreadDrawer: React.FC<ThreadDrawerProps> = ({
  threadId,
  thread,
  isOpen,
  onClose,
  onApproveCounter,
  onSubmitHumanMessage,
  onSimulateCreatorReply,
  onWalkAway,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'override'>('messages')
  const [manualSubject, setManualSubject] = useState('')
  const [manualBody, setManualBody] = useState('')
  const [manualFee, setManualFee] = useState<number | undefined>(undefined)
  const [manualStage, setManualStage] = useState<PipelineStage | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailTemplates = useQuery(api.emailTemplates.list, {})

  if (!thread || !threadId) return null

  const creator = thread.creator
  const campaign = thread.campaign
  const messages = thread.messages || []
  const budget = campaign?.budget ?? 2000
  const reqRate = thread.requestedRate ?? thread.proposedFee
  const delta = reqRate - budget
  const pct = Math.round((delta / budget) * 100)
  const isOverBudget = reqRate > budget

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApproveCounter(threadId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWalkAway = async () => {
    if (!onWalkAway) return
    setIsSubmitting(true)
    try {
      await onWalkAway(threadId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualBody.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmitHumanMessage({
        threadId,
        subject: manualSubject || `Re: Partnership Collaboration - ${campaign?.title ?? 'Campaign'}`,
        body: manualBody,
        proposedFee: manualFee,
        stage: manualStage,
      })
      setManualBody('')
      setActiveTab('messages')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSimulate = async (incomingBody: string) => {
    setIsSubmitting(true)
    try {
      await onSimulateCreatorReply({
        threadId,
        incomingBody,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine State Machine Step Progress
  const isPitched = Boolean(messages.length > 0 || thread.stage !== 'discovered')
  const hasInbound = messages.some((m) => m.sender === 'creator')
  const hasExtractedIntent = Boolean(thread.ruleTriggered || thread.requestedRate !== undefined)
  const isReviewGate = thread.stage === 'review_required' || thread.pendingApproval
  const isAccepted = thread.stage === 'accepted'
  const isDeclined = thread.stage === 'declined' || thread.stage === 'ghosted'

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 border-b border-border bg-card p-5 space-y-4">
          <SheetHeader className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="capitalize text-xs font-semibold border-border bg-muted/60 text-foreground"
                >
                  Stage: {thread.stage.replace('_', ' ')}
                </Badge>
                {thread.ruleTriggered && (
                  <Badge variant="secondary" className="text-[10px] font-medium uppercase px-1.5 h-5">
                    {thread.ruleTriggered === 'rule_a' && 'Rule A (Green Light)'}
                    {thread.ruleTriggered === 'rule_b' && 'Rule B (Counter <=125%)'}
                    {thread.ruleTriggered === 'rule_c' && 'Rule C (Hard Block)'}
                    {thread.ruleTriggered === 'rule_d' && 'Rule D (Declined)'}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                Thread: {thread.agentMailThreadId}
              </span>
            </div>

            <SheetTitle className="text-xl font-bold text-foreground flex items-center justify-between">
              <span>{creator?.name ?? 'Creator Negotiation'}</span>
              <span className="text-lg font-semibold text-foreground">
                ${reqRate.toLocaleString()}
              </span>
            </SheetTitle>

            <SheetDescription className="text-xs text-muted-foreground">
              {creator?.email} • Niche: {creator?.audienceNiche} • Platform: {creator?.platform}
            </SheetDescription>
          </SheetHeader>

          {/* State Machine Stepper */}
          <div className="rounded-lg bg-muted/40 p-2.5 border border-border/70">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1.5 px-1">
              <span>Deterministic Pipeline State Machine</span>
              <span className="font-mono text-[10px]">OpenAI + AgentMail</span>
            </div>

            <div className="grid grid-cols-5 gap-1 text-[10px]">
              <div
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-center font-medium ${
                  isPitched ? 'bg-secondary text-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {isPitched && <Check className="h-2.5 w-2.5" />}
                <span>1. Pitched</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-center font-medium ${
                  hasInbound ? 'bg-secondary text-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {hasInbound && <Check className="h-2.5 w-2.5" />}
                <span>2. Reply</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-center font-medium ${
                  hasExtractedIntent ? 'bg-secondary text-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {hasExtractedIntent && <Check className="h-2.5 w-2.5" />}
                <span>3. Parsed</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-center font-medium ${
                  isReviewGate
                    ? 'bg-primary/20 text-foreground border border-border'
                    : hasExtractedIntent
                    ? 'bg-secondary text-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <span>4. Rules</span>
              </div>

              <div
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-center font-medium ${
                  isAccepted
                    ? 'bg-secondary text-foreground font-semibold'
                    : isDeclined
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <span>5. {isAccepted ? 'Closed' : isDeclined ? 'Declined' : 'Decision'}</span>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'messages'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversation Thread ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('override')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'override'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Manual Human Override
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-5 space-y-4">
          {activeTab === 'messages' ? (
            <div className="space-y-4">
              {/* Structured Parsing & Constraint Evaluation Inspector Card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-foreground">
                      Structured Intent & Constraint Evaluation
                    </h4>
                  </div>
                  {thread.sentimentScore !== undefined && (
                    <Badge variant="outline" className="text-[10px] border-border text-foreground">
                      Sentiment: {thread.sentimentScore}/10
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
                    <span className="text-[10px] text-muted-foreground uppercase block">Intent</span>
                    <span className="font-semibold text-foreground capitalize">
                      {messages.find((m) => m.sender === 'creator')?.extractedIntent?.replace(/_/g, ' ') ||
                        'Inbound Discussion'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
                    <span className="text-[10px] text-muted-foreground uppercase block">Rate vs Cap</span>
                    <span className="font-semibold text-foreground">
                      ${reqRate.toLocaleString()}{' '}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({isOverBudget ? `+${pct}%` : `cap: $${budget}`})
                      </span>
                    </span>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
                    <span className="text-[10px] text-muted-foreground uppercase block">Rule Triggered</span>
                    <span className="font-semibold text-foreground">
                      {thread.ruleTriggered ? thread.ruleTriggered.toUpperCase() : 'Standard Flow'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
                    <span className="text-[10px] text-muted-foreground uppercase block">Timeline</span>
                    <span className="font-semibold text-foreground truncate block">
                      {thread.timelineConstraint || 'Q4 Target'}
                    </span>
                  </div>
                </div>

                {thread.reasoning && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-muted/20 p-2 rounded-md border border-border/40">
                    "{thread.reasoning}"
                  </p>
                )}

                {thread.contractLink && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2 border border-border">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Contract & Onboarding Active</span>
                    </div>
                    <a
                      href={thread.contractLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-foreground inline-flex items-center hover:underline"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              {/* Human Approval Gate (Rule C Hard Block or HITL Active) */}
              {(thread.pendingApproval || thread.stage === 'review_required') && thread.draftCounterOffer && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-foreground" />
                      <span>Human Approval Gate — Action Required</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      Pending Operator
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Creator requested ${reqRate.toLocaleString()} (Campaign budget: ${budget.toLocaleString()}).
                    OpenAI generated the following counter-offer:
                  </p>

                  <div className="rounded-lg bg-card p-3 text-xs text-foreground shadow-xs border border-border">
                    <p className="italic leading-relaxed whitespace-pre-line">{thread.draftCounterOffer}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="text-xs font-semibold gap-1.5 h-8"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve & Dispatch via AgentMail
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualBody(thread.draftCounterOffer || '')
                        setManualFee(budget)
                        setActiveTab('override')
                      }}
                      className="text-xs h-8 border-border text-foreground hover:bg-muted"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      Edit Offer
                    </Button>

                    {onWalkAway && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleWalkAway}
                        disabled={isSubmitting}
                        className="text-xs h-8 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        Walk Away
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Timeline */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                  <span className="font-semibold text-foreground">Message History</span>
                  <span>{messages.length} email{messages.length === 1 ? '' : 's'} recorded</span>
                </div>

                {messages.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No messages recorded yet in this thread.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAgent = msg.sender === 'agent'
                    const isHuman = msg.sender === 'human_reviewer'

                    return (
                      <div
                        key={msg._id}
                        className={`rounded-xl border p-3.5 shadow-xs transition-all ${
                          isAgent
                            ? 'border-border bg-muted/30 ml-4'
                            : isHuman
                            ? 'border-border bg-secondary/40 ml-4'
                            : 'border-border bg-card mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-foreground text-xs">
                              {isAgent ? (
                                <Bot className="h-3.5 w-3.5" />
                              ) : isHuman ? (
                                <User className="h-3.5 w-3.5" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                              {isAgent
                                ? 'Parley Agent'
                                : isHuman
                                ? 'Human Reviewer'
                                : creator?.name ?? 'Creator'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              &lt;{msg.senderAddress}&gt;
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {msg.extractedIntent && (
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-muted-foreground border-border">
                                {msg.extractedIntent.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-medium text-foreground mb-1">
                          {msg.subject}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                          {msg.rawBody}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Interactive Testing Sandbox (Deterministic State Machine Scenarios) */}
              <div className="mt-6 rounded-xl border border-dashed border-border bg-card/60 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>State Machine Testing Sandbox (Judge / Demo Controls)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Test deterministic rules engine branching by simulating creator replies:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Scenario 1: Rule A */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Sounds great! $1,800 works for us. Please send over the onboarding agreement and contract link to lock it in.`
                      )
                    }
                    className="h-auto py-2 px-2.5 text-left flex flex-col items-start border-border bg-card hover:bg-muted text-foreground"
                  >
                    <span className="text-[11px] font-semibold">Rule A (Green Light: $1,800)</span>
                    <span className="text-[9px] text-muted-foreground">Rate &lt;= Budget $\to$ Stage: Accepted + Contract Link</span>
                  </Button>

                  {/* Scenario 2: Rule B */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Thanks for the pitch! We can definitely do this tutorial video for $2,250. Let me know if that works.`
                      )
                    }
                    className="h-auto py-2 px-2.5 text-left flex flex-col items-start border-border bg-card hover:bg-muted text-foreground"
                  >
                    <span className="text-[11px] font-semibold">Rule B (Counter: $2,250)</span>
                    <span className="text-[9px] text-muted-foreground">Rate &lt;= 125% $\to$ Auto-Drafts Counter Anchored to Cap</span>
                  </Button>

                  {/* Scenario 3: Rule C */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Hi Parley team, our standard media kit rate for this tier is $3,200 firm. We cannot accommodate lower quotes.`
                      )
                    }
                    className="h-auto py-2 px-2.5 text-left flex flex-col items-start border-border bg-card hover:bg-muted text-foreground"
                  >
                    <span className="text-[11px] font-semibold">Rule C (Hard Block: $3,200)</span>
                    <span className="text-[9px] text-muted-foreground">Rate &gt; 125% $\to$ Stage: Review Required (Approval Gate)</span>
                  </Button>

                  {/* Scenario 4: Rule D */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Thanks for thinking of me, but our production schedule is completely booked through Q4 so I must decline.`
                      )
                    }
                    className="h-auto py-2 px-2.5 text-left flex flex-col items-start border-border bg-card hover:bg-muted text-foreground"
                  >
                    <span className="text-[11px] font-semibold">Rule D (Creator Declines)</span>
                    <span className="text-[9px] text-muted-foreground">Decline intent $\to$ Stage: Declined</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Manual Human Override Form */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/60 p-3 text-xs text-foreground border border-border">
                <p className="font-semibold mb-0.5">Human-in-the-Loop Override</p>
                <p className="text-[11px] text-muted-foreground">
                  Sending a manual message dispatches the email via AgentMail and flags the thread as human-supervised.
                </p>
              </div>

              {/* Template Pre-population Toolbar */}
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Email Template:</span>
                </div>
                <select
                  aria-label="Select an email template to populate fields"
                  defaultValue=""
                  onChange={(e) => {
                    const selected = emailTemplates?.find((t) => t._id === e.target.value)
                    if (selected) {
                      const context = {
                        creator: creator ? { ...creator, estCost: manualFee ?? reqRate } : null,
                        campaign,
                        sender: { name: 'Partnerships Team', email: 'team@parley.app' },
                        brandName: 'Parley',
                      }
                      setManualSubject(renderTemplate(selected.subject, context))
                      setManualBody(renderTemplate(selected.body, context))
                    }
                  }}
                  className="h-8 text-xs rounded-md border border-input bg-background px-2.5 max-w-[220px] truncate cursor-pointer text-foreground"
                >
                  <option value="" disabled>Load from template...</option>
                  {(emailTemplates || []).map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold">Subject</Label>
                <Input
                  id="subject"
                  value={manualSubject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualSubject(e.target.value)}
                  placeholder={`Re: Partnership Collaboration - ${campaign?.title}`}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body" className="text-xs font-semibold">Email Body</Label>
                  <VariablePicker
                    onSelectVariable={(v) => {
                      setManualBody((prev) => prev + v.tag)
                    }}
                    label="Insert Dynamic Field"
                    size="sm"
                  />
                </div>
                <Textarea
                  id="body"
                  value={manualBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setManualBody(e.target.value)}
                  rows={6}
                  placeholder="Type your custom email reply to the creator..."
                  className="text-xs leading-relaxed font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fee" className="text-xs font-semibold">Proposed Fee ($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={manualFee ?? reqRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setManualFee(e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stage" className="text-xs font-semibold">Stage Override</Label>
                  <select
                    id="stage"
                    value={manualStage ?? thread.stage}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setManualStage(e.target.value as PipelineStage)
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground"
                  >
                    <option value="discovered">Discovered</option>
                    <option value="pitched">Pitched</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="review_required">Review Required</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="ghosted">Ghosted</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('messages')}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !manualBody.trim()}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Manual Email
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
