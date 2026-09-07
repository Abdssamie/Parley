import React from 'react'
import {
  LayoutGrid,
  Building,
  Users,
  Target,
  TrendingUp,
  CheckSquare,
  FileText,
  FileCheck,
  GitFork,
  Building2,
  UserCheck,
  Mail,
  Settings,
  BookOpen,
  Search,
  MessageSquare,
  Plus,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

export type NavView = 'creators' | 'campaigns' | 'deals' | 'dashboard' | 'settings'

interface SidebarProps {
  currentView: NavView
  onSelectView: (view: NavView) => void
  creatorsCount?: number
  campaignsCount?: number
  threadsCount?: number
  onOpenNewChat?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  creatorsCount = 0,
  campaignsCount = 0,
  threadsCount = 0,
  onOpenNewChat,
}) => {
  return (
    <aside className="w-64 bg-[#111215] border-r border-[#22242a] flex flex-col h-screen text-slate-300 select-none shrink-0">
      {/* Workspace Selector */}
      <div className="h-14 border-b border-[#22242a] flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-slate-100 tracking-tight">Bloomshine</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1c1f26] rounded-md transition-colors"
            title="Search (Ctrl + K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3 py-3 border-b border-[#22242a] flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={`p-1.5 rounded-md border transition-colors ${
            currentView === 'dashboard'
              ? 'bg-[#1c1f26] text-white border-slate-700'
              : 'border-[#22242a] text-slate-400 hover:text-slate-200 hover:bg-[#181a20]'
          }`}
          title="Dashboard"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectView('deals')}
          className="p-1.5 rounded-md border border-[#22242a] text-slate-400 hover:text-slate-200 hover:bg-[#181a20] transition-colors"
          title="Messages & Inbox"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onOpenNewChat}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#16181e] hover:bg-[#1d2028] border border-[#272a33] rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 text-xs">
        {/* Workspace Group */}
        <div>
          <div className="px-2 pb-1.5 font-medium text-[11px] text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectView('dashboard')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-[#1e222b] text-white font-medium'
                  : 'text-slate-300 hover:bg-[#16181e] hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Brands</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Brand</span>
            </button>

            {/* Creators Navigation Item (Primary) */}
            <button
              type="button"
              onClick={() => onSelectView('creators')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                currentView === 'creators'
                  ? 'bg-[#221c2b] text-white font-medium border border-pink-500/30'
                  : 'text-slate-300 hover:bg-[#16181e] hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${currentView === 'creators' ? 'text-pink-400' : 'text-pink-400/80'}`} />
                <span>Creators</span>
              </div>
              <div className="flex items-center gap-1.5">
                {creatorsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/20 text-pink-300">
                    {creatorsCount}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-normal">Creator</span>
              </div>
            </button>

            {/* Campaigns Navigation Item (Primary) */}
            <button
              type="button"
              onClick={() => onSelectView('campaigns')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                currentView === 'campaigns'
                  ? 'bg-[#2b1f1f] text-white font-medium border border-rose-500/30'
                  : 'text-slate-300 hover:bg-[#16181e] hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className={`w-4 h-4 ${currentView === 'campaigns' ? 'text-rose-400' : 'text-rose-400/80'}`} />
                <span>Campaigns</span>
              </div>
              <div className="flex items-center gap-1.5">
                {campaignsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300">
                    {campaignsCount}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-normal">Campaign</span>
              </div>
            </button>

            {/* Deals / Autonomous Pipeline Item */}
            <button
              type="button"
              onClick={() => onSelectView('deals')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                currentView === 'deals'
                  ? 'bg-[#2b2416] text-white font-medium border border-amber-500/30'
                  : 'text-slate-300 hover:bg-[#16181e] hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className={`w-4 h-4 ${currentView === 'deals' ? 'text-amber-400' : 'text-amber-400/80'}`} />
                <span>Deals</span>
              </div>
              <div className="flex items-center gap-1.5">
                {threadsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    {threadsCount}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-normal">Pipeline</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Tasks</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Task</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>PDF Templates</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-yellow-400" />
                <span>Contracts</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GitFork className="w-4 h-4 text-orange-400" />
                <span>Workflows</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90" />
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Companies</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>People</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Email Templates</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Other Group */}
        <div>
          <div className="px-2 pb-1.5 font-medium text-[11px] text-slate-400 uppercase tracking-wider">
            Other
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectView('settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                currentView === 'settings'
                  ? 'bg-[#1e222b] text-white font-medium'
                  : 'text-slate-400 hover:bg-[#16181e] hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <a
              href="https://convex.dev/docs"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-slate-400 hover:bg-[#16181e] hover:text-slate-200 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Documentation</span>
            </a>
          </nav>
        </div>
      </div>
    </aside>
  )
}
