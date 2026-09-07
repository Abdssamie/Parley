import * as React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  Target,
  Calendar,
  Plus,
  Trash2,
  Compass,
  Search,
  ArrowUpRight,
  Check,
  Pencil,
} from 'lucide-react'
import { NewCampaignModal } from './NewCampaignModal'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'

interface CampaignsViewProps {
  onSelectCampaign?: (campaign: Doc<'campaigns'>) => void
}

type EditableCampaignField = 'title' | 'budget' | 'targetNiche' | 'deliverableRequirements' | 'startDate' | 'endDate'

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onSelectCampaign }) => {
  const rawCampaigns = useQuery(api.campaigns.list, {})
  const campaigns: Doc<'campaigns'>[] = rawCampaigns ?? []

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<Id<'campaigns'>>>(new Set())

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: Id<'campaigns'>; field: EditableCampaignField } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const updateCampaign = useMutation(api.campaigns.update)
  const removeCampaign = useMutation(api.campaigns.remove)

  // Focus input when inline editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Derived filtered campaigns
  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.targetNiche && c.targetNiche.toLowerCase().includes(q)) ||
          (c.brief && c.brief.toLowerCase().includes(q)) ||
          (c.deliverableRequirements && c.deliverableRequirements.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter)
    }
    return list
  }, [campaigns, searchQuery, statusFilter])

  // Inline edit commit handlers
  const handleStartEdit = (id: Id<'campaigns'>, field: EditableCampaignField, currentValue: string | number | undefined, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCell({ id, field })
    setEditValue(currentValue !== undefined ? String(currentValue) : '')
  }

  const handleSaveEdit = async () => {
    if (!editingCell) return
    const { id, field } = editingCell
    const val = editValue.trim()

    try {
      if (field === 'budget') {
        const num = Number(val)
        if (!isNaN(num) && num >= 0) {
          await updateCampaign({ id, budget: num })
        }
      } else if (field === 'title') {
        if (val) {
          await updateCampaign({ id, title: val })
        }
      } else if (field === 'targetNiche') {
        await updateCampaign({ id, targetNiche: val })
      } else if (field === 'deliverableRequirements') {
        await updateCampaign({ id, deliverableRequirements: val })
      } else if (field === 'startDate') {
        await updateCampaign({ id, startDate: val || undefined })
      } else if (field === 'endDate') {
        await updateCampaign({ id, endDate: val || undefined })
      }
    } catch (err) {
      console.error('Failed to update campaign inline:', err)
    } finally {
      setEditingCell(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleStatusChange = async (id: Id<'campaigns'>, newStatus: 'active' | 'planning' | 'paused' | 'completed', e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    await updateCampaign({ id, status: newStatus })
  }

  const handleCurrencyChange = async (id: Id<'campaigns'>, newCurrency: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation()
    await updateCampaign({ id, currency: newCurrency })
  }

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredCampaigns.length && filteredCampaigns.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCampaigns.map((c) => c._id)))
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

  const handleDeleteSingle = async (id: Id<'campaigns'>, e: React.MouseEvent) => {
    e.stopPropagation()
    await removeCampaign({ id })
    if (selectedIds.has(id)) {
      const next = new Set(selectedIds)
      next.delete(id)
      setSelectedIds(next)
    }
  }

  return (
    <div className="space-y-4">
      {/* Pure Data Table Card (Cards removed as requested) */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Campaigns Data Table</CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {filteredCampaigns.length} row{filteredCampaigns.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Click any cell to edit inline. Press Enter or click outside to save.
            </CardDescription>
          </div>

          {/* Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, niche, brief..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
              {(['all', 'active', 'planning', 'paused', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    statusFilter === filter
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>New Campaign</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Target className="size-6" />
              </div>
              <h4 className="text-sm font-semibold">No campaigns matching filter</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try modifying your filter options or search keyword.'
                  : 'Add your first campaign to define budget, niche, and deliverables.'}
              </p>
              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Create Campaign</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size > 0 && selectedIds.size === filteredCampaigns.length
                        }
                        onChange={handleToggleSelectAll}
                        aria-label="Select all campaigns"
                        className="rounded border-input text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="min-w-[220px] text-xs font-semibold">
                      Title & Target Niche <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[130px] text-xs font-semibold">
                      Status <span className="text-[10px] text-muted-foreground font-normal">(Select)</span>
                    </TableHead>
                    <TableHead className="min-w-[140px] text-xs font-semibold">
                      Budget <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[80px] text-xs font-semibold">
                      Currency
                    </TableHead>
                    <TableHead className="min-w-[190px] text-xs font-semibold">
                      Timeline <span className="text-[10px] text-muted-foreground font-normal">(Start → End)</span>
                    </TableHead>
                    <TableHead className="min-w-[260px] text-xs font-semibold">
                      Deliverables / Brief <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="w-24 text-right px-4 text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCampaigns.map((camp) => {
                    const isSelected = selectedIds.has(camp._id)

                    return (
                      <TableRow
                        key={camp._id}
                        className={`transition-colors group/row ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell
                          onClick={(e) => handleToggleSelectRow(camp._id, e)}
                          className="px-4 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            aria-label={`Select ${camp.title}`}
                            className="rounded border-input text-primary focus:ring-primary size-3.5 cursor-pointer"
                          />
                        </TableCell>

                        {/* Title & Target Niche (Inline Modifiable) */}
                        <TableCell className="font-medium text-foreground py-2.5">
                          {editingCell?.id === camp._id && editingCell?.field === 'title' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1 font-semibold"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-6 shrink-0"
                                onClick={handleSaveEdit}
                              >
                                <Check className="size-3 text-emerald-500" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => handleStartEdit(camp._id, 'title', camp.title, e)}
                              className="group/cell flex flex-col cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors"
                              title="Click to edit title"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate font-semibold text-sm">{camp.title}</span>
                                <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>

                              {/* Target Niche subtext inline edit */}
                              {editingCell?.id === camp._id && editingCell?.field === 'targetNiche' ? (
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={handleKeyDown}
                                  className="h-6 text-[11px] px-1.5 py-0.5 mt-1"
                                />
                              ) : (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartEdit(camp._id, 'targetNiche', camp.targetNiche, e)
                                  }}
                                  className="text-xs text-muted-foreground truncate hover:text-foreground"
                                  title="Click to edit target niche"
                                >
                                  {camp.targetNiche || 'Click to set target niche'}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Status (Inline Select) */}
                        <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={camp.status}
                            onChange={(e) =>
                              handleStatusChange(
                                camp._id,
                                e.target.value as 'active' | 'planning' | 'paused' | 'completed',
                                e
                              )
                            }
                            className={`h-7 text-xs font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none transition-colors ${
                              camp.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : camp.status === 'planning'
                                ? 'bg-secondary text-secondary-foreground border-border'
                                : camp.status === 'paused'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            <option value="active" className="bg-background text-foreground">Active</option>
                            <option value="planning" className="bg-background text-foreground">Planning</option>
                            <option value="paused" className="bg-background text-foreground">Paused</option>
                            <option value="completed" className="bg-background text-foreground">Completed</option>
                          </select>
                        </TableCell>

                        {/* Budget (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          {editingCell?.id === camp._id && editingCell?.field === 'budget' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1 font-semibold w-24"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-6 shrink-0"
                                onClick={handleSaveEdit}
                              >
                                <Check className="size-3 text-emerald-500" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => handleStartEdit(camp._id, 'budget', camp.budget, e)}
                              className="group/cell flex items-center justify-between cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors"
                              title="Click to edit budget"
                            >
                              <span className="font-semibold text-sm">
                                {camp.budget.toLocaleString()}
                              </span>
                              <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </TableCell>

                        {/* Currency (Inline Select) */}
                        <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={camp.currency || 'USD'}
                            onChange={(e) => handleCurrencyChange(camp._id, e.target.value, e)}
                            className="h-7 text-xs font-mono rounded-md border border-input bg-transparent px-2 py-0.5 cursor-pointer outline-none"
                          >
                            <option value="USD" className="bg-background">USD ($)</option>
                            <option value="EUR" className="bg-background">EUR (€)</option>
                            <option value="GBP" className="bg-background">GBP (£)</option>
                          </select>
                        </TableCell>

                        {/* Timeline (Inline Modifiable Dates) */}
                        <TableCell className="py-2.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                            {editingCell?.id === camp._id && editingCell?.field === 'startDate' ? (
                              <Input
                                ref={inputRef}
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-6 text-[11px] px-1 py-0.5 w-28"
                              />
                            ) : (
                              <span
                                onClick={(e) => handleStartEdit(camp._id, 'startDate', camp.startDate, e)}
                                className="cursor-pointer hover:text-foreground hover:underline"
                                title="Click to edit start date"
                              >
                                {camp.startDate || 'Start Date'}
                              </span>
                            )}
                            <span>→</span>
                            {editingCell?.id === camp._id && editingCell?.field === 'endDate' ? (
                              <Input
                                ref={inputRef}
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-6 text-[11px] px-1 py-0.5 w-28"
                              />
                            ) : (
                              <span
                                onClick={(e) => handleStartEdit(camp._id, 'endDate', camp.endDate, e)}
                                className="cursor-pointer hover:text-foreground hover:underline"
                                title="Click to edit end date"
                              >
                                {camp.endDate || 'End Date'}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Deliverables & Brief (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          {editingCell?.id === camp._id && editingCell?.field === 'deliverableRequirements' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-6 shrink-0"
                                onClick={handleSaveEdit}
                              >
                                <Check className="size-3 text-emerald-500" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={(e) =>
                                handleStartEdit(
                                  camp._id,
                                  'deliverableRequirements',
                                  camp.deliverableRequirements || camp.brief,
                                  e
                                )
                              }
                              className="group/cell flex items-center justify-between cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors text-xs text-muted-foreground"
                              title="Click to edit deliverables / brief"
                            >
                              <span className="truncate max-w-[220px]">
                                {camp.deliverableRequirements || camp.brief || 'Click to add deliverables'}
                              </span>
                              <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectCampaign && onSelectCampaign(camp)}
                              className="h-7 px-2 text-xs flex items-center gap-1 hover:text-primary"
                              title="Open in Pipeline"
                            >
                              <Compass className="size-3" />
                              <span className="hidden sm:inline">Pipeline</span>
                              <ArrowUpRight className="size-2.5 text-muted-foreground" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteSingle(camp._id, e)}
                              className="size-7 text-muted-foreground hover:text-destructive"
                              title="Delete campaign"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-card border border-border shadow-lg rounded-xl flex items-center gap-3 text-xs z-30 animate-in fade-in slide-in-from-bottom-2">
          <Badge variant="default" className="font-medium">
            {selectedIds.size} selected
          </Badge>
          <div className="h-4 w-px bg-border" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            className="h-7 text-xs flex items-center gap-1"
          >
            <Trash2 className="size-3" />
            <span>Delete Selected</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
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
export default CampaignsView
