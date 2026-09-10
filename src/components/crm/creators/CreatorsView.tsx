import * as React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  Users,
  Trash2,
  Send,
  Search,
  Check,
  Pencil,
  Eye,
  ChevronDown,
  UserRoundPlus,
} from 'lucide-react'
import { CreatorDrawer } from './CreatorDrawer'
import { NewCreatorModal } from './NewCreatorModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface CreatorsViewProps {
  onLaunchOutreach?: (creator: Doc<'creators'>) => void
}

type EditableCreatorField =
  | 'name'
  | 'email'
  | 'audienceNiche'
  | 'followers'
  | 'views'
  | 'estCost'
  | 'country'

export const CreatorsView: React.FC<CreatorsViewProps> = ({ onLaunchOutreach }) => {
  // 1. Convex Live Subscription
  const rawCreators = useQuery(api.creators.list, {})
  const creators: Doc<'creators'>[] = rawCreators ?? []

  // 2. View State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [selectedIds, setSelectedIds] = useState<Set<Id<'creators'>>>(new Set())
  const [drawerCreator, setDrawerCreator] = useState<Doc<'creators'> | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  // 3. Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: Id<'creators'>; field: EditableCreatorField } | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 4. Convex Mutations
  const updateCreator = useMutation(api.creators.update)
  const removeCreator = useMutation(api.creators.remove)

  // Focus input on inline edit
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // 5. Derived Filtered List (zero setState in useEffect)
  const filteredCreators = useMemo(() => {
    let list = [...creators]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.audienceNiche.toLowerCase().includes(q) ||
          (c.country && c.country.toLowerCase().includes(q))
      )
    }

    if (filterPlatform !== 'all') {
      list = list.filter((c) => c.platform === filterPlatform)
    }

    if (filterStatus !== 'all') {
      list = list.filter((c) => (c.status || 'collected') === filterStatus)
    }

    return list
  }, [creators, searchQuery, filterPlatform, filterStatus])

  // Inline edit handlers
  const handleStartEdit = (
    id: Id<'creators'>,
    field: EditableCreatorField,
    currentValue: string | number | undefined,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setEditingCell({ id, field })
    setEditValue(currentValue !== undefined ? String(currentValue) : '')
  }

  const handleSaveEdit = async () => {
    if (!editingCell) return
    const { id, field } = editingCell
    const val = editValue.trim()

    try {
      if (field === 'followers' || field === 'views' || field === 'estCost') {
        const num = val ? Number(val) : undefined
        if (num === undefined || (!isNaN(num) && num >= 0)) {
          await updateCreator({ id, [field]: num })
        }
      } else if (field === 'name') {
        if (val) {
          await updateCreator({ id, name: val })
        }
      } else if (field === 'email') {
        await updateCreator({ id, email: val })
      } else if (field === 'audienceNiche') {
        await updateCreator({ id, audienceNiche: val })
      } else if (field === 'country') {
        await updateCreator({ id, country: val || undefined })
      }
    } catch (err) {
      console.error('Failed to update creator inline:', err)
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

  const handleStatusChange = async (
    id: Id<'creators'>,
    newStatus: 'collected' | 'in_outreach' | 'negotiating' | 'contracted' | 'declined',
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation()
    await updateCreator({ id, status: newStatus })
  }

  const handlePlatformChange = async (
    id: Id<'creators'>,
    newPlatform: 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'substack' | 'linkedin' | 'twitch',
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation()
    await updateCreator({ id, platform: newPlatform })
  }

  // Selection handlers
  const handleToggleSelectAll = (checked?: boolean | 'indeterminate') => {
    if (checked === true || (checked === undefined && selectedIds.size < filteredCreators.length)) {
      setSelectedIds(new Set(filteredCreators.map((c) => c._id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelectRow = (id: Id<'creators'>, e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) e.stopPropagation()
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
      await removeCreator({ id })
    }
    setSelectedIds(new Set())
  }

  const handleDeleteSingle = async (id: Id<'creators'>, e: React.MouseEvent) => {
    e.stopPropagation()
    await removeCreator({ id })
    if (selectedIds.has(id)) {
      const next = new Set(selectedIds)
      next.delete(id)
      setSelectedIds(next)
    }
  }

  const formatNumber = (num?: number) => {
    if (!num) return '—'
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
        {/* Compressed Single-Row Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/80"
              />
            </div>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger size="sm" className="h-8 text-xs w-[125px] bg-background/80">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="substack">Substack</SelectItem>
                <SelectItem value="twitch">Twitch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger size="sm" className="h-8 text-xs w-[125px] bg-background/80">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="in_outreach">In Outreach</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="contracted">Contracted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="h-8 text-xs gap-1.5 px-2.5 shadow-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Delete ({selectedIds.size})</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="h-8 text-xs gap-1.5 px-2.5 shadow-xs"
              title="Add Creator"
              aria-label="Add Creator"
            >
              <UserRoundPlus className="size-3.5" />
              <span>Add Creator</span>
            </Button>
          </div>
        </div>

        <div>
          {filteredCreators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Users className="size-6" />
              </div>
              <h4 className="text-sm font-semibold">No creators found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                  ? 'Try modifying your search or platform filters.'
                  : 'Start discovering creators using intelligence tools or add them manually.'}
              </p>
              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <UserRoundPlus className="size-3.5" />
                <span>Add Creator</span>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-4 text-center">
                    <Checkbox
                      checked={
                        selectedIds.size === 0
                          ? false
                          : selectedIds.size === filteredCreators.length
                          ? true
                          : 'indeterminate'
                      }
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Select all creators"
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px] text-xs font-semibold">Creator & Niche</TableHead>
                  <TableHead className="min-w-[110px] text-xs font-semibold">Platform</TableHead>
                  <TableHead className="min-w-[110px] text-xs font-semibold">Status</TableHead>
                  <TableHead className="min-w-[95px] text-xs font-semibold">Followers</TableHead>
                  <TableHead className="min-w-[95px] text-xs font-semibold">Avg. Views</TableHead>
                  <TableHead className="min-w-[95px] text-xs font-semibold">Est. Cost</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold">Brand Fit</TableHead>
                  <TableHead className="w-24 text-right px-4 text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.map((creator) => {
                  const isSelected = selectedIds.has(creator._id)
                  const initials = creator.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()

                  return (
                    <TableRow
                      key={creator._id}
                      data-state={isSelected ? "selected" : undefined}
                      className="group/row"
                    >
                        {/* Checkbox */}
                        <TableCell
                          onClick={(e) => handleToggleSelectRow(creator._id, e)}
                          className="px-4 text-center cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelectRow(creator._id)}
                            aria-label={`Select ${creator.name}`}
                          />
                        </TableCell>

                        {/* Creator Name & Niche (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              className="size-8 border border-border shrink-0 cursor-pointer"
                              onClick={() => setDrawerCreator(creator)}
                            >
                              <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col min-w-0 flex-1">
                              {editingCell?.id === creator._id && editingCell?.field === 'name' ? (
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
                                  onClick={(e) => handleStartEdit(creator._id, 'name', creator.name, e)}
                                  className="group/cell flex items-center justify-between cursor-pointer p-0.5 rounded hover:bg-accent/50 transition-colors"
                                  title="Click to edit name"
                                >
                                  <span className="font-semibold text-sm truncate text-foreground">
                                    {creator.name}
                                  </span>
                                  <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                                </div>
                              )}

                              {/* Audience Niche subtext inline edit */}
                              {editingCell?.id === creator._id && editingCell?.field === 'audienceNiche' ? (
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
                                  onClick={(e) =>
                                    handleStartEdit(creator._id, 'audienceNiche', creator.audienceNiche, e)
                                  }
                                  className="text-xs text-muted-foreground truncate hover:text-foreground cursor-pointer"
                                  title="Click to edit niche"
                                >
                                  {creator.audienceNiche || creator.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Platform (Inline Select) */}
                        <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={creator.platform}
                            onChange={(e) =>
                              handlePlatformChange(
                                creator._id,
                                e.target.value as 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'substack' | 'linkedin' | 'twitch',
                                e
                              )
                            }
                            className="h-7 text-xs capitalize rounded-md border border-input bg-transparent px-2 py-0.5 cursor-pointer outline-none"
                          >
                            <option value="youtube" className="bg-background">YouTube</option>
                            <option value="twitter" className="bg-background">Twitter / X</option>
                            <option value="tiktok" className="bg-background">TikTok</option>
                            <option value="instagram" className="bg-background">Instagram</option>
                            <option value="substack" className="bg-background">Substack</option>
                            <option value="twitch" className="bg-background">Twitch</option>
                            <option value="linkedin" className="bg-background">LinkedIn</option>
                          </select>
                        </TableCell>

                        {/* Status (Inline Select) */}
                        <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center">
                            <span
                              className={cn(
                                "absolute left-2.5 size-1.5 rounded-full pointer-events-none z-10",
                                creator.status === 'contracted' && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                                creator.status === 'negotiating' && "bg-amber-500",
                                creator.status === 'in_outreach' && "bg-sky-500",
                                creator.status === 'declined' && "bg-rose-500/80",
                                (!creator.status || creator.status === 'collected') && "bg-muted-foreground/60"
                              )}
                            />
                            <select
                              value={creator.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  creator._id,
                                  e.target.value as 'collected' | 'in_outreach' | 'negotiating' | 'contracted' | 'declined',
                                  e
                                )
                              }
                              className={cn(
                                "h-7 pl-6 pr-6 text-xs font-medium rounded-md border cursor-pointer outline-none transition-colors appearance-none",
                                creator.status === 'contracted' && "bg-emerald-500/[0.08] border-emerald-500/25 text-foreground hover:bg-emerald-500/[0.14]",
                                creator.status === 'negotiating' && "bg-amber-500/[0.08] border-amber-500/25 text-foreground hover:bg-amber-500/[0.14]",
                                creator.status === 'in_outreach' && "bg-sky-500/[0.08] border-sky-500/25 text-foreground hover:bg-sky-500/[0.14]",
                                creator.status === 'declined' && "bg-rose-500/[0.08] border-rose-500/25 text-foreground hover:bg-rose-500/[0.14]",
                                (!creator.status || creator.status === 'collected') && "bg-muted/40 border-border/80 text-muted-foreground hover:bg-muted/60"
                              )}
                            >
                              <option value="collected" className="bg-background text-foreground">Collected</option>
                              <option value="in_outreach" className="bg-background text-foreground">In Outreach</option>
                              <option value="negotiating" className="bg-background text-foreground">Negotiating</option>
                              <option value="contracted" className="bg-background text-foreground">Contracted</option>
                              <option value="declined" className="bg-background text-foreground">Declined</option>
                            </select>
                            <ChevronDown className="absolute right-2 size-3 text-muted-foreground pointer-events-none" />
                          </div>
                        </TableCell>

                        {/* Followers (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          {editingCell?.id === creator._id && editingCell?.field === 'followers' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1 w-24"
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
                              onClick={(e) => handleStartEdit(creator._id, 'followers', creator.followers, e)}
                              className="group/cell flex items-center justify-between cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors text-xs font-medium"
                              title="Click to edit followers"
                            >
                              <span>{formatNumber(creator.followers)}</span>
                              <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </TableCell>

                        {/* Avg Views (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          {editingCell?.id === creator._id && editingCell?.field === 'views' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1 w-24"
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
                              onClick={(e) => handleStartEdit(creator._id, 'views', creator.views, e)}
                              className="group/cell flex items-center justify-between cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors text-xs text-muted-foreground"
                              title="Click to edit average views"
                            >
                              <span>{formatNumber(creator.views)}</span>
                              <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </TableCell>

                        {/* Est Cost (Inline Modifiable) */}
                        <TableCell className="py-2.5">
                          {editingCell?.id === creator._id && editingCell?.field === 'estCost' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-xs px-2 py-1 w-24 font-semibold"
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
                              onClick={(e) => handleStartEdit(creator._id, 'estCost', creator.estCost, e)}
                              className="group/cell flex items-center justify-between cursor-pointer p-1 rounded hover:bg-accent/50 transition-colors text-xs font-semibold"
                              title="Click to edit estimated cost"
                            >
                              <span>{creator.estCost ? `$${creator.estCost.toLocaleString()}` : '—'}</span>
                              <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1" />
                            </div>
                          )}
                        </TableCell>

                        {/* Brand Fit */}
                        <TableCell className="py-2.5">
                          {creator.brandFitScore ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                              {creator.brandFitScore}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDrawerCreator(creator)}
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="View dossier & full details"
                            >
                              <Eye className="size-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (onLaunchOutreach) onLaunchOutreach(creator)
                              }}
                              className="h-7 px-2 text-xs flex items-center gap-1 hover:text-primary"
                              title="Launch Outreach with Parley Agent"
                            >
                              <Send className="size-3" />
                              <span className="hidden sm:inline">Pitch</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteSingle(creator._id, e)}
                              className="size-7 text-muted-foreground hover:text-destructive"
                              title="Delete creator"
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
          )}
        </div>
      </div>

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

      {/* Creator Detail Sheet */}
      <CreatorDrawer
        creator={drawerCreator}
        isOpen={Boolean(drawerCreator)}
        onClose={() => setDrawerCreator(null)}
        onLaunchOutreach={onLaunchOutreach}
      />

      {/* New Creator Enrichment Modal */}
      <NewCreatorModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  )
}
export default CreatorsView
