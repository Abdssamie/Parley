import React, { useState } from 'react'
import { Settings, DollarSign, Target, FileText } from 'lucide-react'
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

interface CampaignSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: {
    _id: Id<'campaigns'>
    title: string
    budget: number
    targetNiche: string
    deliverableRequirements: string
    status: 'active' | 'planning' | 'paused' | 'completed'
  } | null
  onUpdateCampaign: (params: {
    id: Id<'campaigns'>
    title?: string
    budget?: number
    targetNiche?: string
    deliverableRequirements?: string
    status?: 'active' | 'planning' | 'paused' | 'completed'
  }) => Promise<void>
}

export const CampaignSettingsModal: React.FC<CampaignSettingsModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onUpdateCampaign,
}) => {
  const [title, setTitle] = useState(campaign?.title || '')
  const [budget, setBudget] = useState(campaign?.budget || 2000)
  const [targetNiche, setTargetNiche] = useState(campaign?.targetNiche || '')
  const [deliverables, setDeliverables] = useState(campaign?.deliverableRequirements || '')
  const [status, setStatus] = useState<'active' | 'planning' | 'paused' | 'completed'>(campaign?.status || 'active')
  const [saving, setSaving] = useState(false)

  if (!campaign) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onUpdateCampaign({
        id: campaign._id,
        title,
        budget: Number(budget),
        targetNiche,
        deliverableRequirements: deliverables,
        status,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400">
            <Settings className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider">Campaign Rules & Constraints</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Guardrails
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            The autonomous negotiator uses these parameters as strict constraints when evaluating creator fees and drafting counter-offers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="campTitle" className="text-xs font-semibold">Campaign Title</Label>
            <Input
              id="campTitle"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campBudget" className="text-xs font-semibold flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                Campaign Budget
              </Label>
              <Input
                id="campBudget"
                type="number"
                value={budget}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(Number(e.target.value))}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campStatus" className="text-xs font-semibold">Status</Label>
              <select
                id="campStatus"
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as 'active' | 'paused' | 'completed')}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campNiche" className="text-xs font-semibold flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-blue-500" />
              Target Audience Niche
            </Label>
            <Input
              id="campNiche"
              value={targetNiche}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetNiche(e.target.value)}
              placeholder="e.g. Developer Tools & AI Workflows"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campDeliverables" className="text-xs font-semibold flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Deliverable Scope Requirements
            </Label>
            <Input
              id="campDeliverables"
              value={deliverables}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliverables(e.target.value)}
              placeholder="e.g. 1 Dedicated YouTube Video + 1 X/Twitter Thread"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold"
            >
              {saving ? 'Saving...' : 'Save Guardrails'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
