import React from 'react'

interface StatusBadgeProps {
  status: 'collected' | 'in_outreach' | 'negotiating' | 'contracted' | 'declined' | 'active' | 'planning' | 'paused' | 'completed' | string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase()

  switch (normalized) {
    case 'collected':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e222a] text-slate-300 border border-[#2d313b]">
          Collected
        </span>
      )
    case 'in_outreach':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/40 text-blue-400 border border-blue-800/40">
          In Outreach
        </span>
      )
    case 'negotiating':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 text-amber-400 border border-amber-800/40">
          Negotiating
        </span>
      )
    case 'contracted':
    case 'accepted':
    case 'active':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
          {normalized === 'contracted' ? 'Contracted' : normalized === 'accepted' ? 'Accepted' : 'Active'}
        </span>
      )
    case 'planning':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/40 text-indigo-400 border border-indigo-800/40">
          Planning
        </span>
      )
    case 'paused':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-950/40 text-yellow-400 border border-yellow-800/40">
          Paused
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/40 text-purple-400 border border-purple-800/40">
          Completed
        </span>
      )
    case 'declined':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-800/40">
          Declined
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
          {status}
        </span>
      )
  }
}
