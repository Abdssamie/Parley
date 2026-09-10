import React, { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Send,
  Sparkles,
  User,
  Bot,
  Mail,
  ExternalLink,
  Loader2,
  FileText,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Id } from '../../convex/_generated/dataModel'
import type { ThreadDetail, PipelineStage } from '../types'
import { renderTemplate } from '@/lib/template-engine'

interface ThreadDrawerProps {
  threadId: Id<'threads'> | null
  thread: ThreadDetail
  isOpen: boolean
  onClose: () => void
  onApproveCounter?: (threadId: Id<'threads'>) => Promise<void>
  onSubmitHumanMessage: (params: {
    threadId: Id<'threads'>
    subject: string
    body: string
    proposedFee?: number
    stage?: PipelineStage
  }) => Promise<void>
  onSimulateCreatorReply?: (params: {
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
  onSubmitHumanMessage,
}) => {
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const emailTemplates = useQuery(api.emailTemplates.list, {})
  const draftWithAgentAction = useAction(api.agent.draftEmailWithAgent)

  if (!thread || !threadId) return null

  const creator = thread.creator
  const campaign = thread.campaign
  const messages = thread.messages || []
  const budget = campaign?.budget ?? 2000
  const currentRate = thread.requestedRate ?? thread.proposedFee
  const isOverBudget = currentRate > budget

  const creatorInitials = (creator?.name ?? 'Creator')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const defaultSubject = `Re: Partnership Collaboration - ${campaign?.title ?? 'Campaign'}`

  const handleGenerateAiDraft = async (instruction: string) => {
    if (!instruction.trim()) return
    setIsGeneratingAi(true)
    try {
      const draft = await draftWithAgentAction({
        threadId,
        instruction: instruction.trim(),
      })
      if (draft.subject) {
        setEmailSubject(draft.subject)
      }
      if (draft.body) {
        setEmailBody(draft.body)
      }
      setAiPrompt('')
    } catch (err) {
      console.error('Failed to draft email with AI agent:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailBody.trim()) return

    setIsSending(true)
    try {
      let targetStage: PipelineStage | undefined = thread.stage
      if (thread.stage === 'discovered') {
        targetStage = 'pitched'
      } else if (thread.stage === 'review_required') {
        targetStage = 'negotiating'
      }

      await onSubmitHumanMessage({
        threadId,
        subject: emailSubject.trim() || defaultSubject,
        body: emailBody.trim(),
        proposedFee: thread.proposedFee,
        stage: targetStage,
      })

      setEmailBody('')
      setEmailSubject('')
    } catch (err) {
      console.error('Failed to send email:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 border-b border-border bg-card px-5 py-3">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-8 border border-border shrink-0">
                  <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="text-sm font-semibold text-foreground truncate leading-snug">
                    {creator?.name ?? 'Creator Negotiation'}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] text-muted-foreground truncate leading-tight">
                    {creator?.email} • {creator?.platform || 'Creator'} • {creator?.audienceNiche || 'General'}
                  </SheetDescription>
                </div>
              </div>

              {/* Status & Deal Amount Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    isOverBudget
                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-border bg-muted/60 text-foreground'
                  }`}
                >
                  ${currentRate.toLocaleString()}
                </Badge>
                <Badge
                  variant="outline"
                  className="capitalize text-[11px] font-medium border-border bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                >
                  {thread.stage.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Contract link pill if available */}
            {thread.contractLink && (
              <div className="flex items-center gap-2 pt-0.5">
                <a
                  href={thread.contractLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:underline"
                >
                  <ExternalLink className="size-3 text-muted-foreground" />
                  <span>Contract & Onboarding Agreement</span>
                </a>
              </div>
            )}
          </SheetHeader>
        </div>

        {/* Email Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Email Thread</span>
            <span>
              {messages.length} message{messages.length === 1 ? '' : 's'}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-border/80 rounded-xl space-y-2">
              <Mail className="size-6 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No email messages yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Write a message or use the AI agent below to draft and send your outreach email to {creator?.name ?? 'the creator'}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isFromCreator = msg.sender === 'creator'
                const isAgent = msg.sender === 'agent'

                return (
                  <div
                    key={msg._id}
                    className={`rounded-xl border p-4 space-y-2.5 shadow-xs transition-colors ${
                      isFromCreator
                        ? 'border-border bg-muted/40'
                        : 'border-border bg-card'
                    }`}
                  >
                    {/* Message Sender Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-foreground">
                          {isFromCreator ? (
                            <User className="size-3.5 text-muted-foreground" />
                          ) : isAgent ? (
                            <Bot className="size-3.5 text-foreground" />
                          ) : (
                            <User className="size-3.5 text-foreground" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {isFromCreator
                            ? creator?.name ?? 'Creator'
                            : isAgent
                            ? 'Parley Agent'
                            : 'You'}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          &lt;{msg.senderAddress}&gt;
                        </span>
                      </div>

                      <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                        {new Date(msg.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Subject Line */}
                    {msg.subject && (
                      <div className="text-xs font-semibold text-foreground">
                        {msg.subject}
                      </div>
                    )}

                    {/* Email Message Body */}
                    <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                      {msg.rawBody}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pending AI Draft Counter-Offer Banner (if thread was flagged with a draft) */}
          {thread.draftCounterOffer && !emailBody && (
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-foreground" />
                  <span>Draft Reply Prepared</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailBody(thread.draftCounterOffer || '')
                    setEmailSubject(defaultSubject)
                  }}
                  className="h-7 text-xs border-border text-foreground hover:bg-muted"
                >
                  Insert Draft into Editor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                "{thread.draftCounterOffer}"
              </p>
            </div>
          )}

          {/* Command AI Agent Area */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-foreground" />
              <span className="text-xs font-semibold text-foreground">Command AI Agent</span>
            </div>

            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiPrompt(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerateAiDraft(aiPrompt)
                  }
                }}
                placeholder="e.g. Counter at $2,000, ask for media kit, or request contract..."
                className="h-8 text-xs bg-background text-foreground"
                disabled={isGeneratingAi}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleGenerateAiDraft(aiPrompt)}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="h-8 text-xs font-medium shrink-0 gap-1.5 px-3"
              >
                {isGeneratingAi ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>Draft</span>
              </Button>
            </div>

            {/* Quick Command Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() =>
                  handleGenerateAiDraft(
                    `Counter-offer anchored to campaign budget cap of $${budget.toLocaleString()}`
                  )
                }
                disabled={isGeneratingAi}
                className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Counter at budget (${budget.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() =>
                  handleGenerateAiDraft('Request updated media kit and audience metrics')
                }
                disabled={isGeneratingAi}
                className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Request media kit
              </button>
              <button
                type="button"
                onClick={() =>
                  handleGenerateAiDraft('Accept terms and send onboarding agreement link')
                }
                disabled={isGeneratingAi}
                className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Accept & send contract
              </button>
              <button
                type="button"
                onClick={() =>
                  handleGenerateAiDraft('Politely follow up regarding our previous email')
                }
                disabled={isGeneratingAi}
                className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Follow up
              </button>
            </div>
          </div>

          {/* Email Composer */}
          <form onSubmit={handleSendEmail} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Mail className="size-3.5 text-muted-foreground" />
                <span>Write Email</span>
              </div>

              {/* Template Picker */}
              {emailTemplates && emailTemplates.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3 text-muted-foreground" />
                  <select
                    aria-label="Insert template"
                    defaultValue=""
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selected = emailTemplates.find((t) => t._id === e.target.value)
                      if (selected) {
                        const context = {
                          creator: creator ? { ...creator, estCost: currentRate } : null,
                          campaign,
                          sender: { name: 'Partnerships Team', email: 'team@parley.app' },
                          brandName: 'Parley',
                        }
                        setEmailSubject(renderTemplate(selected.subject, context))
                        setEmailBody(renderTemplate(selected.body, context))
                      }
                      e.target.value = ''
                    }}
                    className="h-7 text-[11px] rounded-md border border-border bg-background px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <option value="" disabled>
                      Insert from template...
                    </option>
                    {emailTemplates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                value={emailSubject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
                placeholder={defaultSubject}
                className="h-8 text-xs bg-background text-foreground"
              />

              <Textarea
                value={emailBody}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
                placeholder={`Write your email to ${creator?.name ?? 'the creator'}...`}
                rows={5}
                className="text-xs leading-relaxed bg-background font-sans text-foreground"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Recipient: &lt;{creator?.email}&gt;
              </span>

              <div className="flex items-center gap-2">
                {emailBody.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmailBody('')
                      setEmailSubject('')
                    }}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending || !emailBody.trim()}
                  className="h-8 text-xs font-semibold gap-1.5 px-3.5"
                >
                  {isSending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>Send Email</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
