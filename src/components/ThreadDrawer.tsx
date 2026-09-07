import React, { useState } from 'react'
import {
  Bot,
  User,
  Send,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  Edit3,
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
}

export const ThreadDrawer: React.FC<ThreadDrawerProps> = ({
  threadId,
  thread,
  isOpen,
  onClose,
  onApproveCounter,
  onSubmitHumanMessage,
  onSimulateCreatorReply,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'override'>('messages')
  const [manualSubject, setManualSubject] = useState('')
  const [manualBody, setManualBody] = useState('')
  const [manualFee, setManualFee] = useState<number | undefined>(undefined)
  const [manualStage, setManualStage] = useState<PipelineStage | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!thread || !threadId) return null

  const creator = thread.creator
  const campaign = thread.campaign
  const messages = thread.messages || []
  const budgetCap = campaign?.budgetCap ?? 2000

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApproveCounter(threadId)
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

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300">
                Stage: {thread.stage}
              </Badge>
              <span className="text-xs text-slate-400">
                Thread ID: {thread.agentMailThreadId}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{creator?.name ?? 'Creator Negotiation'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                ${thread.proposedFee.toLocaleString()}
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
              {creator?.contactEmail} • Niche: {creator?.audienceNiche}
            </SheetDescription>
          </SheetHeader>

          {/* Quick Intelligence Summary */}
          {creator?.scrapedSummary && (
            <div className="mt-3 rounded-lg bg-slate-100/80 p-2.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
                <Sparkles className="h-3 w-3 text-orange-500" />
                <span>Firecrawl Scraped Intelligence</span>
              </div>
              <p className="line-clamp-2 text-[11px] leading-relaxed">{creator.scrapedSummary}</p>
              {creator.pastSponsors && creator.pastSponsors.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
                  <span>Verified Sponsors:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {creator.pastSponsors.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Convex AI Agent Component Thread Badge */}
          {thread.agentComponentThreadId && (
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-indigo-50/80 px-2.5 py-1.5 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60">
              <div className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-[11px]">Convex AI Agent Thread:</span>
              </div>
              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[180px]">
                {thread.agentComponentThreadId}
              </span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="mt-4 flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'messages'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Email Thread ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('override')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'override'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Manual Human Override
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-6 space-y-4">
          {activeTab === 'messages' ? (
            <div className="space-y-4">
              {/* Human Approval Required Action Box */}
              {thread.pendingApproval && thread.draftCounterOffer && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4 text-red-600 animate-pulse" />
                    <span>Autonomous Counter-Offer Requires Human Approval</span>
                  </div>
                  <p className="mt-1.5 text-xs text-red-900/80 dark:text-red-200 leading-relaxed">
                    Creator requested ${thread.proposedFee.toLocaleString()} (Campaign budget cap: ${budgetCap.toLocaleString()}).
                    OpenAI generated the following counter-offer:
                  </p>
                  <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-800 shadow-sm border border-red-200 dark:bg-slate-900 dark:text-slate-200 dark:border-red-950">
                    <p className="italic">{thread.draftCounterOffer}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold gap-1.5 h-8"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve & Dispatch via AgentMail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualBody(thread.draftCounterOffer || '')
                        setManualFee(budgetCap)
                        setActiveTab('override')
                      }}
                      className="text-xs h-8"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Edit Offer
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages Timeline */}
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No messages recorded yet in this thread.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAgent = msg.sender === 'agent'
                    const isHuman = msg.sender === 'human_reviewer'

                    return (
                      <div
                        key={msg._id}
                        className={`rounded-xl border p-4 shadow-sm transition-all ${
                          isAgent
                            ? 'border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 ml-4'
                            : isHuman
                            ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 ml-4'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs ${
                                isAgent
                                  ? 'bg-indigo-600'
                                  : isHuman
                                  ? 'bg-emerald-600'
                                  : 'bg-slate-700'
                              }`}
                            >
                              {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {isAgent
                                ? 'Parley Bot'
                                : isHuman
                                ? 'Human Reviewer'
                                : creator?.name ?? 'Creator'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              &lt;{msg.senderAddress}&gt;
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {msg.extractedIntent && (
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-slate-500">
                                {msg.extractedIntent.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {msg.subject}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {msg.rawBody}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Simulation Sandbox for Hackathon Judges */}
              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-100/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Interactive Testing Sandbox (Judge / Demo Controls)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Click a simulated creator email below to observe real-time OpenAI fee extraction, budget policy enforcement, and autonomous response drafting:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Hi Parley team! Thanks for the pitch. For 1 dedicated YouTube video and promotion, our quote is $2,750. Let me know if this works.`
                      )
                    }
                    className="h-auto py-2 text-left flex flex-col items-start border-amber-300 bg-white hover:bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-slate-900 dark:text-amber-300"
                  >
                    <span className="text-[11px] font-bold">Counter: $2,750</span>
                    <span className="text-[9px] text-slate-500">Exceeds Cap $\rightarrow$ Flags for Review</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Hey! That sounds like a great partnership. We can do $1,800 for the video and social thread. Send over the agreement and we will lock it in!`
                      )
                    }
                    className="h-auto py-2 text-left flex flex-col items-start border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300"
                  >
                    <span className="text-[11px] font-bold">Accept: $1,800</span>
                    <span className="text-[9px] text-slate-500">Within Cap $\rightarrow$ Auto-Accepted</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleSimulate(
                        `Thanks for considering me, but I am fully booked through the next quarter and will have to pass. Best of luck with the campaign!`
                      )
                    }
                    className="h-auto py-2 text-left flex flex-col items-start border-red-300 bg-white hover:bg-red-50 text-red-900 dark:border-red-900 dark:bg-slate-900 dark:text-red-300"
                  >
                    <span className="text-[11px] font-bold">Decline Opportunity</span>
                    <span className="text-[9px] text-slate-500">Polite Decline $\rightarrow$ Stage: Declined</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Manual Override Tab */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="rounded-lg bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900">
                <p className="font-semibold mb-0.5">Human-in-the-Loop Control</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Sending a manual message dispatches the email via AgentMail and flags the thread as human-supervised.
                </p>
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
                <Label htmlFor="body" className="text-xs font-semibold">Email Body</Label>
                <Textarea
                  id="body"
                  value={manualBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setManualBody(e.target.value)}
                  rows={6}
                  placeholder="Type your custom email reply to the creator..."
                  className="text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fee" className="text-xs font-semibold">Proposed Fee ($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={manualFee ?? thread.proposedFee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualFee(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stage" className="text-xs font-semibold">Stage Override</Label>
                  <select
                    id="stage"
                    value={manualStage ?? thread.stage}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setManualStage(e.target.value as PipelineStage)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="discovered">Discovered</option>
                    <option value="pitched">Pitched</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
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
                  className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold gap-1.5"
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
