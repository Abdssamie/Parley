import React, { useState } from 'react'
import { Globe, Sparkles, Loader2, Bot, CheckCircle2 } from 'lucide-react'
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
import type { Id } from '../../convex/_generated/dataModel'

interface ResearchModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: Id<'campaigns'> | null
  onLaunchResearch: (creatorUrl: string) => Promise<void>
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  onLaunchResearch,
}) => {
  const [creatorUrl, setCreatorUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'idle' | 'scraping' | 'analyzing' | 'pitching' | 'complete'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatorUrl.trim() || !campaignId) return

    setLoading(true)
    setStep('scraping')

    try {
      setTimeout(() => setStep('analyzing'), 900)
      setTimeout(() => setStep('pitching'), 1800)

      await onLaunchResearch(creatorUrl)
      setStep('complete')
      setTimeout(() => {
        onClose()
        setStep('idle')
        setCreatorUrl('')
      }, 1200)
    } catch (err) {
      console.error(err)
      setStep('idle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400">
            <Bot className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider">Autonomous Agent Loop</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Research & Pitch New Creator
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Paste a creator’s Linktree, media kit, or portfolio URL. Firecrawl will extract their profile, OpenAI will evaluate brand fit, and AgentMail will dispatch the customized initial pitch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="creatorUrl" className="text-xs font-semibold">
              Creator Linktree / Portfolio URL
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="creatorUrl"
                value={creatorUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreatorUrl(e.target.value)}
                placeholder="https://creator.link/media-kit or https://karandev.io"
                disabled={loading}
                className="pl-9 text-xs h-9"
                required
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Quick suggestions:</span>
              <button
                type="button"
                onClick={() => setCreatorUrl('https://karandev.io/sponsorships')}
                className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
              >
                karandev.io
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setCreatorUrl('https://sarahchen.dev/media-kit')}
                className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
              >
                sarahchen.dev
              </button>
            </div>
          </div>

          {/* Autonomous Progress Stepper */}
          {loading && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Autonomous Pipeline Executing:</span>
              </div>
              <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 pl-6 list-disc">
                <li className={step === 'scraping' ? 'font-bold text-orange-600 dark:text-orange-400' : ''}>
                  Firecrawl: Scraping media kit & past sponsors...
                </li>
                <li className={step === 'analyzing' ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}>
                  OpenAI: Evaluating brand fit score & crafting personalized pitch...
                </li>
                <li className={step === 'pitching' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                  AgentMail: Dispatching programmatic pitch from agent inbox...
                </li>
              </ul>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Pitch dispatched! Creator added to Pitched column.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !creatorUrl.trim() || !campaignId}
              className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Launch Autonomous Pitch
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
