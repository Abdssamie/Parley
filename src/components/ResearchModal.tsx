import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id, Doc } from '../../convex/_generated/dataModel'
import { Globe, Sparkles, Loader2, CheckCircle2, Search, User, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ResearchModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: Id<'campaigns'> | null
  onScrapeLeads: (campaignId: Id<'campaigns'>, maxLeads: number) => Promise<{ found: number; skipped: number; leads: Array<{ name: string; url: string; fitScore: number }> }>
  onScrapeUrl: (campaignId: Id<'campaigns'>, creatorUrl: string) => Promise<{ name: string; url: string; fitScore: number }>
}

type Mode = 'auto' | 'manual'
type Step = 'idle' | 'searching' | 'profiling' | 'saving' | 'complete'

const MAX_OPTIONS = [3, 5, 10, 20]

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  campaignId: defaultCampaignId,
  onScrapeLeads,
  onScrapeUrl,
}) => {
  const campaigns = useQuery(api.campaigns.list, {}) ?? []

  const [mode, setMode] = useState<Mode>('auto')
  const [selectedCampaignId, setSelectedCampaignId] = useState<Id<'campaigns'> | null>(null)
  const [creatorUrl, setCreatorUrl] = useState('')
  const [maxLeads, setMaxLeads] = useState(5)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [result, setResult] = useState<{ count: number; leads: Array<{ name: string; url: string; fitScore: number }> } | null>(null)

  // Resolved campaign: prefer modal picker, fall back to caller-provided default
  const activeCampaignId = selectedCampaignId ?? defaultCampaignId
  const activeCampaign: Doc<'campaigns'> | undefined = campaigns.find((c) => c._id === activeCampaignId)

  const resetState = () => {
    setStep('idle')
    setCreatorUrl('')
    setResult(null)
  }

  const handleClose = () => {
    if (!loading) { onClose(); resetState() }
  }

  const handleAutoScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCampaignId) return

    setLoading(true)
    setStep('searching')

    try {
      setTimeout(() => setStep('profiling'), 1500)
      setTimeout(() => setStep('saving'), 3000)
      const res = await onScrapeLeads(activeCampaignId, maxLeads)
      setStep('complete')
      setResult({ count: res.found, leads: res.leads })
    } catch (err) {
      console.error(err)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleManualScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatorUrl.trim() || !activeCampaignId) return

    setLoading(true)
    setStep('profiling')

    try {
      setTimeout(() => setStep('saving'), 1200)
      const res = await onScrapeUrl(activeCampaignId, creatorUrl)
      setStep('complete')
      setResult({ count: 1, leads: [res] })
    } catch (err) {
      console.error(err)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  const autoSteps: { key: Step; label: string }[] = [
    { key: 'searching', label: 'Searching the web for matching creators…' },
    { key: 'profiling', label: 'Reading profiles and evaluating brand fit…' },
    { key: 'saving',    label: 'Saving leads to your Creator CRM…' },
  ]
  const manualSteps: { key: Step; label: string }[] = [
    { key: 'profiling', label: 'Reading creator profile…' },
    { key: 'saving',    label: 'Saving lead to your Creator CRM…' },
  ]
  const activeSteps = mode === 'auto' ? autoSteps : manualSteps
  const currentStepIndex = activeSteps.findIndex((s) => s.key === step)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Find Leads</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Discover and save creators to your CRM. No outreach is sent — you review and pitch separately.
          </DialogDescription>
        </DialogHeader>

        {/* Campaign picker */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Target className="size-3.5 text-muted-foreground" />
            Campaign
          </Label>
          {campaigns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No campaigns yet. Create one first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {campaigns.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedCampaignId(c._id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    c._id === activeCampaignId
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
          {activeCampaign && (
            <p className="text-[11px] text-muted-foreground pt-0.5">
              Niche: <span className="font-medium text-foreground">{activeCampaign.targetNiche}</span>
            </p>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('auto'); resetState() }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
              mode === 'auto'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="size-3.5" />
            Auto Scrape
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); resetState() }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${
              mode === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="size-3.5" />
            Add by URL
          </button>
        </div>

        {/* Auto scrape form */}
        {mode === 'auto' && (
          <form onSubmit={handleAutoScrape} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Max leads to find</Label>
              <div className="flex gap-2">
                {MAX_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={loading}
                    onClick={() => setMaxLeads(n)}
                    className={`flex-1 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                      maxLeads === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Agent will search the web using your campaign's niche and scrape up to {maxLeads} matching creator profiles.
              </p>
            </div>

            {loading && <ProgressBlock steps={autoSteps} currentIndex={currentStepIndex} />}
            {step === 'complete' && result && (
              <SuccessBlock leads={result.leads} />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading} className="text-xs">
                {step === 'complete' ? 'Close' : 'Cancel'}
              </Button>
              {step !== 'complete' && (
                <Button type="submit" size="sm" disabled={loading || !activeCampaignId} className="text-xs font-semibold gap-1.5">
                  {loading
                    ? <><Loader2 className="size-3.5 animate-spin" /> Scraping…</>
                    : <><Sparkles className="size-3.5" /> Scrape Leads</>
                  }
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Manual URL form */}
        {mode === 'manual' && (
          <form onSubmit={handleManualScrape} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="creatorUrl" className="text-xs font-semibold">Creator Profile URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="creatorUrl"
                  value={creatorUrl}
                  onChange={(e) => setCreatorUrl(e.target.value)}
                  placeholder="https://karandev.io/sponsorships"
                  disabled={loading}
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste any creator's website, media kit, or social profile. The agent will read it and extract their info.
              </p>
            </div>

            {loading && <ProgressBlock steps={manualSteps} currentIndex={currentStepIndex} />}
            {step === 'complete' && result && result.leads[0] && (
              <SuccessBlock leads={result.leads} />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading} className="text-xs">
                {step === 'complete' ? 'Close' : 'Cancel'}
              </Button>
              {step !== 'complete' && (
                <Button type="submit" size="sm" disabled={loading || !creatorUrl.trim() || !activeCampaignId} className="text-xs font-semibold gap-1.5">
                  {loading
                    ? <><Loader2 className="size-3.5 animate-spin" /> Reading…</>
                    : <><User className="size-3.5" /> Add Creator</>
                  }
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProgressBlock({
  steps,
  currentIndex,
}: {
  steps: { key: string; label: string }[]
  currentIndex: number
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Loader2 className="size-3.5 animate-spin text-primary" />
        <span>Agent working…</span>
      </div>
      <ul className="space-y-2 pl-1">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={`flex items-center gap-2 text-[11px] transition-colors ${
              i < currentIndex
                ? 'text-muted-foreground'
                : i === currentIndex
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground/40'
            }`}
          >
            {i < currentIndex ? (
              <CheckCircle2 className="size-3 shrink-0 text-primary" />
            ) : (
              <span className={`size-3 shrink-0 rounded-full border ${i === currentIndex ? 'border-primary bg-primary/20' : 'border-border'}`} />
            )}
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SuccessBlock({ leads }: { leads: Array<{ name: string; fitScore: number }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <CheckCircle2 className="size-4 text-primary shrink-0" />
        <span>{leads.length} lead{leads.length !== 1 ? 's' : ''} saved to Creator CRM</span>
      </div>
      {leads.length > 0 && (
        <ul className="space-y-1 pl-1">
          {leads.slice(0, 5).map((l, i) => (
            <li key={i} className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{l.name}</span>
              <span className="text-[10px] border border-border bg-muted rounded-md px-1.5 py-0.5">
                Fit {l.fitScore}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
