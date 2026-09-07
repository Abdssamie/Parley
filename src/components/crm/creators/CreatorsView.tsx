import React, { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  User,
  Clock,
  Smartphone,
  Mail,
  Flag,
  Users,
  Eye,
  Activity,
  DollarSign,
  Trash2,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react'
import { CrmHeader } from '../common/CrmHeader'
import { StatusBadge } from '../common/StatusBadge'
import { PlatformBadge } from '../common/PlatformBadge'
import { AvatarInitial } from '../common/AvatarInitial'
import { CreatorDrawer } from './CreatorDrawer'
import { NewCreatorModal } from './NewCreatorModal'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface CreatorsViewProps {
  onLaunchOutreach?: (creator: Doc<'creators'>) => void
}

type SortField = 'name' | 'followers' | 'views' | 'estCost' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export const CreatorsView: React.FC<CreatorsViewProps> = ({ onLaunchOutreach }) => {
  // 1. Live Convex Subscription
  const rawCreators = useQuery(api.creators.list, {})
  const creators: Doc<'creators'>[] = rawCreators ?? []

  // 2. Local View State (Filter, Sort, Search, Selection)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [selectedIds, setSelectedIds] = useState<Set<Id<'creators'>>>(new Set())
  const [drawerCreator, setDrawerCreator] = useState<Doc<'creators'> | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  // 3. Convex Mutations
  const batchUpdateStatus = useMutation(api.creators.batchUpdateStatus)
  const removeCreator = useMutation(api.creators.remove)

  // 4. Derived Filtered and Sorted Creators during render (React Best Practice: zero setState in useEffect)
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

    list.sort((a, b) => {
      let valA: number | string = 0
      let valB: number | string = 0

      if (sortField === 'name') {
        valA = a.name.toLowerCase()
        valB = b.name.toLowerCase()
      } else if (sortField === 'followers') {
        valA = a.followers ?? 0
        valB = b.followers ?? 0
      } else if (sortField === 'views') {
        valA = a.views ?? 0
        valB = b.views ?? 0
      } else if (sortField === 'estCost') {
        valA = a.estCost ?? 0
        valB = b.estCost ?? 0
      } else {
        valA = a.createdAt
        valB = b.createdAt
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [creators, searchQuery, filterPlatform, filterStatus, sortField, sortOrder])

  // 5. Calculations for Summary Footer
  const summary = useMemo(() => {
    let totalFollowers = 0
    let totalViews = 0
    let totalCost = 0
    let costCount = 0

    for (const c of filteredCreators) {
      if (c.followers) totalFollowers += c.followers
      if (c.views) totalViews += c.views
      if (c.estCost) {
        totalCost += c.estCost
        costCount += 1
      }
    }

    const avgCost = costCount > 0 ? Math.round(totalCost / costCount) : 0

    return {
      count: filteredCreators.length,
      totalFollowers,
      totalViews,
      avgCost,
    }
  }, [filteredCreators])

  // 6. Selection Handlers
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

  const handleBatchStatus = async (
    newStatus: 'collected' | 'in_outreach' | 'negotiating' | 'contracted' | 'declined'
  ) => {
    if (selectedIds.size === 0) return
    await batchUpdateStatus({
      ids: Array.from(selectedIds),
      status: newStatus,
    })
    setSelectedIds(new Set())
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      await removeCreator({ id })
    }
    setSelectedIds(new Set())
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <CrmHeader
        title="Creators"
        count={creators.length}
        primaryActionLabel="New Creator"
        onPrimaryAction={() => setIsNewModalOpen(true)}
        onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
        filterActive={filterPlatform !== 'all' || filterStatus !== 'all' || Boolean(searchQuery)}
      />

      {/* Filter / Search Tray */}
      {isFilterOpen && (
        <div className="px-6 py-3 bg-card/50 border-b border-border/60 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 w-60">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search name, email, niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Platform:</span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              aria-label="Filter by platform"
              className="h-8 bg-background border border-input rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter / X</option>
              <option value="substack">Substack</option>
              <option value="twitch">Twitch</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
              className="h-8 bg-background border border-input rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="collected">Collected</option>
              <option value="in_outreach">In Outreach</option>
              <option value="negotiating">Negotiating</option>
              <option value="contracted">Contracted</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {(searchQuery || filterPlatform !== 'all' || filterStatus !== 'all') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilterPlatform('all')
                setFilterStatus('all')
              }}
              className="text-muted-foreground hover:text-foreground ml-auto text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Main Table Container using shadcn Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/60">
                {/* Checkbox */}
                <TableHead className="w-10 px-3 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    aria-label={selectedIds.size > 0 && selectedIds.size === filteredCreators.length ? "Deselect all creators" : "Select all creators"}
                    className="text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredCreators.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </TableHead>

                {/* Name */}
                <TableHead
                  onClick={() => toggleSort('name')}
                  className="px-3 min-w-[180px] cursor-pointer hover:text-foreground font-semibold text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Name</span>
                    {sortField === 'name' && (
                      <span className="text-[10px] text-primary">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>

                {/* Status */}
                <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Status</span>
                  </div>
                </TableHead>

                {/* Platform */}
                <TableHead className="px-3 min-w-[110px] font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Platform</span>
                  </div>
                </TableHead>

                {/* Email */}
                <TableHead className="px-3 min-w-[190px] font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Email</span>
                  </div>
                </TableHead>

                {/* Country */}
                <TableHead className="px-3 min-w-[90px] font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Country</span>
                  </div>
                </TableHead>

                {/* Followers */}
                <TableHead
                  onClick={() => toggleSort('followers')}
                  className="px-3 min-w-[110px] cursor-pointer hover:text-foreground font-semibold text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Followers</span>
                    {sortField === 'followers' && (
                      <span className="text-[10px] text-primary">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>

                {/* Views */}
                <TableHead
                  onClick={() => toggleSort('views')}
                  className="px-3 min-w-[100px] cursor-pointer hover:text-foreground font-semibold text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Views</span>
                    {sortField === 'views' && (
                      <span className="text-[10px] text-primary">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>

                {/* Engagement */}
                <TableHead className="px-3 min-w-[100px] font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Engage</span>
                  </div>
                </TableHead>

                {/* Est. Cost */}
                <TableHead
                  onClick={() => toggleSort('estCost')}
                  className="px-3 min-w-[100px] cursor-pointer hover:text-foreground font-semibold text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Est. Cost</span>
                    {sortField === 'estCost' && (
                      <span className="text-[10px] text-primary">
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            {/* Table Rows */}
            <TableBody>
              {filteredCreators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    No creators found. Add your first creator using &quot;New Creator&quot; above.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreators.map((creator) => {
                  const isSelected = selectedIds.has(creator._id)

                  return (
                    <TableRow
                      key={creator._id}
                      onClick={() => setDrawerCreator(creator)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <TableCell
                        onClick={(e) => handleToggleSelectRow(creator._id, e)}
                        className="px-3 text-center"
                      >
                        <button
                          type="button"
                          aria-label={isSelected ? `Deselect ${creator.name}` : `Select ${creator.name}`}
                          className="text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </TableCell>

                      {/* Name + Avatar Badge */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <AvatarInitial name={creator.name} />
                          <span className="font-medium text-foreground truncate">
                            {creator.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-3">
                        <StatusBadge status={creator.status} />
                      </TableCell>

                      {/* Platform */}
                      <TableCell className="px-3">
                        <PlatformBadge platform={creator.platform} />
                      </TableCell>

                      {/* Email */}
                      <TableCell className="px-3 text-muted-foreground font-mono text-[11px] truncate">
                        {creator.email}
                      </TableCell>

                      {/* Country */}
                      <TableCell className="px-3 text-muted-foreground text-xs">
                        {creator.country || '—'}
                      </TableCell>

                      {/* Followers */}
                      <TableCell className="px-3 font-mono text-xs text-foreground">
                        {creator.followers ? creator.followers.toLocaleString() : '—'}
                      </TableCell>

                      {/* Views */}
                      <TableCell className="px-3 font-mono text-xs text-foreground">
                        {creator.views ? creator.views.toLocaleString() : '—'}
                      </TableCell>

                      {/* Engagement */}
                      <TableCell className="px-3 text-xs text-muted-foreground">
                        {creator.engagementRate || '—'}
                      </TableCell>

                      {/* Est. Cost */}
                      <TableCell className="px-3 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {creator.estCost ? `$${creator.estCost.toLocaleString()}` : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>

            {/* Calculations Summary Footer */}
            <TableFooter className="bg-muted/40 font-mono text-xs border-t border-border/60">
              <TableRow>
                <TableCell className="px-3 text-center text-muted-foreground">Σ</TableCell>
                <TableCell className="px-3 text-muted-foreground">{summary.count} creators</TableCell>
                <TableCell className="px-3"></TableCell>
                <TableCell className="px-3"></TableCell>
                <TableCell className="px-3"></TableCell>
                <TableCell className="px-3"></TableCell>
                <TableCell className="px-3 text-foreground font-semibold">
                  {summary.totalFollowers > 0 ? summary.totalFollowers.toLocaleString() : '—'}
                </TableCell>
                <TableCell className="px-3 text-foreground font-semibold">
                  {summary.totalViews > 0 ? summary.totalViews.toLocaleString() : '—'}
                </TableCell>
                <TableCell className="px-3"></TableCell>
                <TableCell className="px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {summary.avgCost > 0 ? `Avg $${summary.avgCost.toLocaleString()}` : '—'}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-card border border-border shadow-xl rounded-xl flex items-center gap-4 text-xs z-30 animate-in fade-in slide-in-from-bottom-2">
          <Badge variant="default" className="font-medium">
            {selectedIds.size} creator{selectedIds.size > 1 ? 's' : ''} selected
          </Badge>

          <div className="h-4 w-px bg-border" />

          {/* Quick status change */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Set Status:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBatchStatus('in_outreach')}
              className="h-7 text-xs"
            >
              Outreach
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBatchStatus('contracted')}
              className="h-7 text-xs"
            >
              Contracted
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            className="h-7 text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
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

      {/* Creator Detail Dossier Drawer */}
      <CreatorDrawer
        creator={drawerCreator}
        isOpen={Boolean(drawerCreator)}
        onClose={() => setDrawerCreator(null)}
        onLaunchOutreach={onLaunchOutreach}
      />

      {/* New Creator Modal */}
      <NewCreatorModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  )
}
