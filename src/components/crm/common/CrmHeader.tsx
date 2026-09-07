import React from 'react'
import {
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  Search,
  ListFilter,
} from 'lucide-react'

interface CrmHeaderProps {
  title: string
  count: number
  primaryActionLabel: string
  onPrimaryAction: () => void
  onSearchClick?: () => void
  onFilterClick?: () => void
  onSortClick?: () => void
  filterActive?: boolean
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({
  title,
  count,
  primaryActionLabel,
  onPrimaryAction,
  onSearchClick,
  onFilterClick,
  onSortClick,
  filterActive = false,
}) => {
  return (
    <div className="h-14 px-6 border-b border-[#22242a] flex items-center justify-between bg-[#111215] text-slate-200">
      {/* Left: View selector dropdown */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold hover:text-white px-2.5 py-1.5 rounded-md hover:bg-[#1c1f26] transition-colors"
        >
          <ListFilter className="w-4 h-4 text-slate-400" />
          <span>
            {title} · <span className="font-normal text-slate-400">{count}</span>
          </span>
          <span className="text-xs text-slate-400">▾</span>
        </button>
      </div>

      {/* Right: Controls & Primary Action */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onFilterClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors ${
            filterActive
              ? 'bg-[#1c2230] text-blue-400 border-blue-500/40'
              : 'border-[#272a33] text-slate-300 hover:text-white hover:bg-[#1c1f26]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>

        <button
          type="button"
          onClick={onSortClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#272a33] text-slate-300 hover:text-white hover:bg-[#1c1f26] transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#272a33] text-slate-300 hover:text-white hover:bg-[#1c1f26] transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Options</span>
        </button>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f232d] hover:bg-[#282d3b] text-white font-medium border border-[#323847] shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{primaryActionLabel}</span>
        </button>

        <button
          type="button"
          onClick={onSearchClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#272a33] text-slate-400 hover:text-slate-200 hover:bg-[#1c1f26] transition-colors"
          title="Search (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono text-slate-400">Ctrl K</span>
        </button>
      </div>
    </div>
  )
}
