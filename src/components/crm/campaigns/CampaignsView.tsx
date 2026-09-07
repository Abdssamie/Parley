import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  Target,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Square,
  CheckSquare,
  Globe,
  Trash2,
} from 'lucide-react'
import { CrmHeader } from '../common/CrmHeader'
import { StatusBadge } from '../common/StatusBadge'
import { NewCampaignModal } from './NewCampaignModal'

interface CampaignsViewProps {
  onSelectCampaign?: (campaign: Doc<'campaigns'>) => void
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onSelectCampaign }) => {
  const rawCampaigns = useQuery(api.campaigns.list, {})
  const campaigns: Doc<'campaigns'>[] = rawCampaigns ?? []

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<Id<'campaigns'>>>(new Set())

  const removeCampaign = useMutation(api.campaigns.remove)

  const handleToggleSelectAll = () => {
    if (selectedIds.size === campaigns.length && campaigns.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(campaigns.map((c) => c._id)))
    }
  }

  const handleToggleSelectRow = (id: Id<'campaigns'>, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      await removeCampaign({ id })
    }
    setSelectedIds(new Set())
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0c0d10] text-slate-200">
      {/* Top Header */}
      <CrmHeader
        title="Campaigns"
        count={campaigns.length}
        primaryActionLabel="New Campaign"
        onPrimaryAction={() => setIsNewModalOpen(true)}
      />

      {/* Main Content Area */}
      {campaigns.length === 0 ? (
        /* Empty State matching Image 1 exactly */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          {/* Stylized Isometric Graphic */}
          <div className="relative w-44 h-40 mb-6 flex items-center justify-center">
            <svg
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,120,255,0.15)]"
            >
              {/* Lower Isometric Plate / Shadow */}
              <path
                d="M100 135 L170 95 L170 108 L100 148 L30 108 L30 95 Z"
                fill="#152438"
                stroke="#2a4568"
                strokeWidth="2"
              />
              {/* Isometric Base Sides */}
              <path
                d="M30 95 L100 135 L100 148 L30 108 Z"
                fill="#1c3452"
                stroke="#2a4568"
                strokeWidth="2"
              />
              <path
                d="M100 135 L170 95 L170 108 L100 148 Z"
                fill="#24446b"
                stroke="#2a4568"
                strokeWidth="2"
              />
              {/* Isometric Top Surface */}
              <path
                d="M100 55 L170 95 L100 135 L30 95 Z"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="2.5"
              />
              {/* Center Cutout Disk */}
              <ellipse
                cx="100"
                cy="95"
                rx="20"
                ry="11"
                fill="#0f172a"
                stroke="#0369a1"
                strokeWidth="2"
              />
              {/* Floating Token with X */}
              <circle cx="155" cy="72" r="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              <path
                d="M151 68 L159 76 M159 68 L151 76"
                stroke="#082f49"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h3 className="text-base font-bold text-white mb-1">Add your first Campaign</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            Use our API or add your first Campaign manually
          </p>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#171a22] hover:bg-[#202430] text-slate-200 hover:text-white border border-[#2b3040] rounded-md font-medium text-xs shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Campaign</span>
          </button>
        </div>
      ) : (
        /* Data Table matching Image 1 */
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse select-none">
            <thead className="sticky top-0 z-10 bg-[#13151b] border-b border-[#22252e] text-slate-400 font-medium text-[11px]">
              <tr className="h-9">
                <th className="w-10 px-3 text-center border-r border-[#1c1f26]">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-200 flex items-center justify-center w-full"
                  >
                    {selectedIds.size > 0 && selectedIds.size === campaigns.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>

                <th className="px-3 min-w-[200px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Title</span>
                  </div>
                </th>

                <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Status</span>
                  </div>
                </th>

                <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Budget</span>
                  </div>
                </th>

                <th className="px-3 min-w-[90px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Currency</span>
                  </div>
                </th>

                <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </div>
                </th>

                <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>End</span>
                  </div>
                </th>

                <th className="px-3 min-w-[240px] border-r border-[#1c1f26]">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Brief</span>
                  </div>
                </th>

                <th className="w-10 px-2 text-center text-slate-500 hover:text-slate-300 cursor-pointer">
                  <Plus className="w-3.5 h-3.5 mx-auto" />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1c1f26]">
              {campaigns.map((camp) => {
                const isSelected = selectedIds.has(camp._id)
                const symbol =
                  camp.currency === 'EUR' ? '€' : camp.currency === 'GBP' ? '£' : '$'

                return (
                  <tr
                    key={camp._id}
                    onClick={() => onSelectCampaign && onSelectCampaign(camp)}
                    className={`h-9 hover:bg-[#141720] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#1c1822]' : ''
                    }`}
                  >
                    <td
                      onClick={(e) => handleToggleSelectRow(camp._id, e)}
                      className="px-3 text-center border-r border-[#1c1f26]"
                    >
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-300 flex items-center justify-center w-full"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] font-medium text-slate-200 truncate">
                      {camp.title}
                    </td>

                    <td className="px-3 border-r border-[#1c1f26]">
                      <StatusBadge status={camp.status} />
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] text-slate-200 font-medium">
                      {symbol}
                      {camp.budget.toLocaleString()}
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] text-slate-400 font-mono">
                      {camp.currency}
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] text-slate-400">
                      {camp.startDate || '—'}
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] text-slate-400">
                      {camp.endDate || '—'}
                    </td>

                    <td className="px-3 border-r border-[#1c1f26] text-slate-400 truncate max-w-xs">
                      {camp.brief}
                    </td>

                    <td className="px-2 text-center text-slate-500"></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[#171a22] border border-[#2d3240] rounded-xl shadow-2xl flex items-center gap-4 text-xs z-30">
          <span className="font-medium text-rose-400">
            {selectedIds.size} campaign{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleBatchDelete}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-slate-200 text-[11px]"
          >
            Deselect
          </button>
        </div>
      )}

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  )
}
