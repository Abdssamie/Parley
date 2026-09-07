import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { X, Target, Check } from 'lucide-react'

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

  const createCampaign = useMutation(api.campaigns.create)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    await createCampaign({
      title,
      budget: Number(budget),
      currency,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      brief: brief || `Partnership campaign focusing on ${targetNiche}.`,
      targetNiche,
      deliverableRequirements: deliverables,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#14161c] border border-[#262a36] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22252f] flex items-center justify-between bg-[#111215]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Create New Campaign</h3>
              <p className="text-xs text-slate-400">Define budget, target niche, and deliverables</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1c1f26] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="campaign-title" className="text-slate-300 font-medium">Campaign Title</label>
            <input
              id="campaign-title"
              type="text"
              required
              placeholder="e.g. Q4 AI Productivity Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="campaign-budget" className="text-slate-300 font-medium">Budget</label>
              <input
                id="campaign-budget"
                type="number"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="campaign-currency" className="text-slate-300 font-medium">Currency</label>
              <select
                id="campaign-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="campaign-status" className="text-slate-300 font-medium">Status</label>
              <select
                id="campaign-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="campaign-start-date" className="text-slate-300 font-medium">Start Date</label>
              <input
                id="campaign-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="campaign-end-date" className="text-slate-300 font-medium">End Date</label>
              <input
                id="campaign-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="campaign-target-niche" className="text-slate-300 font-medium">Target Niche</label>
            <input
              id="campaign-target-niche"
              type="text"
              value={targetNiche}
              onChange={(e) => setTargetNiche(e.target.value)}
              className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="campaign-deliverables" className="text-slate-300 font-medium">Deliverable Requirements</label>
            <input
              id="campaign-deliverables"
              type="text"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="campaign-brief" className="text-slate-300 font-medium">Campaign Brief & Objectives</label>
            <textarea
              id="campaign-brief"
              rows={3}
              placeholder="Outline the core value prop, audience targets, and campaign goals..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-rose-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-[#2a2f3d] text-slate-300 hover:bg-[#1b1e26] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
