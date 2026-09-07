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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <CrmHeader
        title="Campaigns"
        count={campaigns.length}
        primaryActionLabel="New Campaign"
        onPrimaryAction={() => setIsNewModalOpen(true)}
      />

      {/* Main Content Area */}
      {campaigns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="relative w-44 h-40 mb-6 flex items-center justify-center">
            <svg
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-md"
            >
              <path
                d="M100 135 L170 95 L170 108 L100 148 L30 108 L30 95 Z"
                fill="currentColor"
                className="text-muted/40"
              />
              <path
                d="M30 95 L100 135 L100 148 L30 108 Z"
                fill="currentColor"
                className="text-muted/60"
              />
              <path
                d="M100 135 L170 95 L170 108 L100 148 Z"
                fill="currentColor"
                className="text-muted/80"
              />
              <path
                d="M100 55 L170 95 L100 135 L30 95 Z"
                fill="var(--primary)"
                opacity="0.8"
              />
              <ellipse
                cx="100"
                cy="95"
                rx="20"
                ry="11"
                fill="var(--card)"
              />
            </svg>
          </div>

          <h3 className="text-base font-bold text-foreground mb-1">Add your first Campaign</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-6">
            Create an active campaign to set target niche, deliverables, and launch autonomous outreach.
          </p>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Campaign</span>
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/60">
                  <TableHead className="w-10 px-3 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      aria-label={selectedIds.size > 0 && selectedIds.size === campaigns.length ? "Deselect all campaigns" : "Select all campaigns"}
                      className="text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
                    >
                      {selectedIds.size > 0 && selectedIds.size === campaigns.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </TableHead>

                  <TableHead className="px-3 min-w-[200px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Title</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Status</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Budget</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[90px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Currency</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Start</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>End</span>
                    </div>
                  </TableHead>

                  <TableHead className="px-3 min-w-[240px] font-semibold text-xs">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Brief</span>
                    </div>
                  </TableHead>

                  <TableHead className="w-10 px-2 text-center"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {campaigns.map((camp) => {
                  const isSelected = selectedIds.has(camp._id)
                  const symbol =
                    camp.currency === 'EUR' ? '€' : camp.currency === 'GBP' ? '£' : '$'

                  return (
                    <TableRow
                      key={camp._id}
                      onClick={() => onSelectCampaign && onSelectCampaign(camp)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <TableCell
                        onClick={(e) => handleToggleSelectRow(camp._id, e)}
                        className="px-3 text-center"
                      >
                        <button
                          type="button"
                          aria-label={isSelected ? `Deselect ${camp.title}` : `Select ${camp.title}`}
                          className="text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </TableCell>

                      <TableCell className="px-3 font-medium text-foreground truncate">
                        {camp.title}
                      </TableCell>

                      <TableCell className="px-3">
                        <StatusBadge status={camp.status} />
                      </TableCell>

                      <TableCell className="px-3 font-semibold text-foreground">
                        {symbol}
                        {camp.budget.toLocaleString()}
                      </TableCell>

                      <TableCell className="px-3 text-muted-foreground font-mono text-xs">
                        {camp.currency}
                      </TableCell>

                      <TableCell className="px-3 text-muted-foreground text-xs">
                        {camp.startDate || '—'}
                      </TableCell>

                      <TableCell className="px-3 text-muted-foreground text-xs">
                        {camp.endDate || '—'}
                      </TableCell>

                      <TableCell className="px-3 text-muted-foreground truncate max-w-xs text-xs">
                        {camp.brief}
                      </TableCell>

                      <TableCell className="px-2 text-center text-muted-foreground"></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-card border border-border shadow-xl rounded-xl flex items-center gap-4 text-xs z-30">
          <Badge variant="default" className="font-medium">
            {selectedIds.size} campaign{selectedIds.size > 1 ? 's' : ''} selected
          </Badge>
          <div className="h-4 w-px bg-border" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            className="h-7 text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="h-7 text-xs text-muted-foreground"
          >
            Deselect
          </Button>
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
