import React from 'react'
import {
  X,
  ExternalLink,
  Mail,
  Users,
  Eye,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react'
import type { Doc } from '../../../../convex/_generated/dataModel'
import { StatusBadge } from '../common/StatusBadge'
import { PlatformBadge } from '../common/PlatformBadge'
import { AvatarInitial } from '../common/AvatarInitial'

interface CreatorDrawerProps {
  creator: Doc<'creators'> | null
  isOpen: boolean
  onClose: () => void
  onLaunchOutreach?: (creator: Doc<'creators'>) => void
}

export const CreatorDrawer: React.FC<CreatorDrawerProps> = ({
  creator,
  isOpen,
  onClose,
  onLaunchOutreach,
}) => {
  if (!isOpen || !creator) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#13151a] border-l border-[#242833] shadow-2xl z-50 flex flex-col text-slate-200">
      {/* Drawer Header */}
      <div className="h-16 px-6 border-b border-[#22252e] flex items-center justify-between bg-[#111215]">
        <div className="flex items-center gap-3">
          <AvatarInitial name={creator.name} size="md" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">{creator.name}</h3>
            <p className="text-xs text-slate-400">{creator.audienceNiche}</p>
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

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
        {/* Core Badges */}
        <div className="flex items-center gap-2">
          <StatusBadge status={creator.status} />
          <PlatformBadge platform={creator.platform} />
          <span className="ml-auto px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Fit: {creator.brandFitScore}%
          </span>
        </div>

        {/* Contact & Social Links */}
        <div className="p-4 bg-[#181a21] border border-[#262934] rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
            <a
              href={`mailto:${creator.email}`}
              className="text-blue-400 hover:underline font-mono"
            >
              {creator.email}
            </a>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Portfolio / Channel
            </span>
            <a
              href={creator.bioLink}
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white truncate max-w-[200px]"
            >
              {creator.bioLink}
            </a>
          </div>

          {creator.country && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Country</span>
              <span className="text-slate-200 font-medium">{creator.country}</span>
            </div>
          )}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#181a21] border border-[#262934] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Followers</span>
            </div>
            <div className="text-lg font-bold text-white">
              {creator.followers ? creator.followers.toLocaleString() : '—'}
            </div>
          </div>

          <div className="p-3.5 bg-[#181a21] border border-[#262934] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Avg. Views</span>
            </div>
            <div className="text-lg font-bold text-white">
              {creator.views ? creator.views.toLocaleString() : '—'}
            </div>
          </div>

          <div className="p-3.5 bg-[#181a21] border border-[#262934] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engagement</span>
            </div>
            <div className="text-lg font-bold text-white">
              {creator.engagementRate ? `${creator.engagementRate}%` : '—'}
            </div>
          </div>

          <div className="p-3.5 bg-[#181a21] border border-[#262934] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Est. Cost</span>
            </div>
            <div className="text-lg font-bold text-white">
              {creator.estCost ? `$${creator.estCost.toLocaleString()}` : '—'}
            </div>
          </div>
        </div>

        {/* Scraped Summary from Firecrawl */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Firecrawl Dossier & Audience Intel
          </h4>
          <p className="p-3.5 bg-[#181a21] border border-[#262934] rounded-lg text-slate-300 leading-relaxed text-xs">
            {creator.scrapedSummary || 'No scraping notes available.'}
          </p>
        </div>

        {/* Past Sponsors */}
        {creator.pastSponsors && creator.pastSponsors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Past Verified Brand Collaborations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {creator.pastSponsors.map((sponsor) => (
                <span
                  key={sponsor}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-[#1d2028] text-slate-300 border border-[#2c303c] font-medium"
                >
                  {sponsor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer CTA */}
      <div className="p-4 border-t border-[#22252e] bg-[#111215] flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (onLaunchOutreach) onLaunchOutreach(creator)
            onClose()
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs shadow transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Launch Outreach with Parley Agent</span>
        </button>
      </div>
    </div>
  )
}
