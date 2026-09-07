import * as React from 'react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  Users,
  Plus,
  Trash2,
  Send,
  Search,
  Check,
  Pencil,
  Eye,
} from 'lucide-react'
import { CreatorDrawer } from './CreatorDrawer'
import { NewCreatorModal } from './NewCreatorModal'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

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
      list = list.filter((c) => c.status === filterStatus)
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
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredCreators.length && filteredCreators.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCreators.map((c) => c._id)))
    }
  }

  const handleToggleSelectRow = (id: Id<'creators'>, e: React.MouseEvent) => {
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
      {/* Pure Data Table Card (Cards removed as requested) */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Creators Data Table</CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {filteredCreators.length} row{filteredCreators.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Click any cell to edit inline. Press Enter or click outside to save.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
              {(['all', 'youtube', 'twitter', 'tiktok', 'instagram'] as const).map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setFilterPlatform(plat)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    filterPlatform === plat
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
              {(['all', 'collected', 'negotiating', 'contracted'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Creator</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCreators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Users className="size-6" />
              </div>
              <h4 className="text-sm font-semibold">No creators found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                  ? 'Try modifying your search or platform filters.'
                  : 'Start discovering creators using Firecrawl intelligence or add them manually.'}
              </p>
              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Add Creator</span>
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
                          selectedIds.size > 0 && selectedIds.size === filteredCreators.length
                        }
                        onChange={handleToggleSelectAll}
                        aria-label="Select all creators"
                        className="rounded border-input text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="min-w-[220px] text-xs font-semibold">
                      Creator Name & Niche <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[120px] text-xs font-semibold">
                      Platform <span className="text-[10px] text-muted-foreground font-normal">(Select)</span>
                    </TableHead>
                    <TableHead className="min-w-[130px] text-xs font-semibold">
                      Status <span className="text-[10px] text-muted-foreground font-normal">(Select)</span>
                    </TableHead>
                    <TableHead className="min-w-[110px] text-xs font-semibold">
                      Followers <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[110px] text-xs font-semibold">
                      Avg. Views <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[110px] text-xs font-semibold">
                      Est. Cost <span className="text-[10px] text-muted-foreground font-normal">(Editable)</span>
                    </TableHead>
                    <TableHead className="min-w-[80px] text-xs font-semibold">Brand Fit</TableHead>
                    <TableHead className="w-28 text-right px-4 text-xs font-semibold">Actions</TableHead>
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
                        className={`transition-colors group/row ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell
                          onClick={(e) => handleToggleSelectRow(creator._id, e)}
                          className="px-4 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            aria-label={`Select ${creator.name}`}
                            className="rounded border-input text-primary focus:ring-primary size-3.5 cursor-pointer"
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
                          <select
                            value={creator.status}
                            onChange={(e) =>
                              handleStatusChange(
                                creator._id,
                                e.target.value as 'collected' | 'in_outreach' | 'negotiating' | 'contracted' | 'declined',
                                e
                              )
                            }
                            className={`h-7 text-xs font-semibold rounded-md border px-2 py-0.5 cursor-pointer outline-none transition-colors ${
                              creator.status === 'contracted'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : creator.status === 'negotiating'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : creator.status === 'in_outreach'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            <option value="collected" className="bg-background text-foreground">Collected</option>
                            <option value="in_outreach" className="bg-background text-foreground">In Outreach</option>
                            <option value="negotiating" className="bg-background text-foreground">Negotiating</option>
                            <option value="contracted" className="bg-background text-foreground">Contracted</option>
                            <option value="declined" className="bg-background text-foreground">Declined</option>
                          </select>
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
