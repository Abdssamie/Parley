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
import { PipelineBoard } from './components/PipelineBoard'
import { CampaignMetrics } from './components/CampaignMetrics'
import { ThreadDrawer } from './components/ThreadDrawer'
import { ResearchModal } from './components/ResearchModal'
import { CampaignSettingsModal } from './components/CampaignSettingsModal'
import type { EnrichedThread, PipelineStage } from './types'
import { Zap, Plus, Sparkles, Settings as SettingsIcon } from 'lucide-react'

export const App: React.FC = () => {
  // 1. Navigation View State
  const [currentView, setCurrentView] = useState<AppNavView>('dashboard')

  // 2. Convex Realtime Live Subscriptions
  const campaigns = useQuery(api.campaigns.list, {})
  const creators = useQuery(api.creators.list, {})
  const activeCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null
  const campaignId = activeCampaign?._id ?? null

  const metrics = useQuery(api.campaigns.getMetrics, { campaignId: campaignId ?? undefined })
  const rawThreads = useQuery(api.threads.listByCampaign, { campaignId: campaignId ?? undefined })

  // 3. Modals and Drawers State
  const [selectedThreadId, setSelectedThreadId] = useState<Id<'threads'> | null>(null)
  const [isResearchOpen, setIsResearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false)
  const [isSimulatingGlobal, setIsSimulatingGlobal] = useState(false)

  // 4. Selected Thread Details (Live Subscription)
  const selectedThreadData = useQuery(
    api.threads.get,
    selectedThreadId ? { id: selectedThreadId } : 'skip'
  )

  // 5. Mutations and Actions
  const approveDraftMutation = useMutation(api.threads.approveDraftCounter)
  const submitHumanMessageMutation = useMutation(api.threads.submitHumanMessage)
  const updateCampaignMutation = useMutation(api.campaigns.update)
  const researchAndPitchAction = useAction(api.pipeline.autonomousResearchAndPitch)
  const processInboundWithAgentAction = useAction(api.agent.processInboundWithAgent)

  // 6. Derived State during Render (React Best Practice: zero setState in useEffect)
  const threads: EnrichedThread[] = rawThreads ?? []

  // 7. Event Handlers
  const handleApproveCounter = async (threadId: Id<'threads'>) => {
    try {
      await approveDraftMutation({ threadId })
    } catch (err) {
      console.error('Failed to approve counter offer:', err)
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

  const handleLaunchResearch = async (creatorUrl: string) => {
    if (!campaignId) return
    await researchAndPitchAction({
      campaignId,
      creatorUrl,
    })
  }

  const handleSimulateCreatorReply = async (params: {
    threadId: Id<'threads'>
    incomingBody: string
  }) => {
    await processInboundWithAgentAction({
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

  const handleGlobalSimulateReply = async () => {
    if (threads.length === 0) return
    setIsSimulatingGlobal(true)

    try {
      const candidate =
        threads.find((t) => t.stage === 'negotiating') ||
        threads.find((t) => t.stage === 'pitched') ||
        threads[0]

      if (candidate) {
        const testReplies = [
          `Hi team! Thanks for reaching out. We can definitely cover this in our upcoming deep dive. Our quote is $2,400 for the video and newsletter feature. Let us know!`,
          `Sounds like a fantastic product! We would be thrilled to do this for $1,650. Please send over the contract and tracking links.`,
          `Thanks for the proposal! We are interested in partnering. Can we do $2,200 with 1 YouTube segment + 2 social posts?`,
        ]
        const randomReply = testReplies[Math.floor(Math.random() * testReplies.length)]

        await processInboundWithAgentAction({
          threadId: candidate._id,
          incomingBody: randomReply,
        })
        setSelectedThreadId(candidate._id)
      }
    } catch (err) {
      console.error('Simulation error:', err)
    } finally {
      setIsSimulatingGlobal(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Official shadcn AppSidebar */}
      <AppSidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        creatorsCount={creators?.length ?? 0}
        campaignsCount={campaigns?.length ?? 0}
        threadsCount={threads.length}
        onOpenResearch={() => setIsResearchOpen(true)}
      />

      {/* Main Inset Layout with Claymorphic Theme */}
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
                    onClick={() => setCurrentView('dashboard')}
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
                    {currentView === 'settings' && 'Workspace Settings'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'pipeline' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGlobalSimulateReply}
                  disabled={isSimulatingGlobal || threads.length === 0}
                  className="flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <Zap className={`size-3.5 text-amber-500 ${isSimulatingGlobal ? 'animate-spin' : ''}`} />
                  <span>Simulate Reply</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsResearchOpen(true)}
                  className="flex items-center gap-1.5 text-xs shadow-xs font-medium"
                >
                  <Plus className="size-3.5" />
                  <span>Research & Pitch</span>
                </Button>
              </>
            )}

            {currentView !== 'pipeline' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResearchOpen(true)}
                className="flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Research & Pitch</span>
              </Button>
            )}
          </div>
        </header>

        {/* Dynamic Main View with Natural Page Padding & Scrolling */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
          {currentView === 'dashboard' && (
            <DashboardOverview
              onNavigate={(v) => setCurrentView(v)}
              onOpenResearch={() => setIsResearchOpen(true)}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onOpenNewCreator={() => setCurrentView('creators')}
              onSelectCampaign={() => setCurrentView('pipeline')}
            />
          )}

          {currentView === 'campaigns' && (
            <CampaignsView
              onSelectCampaign={() => {
                setCurrentView('pipeline')
              }}
            />
          )}

          {currentView === 'creators' && (
            <CreatorsView onLaunchOutreach={handleLaunchOutreachForCreator} />
          )}

          {currentView === 'pipeline' && (
            <div className="space-y-6">
              {/* Campaign Metrics Overview */}
              <CampaignMetrics campaign={activeCampaign} metrics={metrics ?? null} />

              {/* Live Pipeline Kanban Board */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Live Negotiation Stages</span>
                  <span className="text-muted-foreground font-mono text-[11px]">Convex WebSocket Sync</span>
                </div>

                <PipelineBoard
                  threads={threads}
                  onSelectThread={(id) => setSelectedThreadId(id)}
                  onApproveCounter={handleApproveCounter}
                  onSimulateReply={(id) => setSelectedThreadId(id)}
                />
              </div>
            </div>
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
      />

      {/* Research & Pitch Modal */}
      <ResearchModal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        campaignId={campaignId}
        onLaunchResearch={handleLaunchResearch}
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
    </SidebarProvider>
  )
}

export default App
