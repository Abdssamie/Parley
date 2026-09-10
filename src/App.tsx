import React, { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id, Doc } from '../convex/_generated/dataModel'
import { AppSidebar, type AppNavView } from './components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar'
import { Separator } from './components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb'
import { Button } from './components/ui/button'
import { CreatorsView } from './components/crm/creators/CreatorsView'
import { CampaignsView } from './components/crm/campaigns/CampaignsView'
import { DashboardOverview } from './components/DashboardOverview'
import { NewCampaignModal } from './components/crm/campaigns/NewCampaignModal'
import { NewCreatorModal } from './components/crm/creators/NewCreatorModal'
import { PipelineBoard } from './components/PipelineBoard'
import { Badge } from './components/ui/badge'
import { ThreadDrawer } from './components/ThreadDrawer'
import { ResearchModal } from './components/ResearchModal'
import { CampaignSettingsModal } from './components/CampaignSettingsModal'
import { TemplatesView } from './components/templates/TemplatesView'
import type { EnrichedThread, PipelineStage } from './types'
import { Plus, Settings as SettingsIcon, Sun, Moon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { useTheme } from './hooks/useTheme'

export interface AppProps {
  initialView?: AppNavView
}

export const App: React.FC<AppProps> = ({ initialView = 'dashboard' }) => {
  // 1. Navigation View State
  const [currentView, setCurrentView] = useState<AppNavView>(initialView)
  const navigate = useNavigate()

  // Theme toggle
  const { theme, toggleTheme } = useTheme()

  // Selected campaign state — single source of truth across all views
  const [selectedCampaignId, setSelectedCampaignId] = useState<Id<'campaigns'> | null>(null)

  const handleSelectView = (view: AppNavView) => {
    setCurrentView(view)
    switch (view) {
      case 'dashboard':
        void navigate({ to: '/dashboard' })
        break
      case 'campaigns':
        void navigate({ to: '/campaigns' })
        break
      case 'creators':
        void navigate({ to: '/creators' })
        break
      case 'pipeline':
        void navigate({ to: '/pipeline' })
        break
      case 'templates':
        void navigate({ to: '/templates' })
        break
      case 'settings':
        break
    }
  }

  // Handler: select a campaign and navigate to its pipeline
  const handleSelectCampaign = (campaign: Doc<'campaigns'>) => {
    setSelectedCampaignId(campaign._id)
    setCurrentView('pipeline')
    void navigate({ to: '/pipeline' })
  }

  // 2. Convex Realtime Live Subscriptions
  const campaigns = useQuery(api.campaigns.list, {})
  const creators = useQuery(api.creators.list, {})

  // Resolved active campaign: prefer selected, fall back to first campaign when campaigns load
  const activeCampaign =
    campaigns && campaigns.length > 0
      ? (campaigns.find((c) => c._id === selectedCampaignId) ?? campaigns[0])
      : null

  const campaignId: Id<'campaigns'> | null = activeCampaign?._id ?? null

  const metrics = useQuery(api.campaigns.getMetrics, { campaignId: campaignId ?? undefined })
  const rawThreads = useQuery(api.threads.listByCampaign, { campaignId: campaignId ?? undefined })
  const emailTemplates = useQuery(api.emailTemplates.list, {})

  // 3. Modals and Drawers State
  const [selectedThreadId, setSelectedThreadId] = useState<Id<'threads'> | null>(null)
  const [isResearchOpen, setIsResearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false)
  const [isNewCreatorOpen, setIsNewCreatorOpen] = useState(false)

  // 4. Selected Thread Details (Live Subscription)
  const selectedThreadData = useQuery(
    api.threads.get,
    selectedThreadId ? { id: selectedThreadId } : 'skip'
  )

  // 5. Mutations and Actions
  const approveDraftMutation = useMutation(api.threads.approveDraftCounter)
  const walkAwayMutation = useMutation(api.threads.walkAwayThread)
  const submitHumanMessageMutation = useMutation(api.threads.submitHumanMessage)
  const updateCampaignMutation = useMutation(api.campaigns.update)
  const setAutonomyModeMutation = useMutation(api.campaigns.setAutonomyMode)
  const researchAndPitchAction = useAction(api.pipeline.autonomousResearchAndPitch)
  const scrapeLeadsAction = useAction(api.pipeline.scrapeLeadsForCampaign)
  const scrapeLeadFromUrlAction = useAction(api.pipeline.scrapeLeadFromUrl)
  const processInboundReplyAction = useAction(api.pipeline.processInboundReply)

  // 6. Derived State during Render
  const threads: EnrichedThread[] = rawThreads ?? []

  // 7. Event Handlers
  const handleApproveCounter = async (threadId: Id<'threads'>) => {
    try {
      await approveDraftMutation({ threadId })
    } catch (err) {
      console.error('Failed to approve counter offer:', err)
    }
  }

  const handleWalkAway = async (threadId: Id<'threads'>) => {
    try {
      await walkAwayMutation({ threadId })
    } catch (err) {
      console.error('Failed to walk away from thread:', err)
    }
  }

  const handleToggleAutonomyMode = async () => {
    if (!campaignId || !activeCampaign) return
    const nextMode =
      activeCampaign.autonomyMode === 'full_autonomy'
        ? 'human_in_the_loop'
        : 'full_autonomy'
    try {
      await setAutonomyModeMutation({
        campaignId,
        autonomyMode: nextMode,
      })
    } catch (err) {
      console.error('Failed to toggle autonomy mode:', err)
    }
  }

  const handleSubmitHumanMessage = async (params: {
    threadId: Id<'threads'>
    subject: string
    body: string
    proposedFee?: number
    stage?: PipelineStage
  }) => {
    try {
      await submitHumanMessageMutation({
        threadId: params.threadId,
        subject: params.subject,
        body: params.body,
        proposedFee: params.proposedFee,
        stage: params.stage,
      })
    } catch (err) {
      console.error('Failed to submit manual message:', err)
    }
  }

  const handleScrapeLeads = async (cId: Id<'campaigns'>, maxLeads: number) => {
    return await scrapeLeadsAction({ campaignId: cId, maxLeads })
  }

  const handleScrapeUrl = async (cId: Id<'campaigns'>, creatorUrl: string) => {
    return await scrapeLeadFromUrlAction({ campaignId: cId, creatorUrl })
  }

  const handleSimulateCreatorReply = async (params: {
    threadId: Id<'threads'>
    incomingBody: string
  }) => {
    await processInboundReplyAction({
      threadId: params.threadId,
      incomingBody: params.incomingBody,
    })
  }

  const handleLaunchOutreachForCreator = async (creator: Doc<'creators'>) => {
    if (!campaignId) return
    try {
      const res = await researchAndPitchAction({
        campaignId,
        creatorUrl: creator.bioLink,
      })
      if (res && res.threadId) {
        setSelectedThreadId(res.threadId)
      }
      setCurrentView('pipeline')
    } catch (err) {
      console.error('Failed to launch outreach:', err)
    }
  }



  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        creatorsCount={creators?.length ?? 0}
        campaignsCount={campaigns?.length ?? 0}
        threadsCount={threads.length}
        templatesCount={emailTemplates?.length ?? 0}
        onOpenResearch={() => setIsResearchOpen(true)}
      />

      <SidebarInset className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
        {/* Persistent Single Top Navigation Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 bg-background/95 backdrop-blur-sm z-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <BreadcrumbLink
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSelectView('dashboard')}
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-sm">
                    {currentView === 'dashboard' && 'Executive Overview'}
                    {currentView === 'campaigns' && 'Campaigns'}
                    {currentView === 'creators' && 'Creators CRM'}
                    {currentView === 'pipeline' && 'Autonomous Negotiation Pipeline'}
                    {currentView === 'templates' && 'Email Templates'}
                    {currentView === 'settings' && 'Workspace Settings'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            {/* Campaign switcher: visible on pipeline & settings where campaign context matters */}
            {(currentView === 'pipeline' || currentView === 'settings') &&
              campaigns &&
              campaigns.length > 1 && (
                <Select
                  value={campaignId ?? ''}
                  onValueChange={(id) => setSelectedCampaignId(id as Id<'campaigns'>)}
                >
                  <SelectTrigger className="h-8 text-xs w-[180px] shadow-xs">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c._id} value={c._id} className="text-xs">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

            {/* Dark / Light theme toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="size-8 shadow-xs"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </Button>
          </div>
        </header>

        {/* Dynamic Main View */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
          {currentView === 'dashboard' && (
            <DashboardOverview
              onNavigate={(v) => setCurrentView(v)}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onOpenNewCreator={() => setIsNewCreatorOpen(true)}
              onSelectCampaign={handleSelectCampaign}
            />
          )}

          {currentView === 'campaigns' && (
            <CampaignsView
              onSelectCampaign={handleSelectCampaign}
            />
          )}

          {currentView === 'creators' && (
            <CreatorsView onLaunchOutreach={handleLaunchOutreachForCreator} />
          )}

          {currentView === 'pipeline' && (
            <div className="space-y-3">
              {/* Compact Executive Pipeline Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm font-bold text-foreground truncate">
                        {activeCampaign?.title ?? 'Campaign Workspace'}
                      </h1>
                      <Badge variant="outline" className="text-[10px] font-medium border-border">
                        {activeCampaign?.targetNiche ?? 'Tech'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      Deliverables: {activeCampaign?.deliverableRequirements ?? '1 Video + 1 Post'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Compact inline budget metrics */}
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block font-medium">Committed Spend</span>
                    <span className="text-xs font-semibold text-foreground">
                      ${(metrics?.totalCommittedSpend ?? 0).toLocaleString()} / ${(activeCampaign?.budget ?? 2000).toLocaleString()}
                    </span>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Autonomy Mode Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAutonomyMode}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors ${
                      activeCampaign?.autonomyMode === 'full_autonomy'
                        ? 'border-border bg-secondary text-foreground'
                        : 'border-border/80 bg-background text-foreground hover:bg-secondary'
                    }`}
                    title="Toggle Autonomy Mode"
                  >
                    {activeCampaign?.autonomyMode === 'full_autonomy' ? 'Full Autonomy' : 'Human-in-the-Loop'}
                  </button>

                  <Button
                    size="sm"
                    onClick={() => setIsResearchOpen(true)}
                    className="h-8 text-xs flex items-center gap-1.5 shadow-xs font-medium"
                  >
                    <Plus className="size-3.5" />
                    <span>Find & Pitch</span>
                  </Button>
                </div>
              </div>

              {/* Kanban Board - FIRST THING */}
              <PipelineBoard
                threads={threads}
                campaignId={campaignId}
                campaignBudget={activeCampaign?.budget ?? 2000}
                onSelectThread={(id) => setSelectedThreadId(id)}
                onApproveCounter={handleApproveCounter}
              />
            </div>
          )}

          {currentView === 'templates' && (
            <TemplatesView onOpenResearch={() => setIsResearchOpen(true)} />
          )}

          {currentView === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <SettingsIcon className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Workspace Settings</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage campaign target niche, deliverables, allocated budget, and autonomous negotiation parameters.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                Configure Active Campaign
              </Button>
            </div>
          )}
        </main>
      </SidebarInset>

      {/* Live Thread Detail & Negotiation Drawer */}
      <ThreadDrawer
        threadId={selectedThreadId}
        thread={selectedThreadData ?? null}
        isOpen={Boolean(selectedThreadId)}
        onClose={() => setSelectedThreadId(null)}
        onApproveCounter={handleApproveCounter}
        onSubmitHumanMessage={handleSubmitHumanMessage}
        onSimulateCreatorReply={handleSimulateCreatorReply}
        onWalkAway={handleWalkAway}
      />

      {/* Find Leads Modal */}
      <ResearchModal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        campaignId={campaignId}
        onScrapeLeads={handleScrapeLeads}
        onScrapeUrl={handleScrapeUrl}
      />

      {/* Campaign Settings Modal */}
      <CampaignSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        campaign={activeCampaign}
        onUpdateCampaign={async (params) => {
          await updateCampaignMutation({
            id: params.id,
            title: params.title,
            budget: params.budget,
            targetNiche: params.targetNiche,
            deliverableRequirements: params.deliverableRequirements,
          })
        }}
      />

      {/* New Campaign Modal for Dashboard quick action */}
      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
      />

      {/* Add Creator Modal — shared between Dashboard and Creators page */}
      <NewCreatorModal
        isOpen={isNewCreatorOpen}
        onClose={() => setIsNewCreatorOpen(false)}
      />
    </SidebarProvider>
  )
}

export default App

