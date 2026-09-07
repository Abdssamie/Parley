import React from 'react'
import {
  Filter,
  ArrowUpDown,
  Plus,
  Search,
  ListFilter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="h-14 px-6 border-b border-border/60 flex items-center justify-between bg-card/60 backdrop-blur-sm text-card-foreground">
      {/* Left: View selector indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold px-2.5 py-1.5 rounded-lg">
          <ListFilter className="w-4 h-4 text-primary" />
          <span>
            {title} · <span className="font-normal text-muted-foreground">{count}</span>
          </span>
        </div>
      </div>

      {/* Right: Controls & Primary Action */}
      <div className="flex items-center gap-2 text-xs">
        <Button
          type="button"
          variant={filterActive ? 'default' : 'outline'}
          size="sm"
          onClick={onFilterClick}
          className="flex items-center gap-1.5 text-xs shadow-xs"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </Button>

        {onSortClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSortClick}
            className="flex items-center gap-1.5 text-xs shadow-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort</span>
          </Button>
        )}

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onPrimaryAction}
          className="flex items-center gap-1.5 text-xs shadow-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{primaryActionLabel}</span>
        </Button>

        {onSearchClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs"
            title="Search (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Ctrl K</span>
          </Button>
        )}
      </div>
    </div>
  )
}

