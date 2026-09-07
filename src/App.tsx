import React, { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id, Doc } from '../convex/_generated/dataModel'
import { Sidebar, type NavView } from './components/layout/Sidebar'
import { CreatorsView } from './components/crm/creators/CreatorsView'
import { CampaignsView } from './components/crm/campaigns/CampaignsView'
import { PipelineBoard } from './components/PipelineBoard'
import { CampaignMetrics } from './components/CampaignMetrics'
import { ThreadDrawer } from './components/ThreadDrawer'
import { ResearchModal } from './components/ResearchModal'
import { CampaignSettingsModal } from './components/CampaignSettingsModal'
import type { EnrichedThread, PipelineStage } from './types'
import { Bot, Zap, Plus } from 'lucide-react'

export const App: React.FC = () => {
  // 1. Navigation View State
  const [currentView, setCurrentView] = useState<NavView>('creators')

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
      setCurrentView('deals')
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
    <div className="flex h-screen bg-[#0c0d10] text-slate-100 overflow-hidden font-sans">
      {/* Persistent Workspace Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        creatorsCount={creators?.length ?? 0}
        campaignsCount={campaigns?.length ?? 0}
        threadsCount={threads.length}
        onOpenNewChat={() => setIsResearchOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {currentView === 'creators' && (
          <CreatorsView onLaunchOutreach={handleLaunchOutreachForCreator} />
        )}

        {currentView === 'campaigns' && (
          <CampaignsView
            onSelectCampaign={() => {
              setCurrentView('deals')
            }}
          />
        )}

        {(currentView === 'deals' || currentView === 'dashboard') && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-[#0c0d10]">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22252e] pb-4">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <span>Autonomous Sponsorship Pipeline</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Powered by <span className="text-indigo-400 font-medium">@convex-dev/agent</span> +{' '}
                  <span className="text-pink-400 font-medium">Firecrawl</span> +{' '}
                  <span className="text-emerald-400 font-medium">AgentMail</span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleGlobalSimulateReply}
                  disabled={isSimulatingGlobal || threads.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1d2028] hover:bg-[#252934] border border-[#2e3342] text-slate-200 font-medium transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSimulatingGlobal ? 'animate-spin' : ''}`} />
                  <span>Simulate Creator Reply</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsResearchOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-medium shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Research & Pitch</span>
                </button>
              </div>
            </div>

            {/* Campaign Metrics Overview */}
            <CampaignMetrics campaign={activeCampaign} metrics={metrics ?? null} />

            {/* Live Pipeline Kanban Board */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Live Stage Negotiation Pipeline</span>
                <span className="text-slate-500 font-mono">Convex WebSocket Reactive Sync</span>
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
          <div className="p-8 space-y-4 max-w-2xl text-xs">
            <h2 className="text-base font-bold text-white">Workspace Settings</h2>
            <p className="text-slate-400">
              Manage campaign parameters, budget caps, and autonomous agent rules.
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-[#1c202a] text-slate-200 border border-[#2b3040] rounded-md hover:bg-[#242936]"
            >
              Open Campaign Configuration
            </button>
          </div>
        )}
      </main>

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
    </div>
  )
}
export default App
