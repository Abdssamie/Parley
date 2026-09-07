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
  ChevronDown,
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0c0d10] text-slate-200">
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
        <div className="px-6 py-2.5 bg-[#12141a] border-b border-[#22252e] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171922] border border-[#272b38] rounded-md">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none w-48 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Platform:</span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="bg-[#171922] border border-[#272b38] rounded-md px-2 py-1 text-slate-200 focus:outline-none"
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
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#171922] border border-[#272b38] rounded-md px-2 py-1 text-slate-200 focus:outline-none"
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
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterPlatform('all')
                setFilterStatus('all')
              }}
              className="text-slate-400 hover:text-slate-200 underline ml-auto text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse select-none">
          {/* Table Header Row */}
          <thead className="sticky top-0 z-10 bg-[#13151b] border-b border-[#22252e] text-slate-400 font-medium text-[11px]">
            <tr className="h-9">
              {/* Checkbox */}
              <th className="w-10 px-3 text-center border-r border-[#1c1f26]">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-slate-400 hover:text-slate-200 flex items-center justify-center w-full"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredCreators.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>

              {/* Name */}
              <th
                onClick={() => toggleSort('name')}
                className="px-3 min-w-[180px] border-r border-[#1c1f26] cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Name</span>
                  {sortField === 'name' && (
                    <span className="text-[10px] text-pink-400">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>

              {/* Status */}
              <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Status</span>
                </div>
              </th>

              {/* Platform */}
              <th className="px-3 min-w-[110px] border-r border-[#1c1f26]">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Platform</span>
                </div>
              </th>

              {/* Email */}
              <th className="px-3 min-w-[190px] border-r border-[#1c1f26]">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </div>
              </th>

              {/* Country */}
              <th className="px-3 min-w-[90px] border-r border-[#1c1f26]">
                <div className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Country</span>
                </div>
              </th>

              {/* Followers */}
              <th
                onClick={() => toggleSort('followers')}
                className="px-3 min-w-[110px] border-r border-[#1c1f26] cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Followers</span>
                  {sortField === 'followers' && (
                    <span className="text-[10px] text-pink-400">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>

              {/* Views */}
              <th
                onClick={() => toggleSort('views')}
                className="px-3 min-w-[100px] border-r border-[#1c1f26] cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Views</span>
                  {sortField === 'views' && (
                    <span className="text-[10px] text-pink-400">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>

              {/* Engagement */}
              <th className="px-3 min-w-[100px] border-r border-[#1c1f26]">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Engage...</span>
                </div>
              </th>

              {/* Est. Cost */}
              <th
                onClick={() => toggleSort('estCost')}
                className="px-3 min-w-[100px] cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Est. Cost</span>
                  {sortField === 'estCost' && (
                    <span className="text-[10px] text-pink-400">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Rows */}
          <tbody className="divide-y divide-[#1c1f26]">
            {filteredCreators.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                  No creators found. Add your first creator using &quot;New Creator&quot; above.
                </td>
              </tr>
            ) : (
              filteredCreators.map((creator) => {
                const isSelected = selectedIds.has(creator._id)

                return (
                  <tr
                    key={creator._id}
                    onClick={() => setDrawerCreator(creator)}
                    className={`h-9 hover:bg-[#141720] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#181c26]' : ''
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td
                      onClick={(e) => handleToggleSelectRow(creator._id, e)}
                      className="px-3 text-center border-r border-[#1c1f26]"
                    >
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-300 flex items-center justify-center w-full"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-pink-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* Name + Avatar Badge */}
                    <td className="px-3 border-r border-[#1c1f26]">
                      <div className="flex items-center gap-2">
                        <AvatarInitial name={creator.name} />
                        <span className="font-medium text-slate-200 hover:text-white truncate">
                          {creator.name}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 border-r border-[#1c1f26]">
                      <StatusBadge status={creator.status} />
                    </td>

                    {/* Platform */}
                    <td className="px-3 border-r border-[#1c1f26]">
                      <PlatformBadge platform={creator.platform} />
                    </td>

                    {/* Email */}
                    <td className="px-3 border-r border-[#1c1f26] text-slate-400 font-mono text-[11px] truncate">
                      {creator.email}
                    </td>

                    {/* Country */}
                    <td className="px-3 border-r border-[#1c1f26] text-slate-400">
                      {creator.country || '—'}
                    </td>

                    {/* Followers */}
                    <td className="px-3 border-r border-[#1c1f26] text-slate-300 font-medium">
                      {creator.followers ? creator.followers.toLocaleString() : '—'}
                    </td>

                    {/* Views */}
                    <td className="px-3 border-r border-[#1c1f26] text-slate-300 font-medium">
                      {creator.views ? creator.views.toLocaleString() : '—'}
                    </td>

                    {/* Engagement Rate */}
                    <td className="px-3 border-r border-[#1c1f26] text-slate-400">
                      {creator.engagementRate ? `${creator.engagementRate}%` : '—'}
                    </td>

                    {/* Est. Cost */}
                    <td className="px-3 text-slate-300 font-medium">
                      {creator.estCost ? `$${creator.estCost.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {/* Table Calculate Summary Footer (matches screenshot) */}
          <tfoot className="sticky bottom-0 bg-[#12141a] border-t border-[#22252e] text-[11px] text-slate-400 font-medium">
            <tr className="h-9">
              <td className="px-3 border-r border-[#1c1f26]"></td>
              <td className="px-3 border-r border-[#1c1f26]">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-white text-slate-400"
                >
                  <span>Calculate</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </td>
              <td className="px-3 border-r border-[#1c1f26]">{summary.count} creators</td>
              <td className="px-3 border-r border-[#1c1f26]"></td>
              <td className="px-3 border-r border-[#1c1f26]"></td>
              <td className="px-3 border-r border-[#1c1f26]"></td>
              <td className="px-3 border-r border-[#1c1f26] text-slate-300">
                {summary.totalFollowers > 0 ? summary.totalFollowers.toLocaleString() : '—'}
              </td>
              <td className="px-3 border-r border-[#1c1f26] text-slate-300">
                {summary.totalViews > 0 ? summary.totalViews.toLocaleString() : '—'}
              </td>
              <td className="px-3 border-r border-[#1c1f26]"></td>
              <td className="px-3 text-slate-300">
                {summary.avgCost > 0 ? `Avg $${summary.avgCost.toLocaleString()}` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Floating Bulk Actions Bar (matches Notion/Airtable UX) */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[#171a22] border border-[#2d3240] rounded-xl shadow-2xl flex items-center gap-4 text-xs z-30 animate-in fade-in slide-in-from-bottom-2">
          <span className="font-medium text-pink-400">
            {selectedIds.size} creator{selectedIds.size > 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          {/* Quick status change */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Set Status:</span>
            <button
              type="button"
              onClick={() => handleBatchStatus('in_outreach')}
              className="px-2 py-1 bg-blue-950/40 text-blue-400 border border-blue-800/40 rounded hover:bg-blue-900/40"
            >
              Outreach
            </button>
            <button
              type="button"
              onClick={() => handleBatchStatus('contracted')}
              className="px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded hover:bg-emerald-900/40"
            >
              Contracted
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={handleBatchDelete}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
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
