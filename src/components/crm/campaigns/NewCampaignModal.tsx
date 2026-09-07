import * as React from 'react'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Target } from 'lucide-react'

interface NewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('')
  const [budget, setBudget] = useState<number>(10000)
  const [currency, setCurrency] = useState('USD')
  const [status, setStatus] = useState<'active' | 'planning' | 'paused' | 'completed'>('active')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [brief, setBrief] = useState('')
  const [targetNiche, setTargetNiche] = useState('Developer Tools & AI Workflows')
  const [deliverables, setDeliverables] = useState('1 Dedicated YouTube Video + 1 X/Twitter Thread')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createCampaign = useMutation(api.campaigns.create)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await createCampaign({
        title: title.trim(),
        budget: Number(budget),
        currency,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        brief: brief.trim() || `Partnership campaign focusing on ${targetNiche}.`,
        targetNiche,
        deliverableRequirements: deliverables,
      })
      onClose()
    } catch (err) {
      console.error('Failed to create campaign:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="size-4" />
            </div>
            <div>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Define target niche, allocated budget, and deliverable guidelines.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-title">Campaign Title</Label>
            <Input
              id="campaign-title"
              required
              placeholder="e.g. Q4 AI Productivity Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-budget">Budget</Label>
              <Input
                id="campaign-budget"
                type="number"
                min={0}
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign-currency">Currency</Label>
              <select
                id="campaign-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USD" className="bg-background">USD ($)</option>
                <option value="EUR" className="bg-background">EUR (€)</option>
                <option value="GBP" className="bg-background">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign-status">Status</Label>
              <select
                id="campaign-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'planning' | 'paused' | 'completed')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active" className="bg-background">Active</option>
                <option value="planning" className="bg-background">Planning</option>
                <option value="paused" className="bg-background">Paused</option>
                <option value="completed" className="bg-background">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-start">Start Date</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign-end">End Date</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-niche">Target Audience & Niche</Label>
            <Input
              id="campaign-niche"
              placeholder="e.g. Next.js Developers, DevOps Engineers"
              value={targetNiche}
              onChange={(e) => setTargetNiche(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-deliverables">Required Deliverables</Label>
            <Input
              id="campaign-deliverables"
              placeholder="e.g. 1 60s Integration + 2 Social Posts"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-brief">Campaign Brief</Label>
            <Textarea
              id="campaign-brief"
              rows={3}
              placeholder="Brief description of the product value proposition and call-to-action..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
