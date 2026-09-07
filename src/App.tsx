import React, { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { Navbar } from './components/Navbar'
import { CampaignMetrics } from './components/CampaignMetrics'
import { PipelineBoard } from './components/PipelineBoard'
import { ThreadDrawer } from './components/ThreadDrawer'
import { ResearchModal } from './components/ResearchModal'
import { CampaignSettingsModal } from './components/CampaignSettingsModal'
import type { EnrichedThread, PipelineStage } from './types'

export const App: React.FC = () => {
  // 1. Convex Realtime Live Subscriptions
  const campaigns = useQuery(api.campaigns.list)
  const activeCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null
  const campaignId = activeCampaign?._id ?? null

  const metrics = useQuery(api.campaigns.getMetrics, { campaignId: campaignId ?? undefined })
  const rawThreads = useQuery(api.threads.listByCampaign, { campaignId: campaignId ?? undefined })

  // 2. Modals and Drawers State
  const [selectedThreadId, setSelectedThreadId] = useState<Id<'threads'> | null>(null)
  const [isResearchOpen, setIsResearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSimulatingGlobal, setIsSimulatingGlobal] = useState(false)

  // 3. Selected Thread Details (Live Subscription)
  const selectedThreadData = useQuery(
    api.threads.get,
    selectedThreadId ? { id: selectedThreadId } : 'skip'
  )

  // 4. Mutations and Actions
  const approveDraftMutation = useMutation(api.threads.approveDraftCounter)
  const submitHumanMessageMutation = useMutation(api.threads.submitHumanMessage)
  const updateCampaignMutation = useMutation(api.campaigns.update)
  const researchAndPitchAction = useAction(api.pipeline.autonomousResearchAndPitch)
  const processInboundWithAgentAction = useAction(api.agent.processInboundWithAgent)

  // 5. Derived State during Render (React Best Practice: Zero setState in useEffect)
  const threads: EnrichedThread[] = rawThreads ?? []

  // 6. Event Handlers
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

  // Quick simulation trigger for judges from the navbar
  const handleGlobalSimulateReply = async () => {
    if (threads.length === 0) return
    setIsSimulatingGlobal(true)

    try {
      // Pick negotiating thread or pitched thread
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar
        onOpenResearch={() => setIsResearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSimulateReply={handleGlobalSimulateReply}
        isSimulating={isSimulatingGlobal}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Campaign Brief & Live Analytics */}
        <CampaignMetrics
          campaign={activeCampaign}
          metrics={metrics ?? null}
        />

        {/* Real-time CRM Pipeline Kanban */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Autonomous Creator Pipeline
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Live updates synced across clients via Convex WebSockets
            </span>
          </div>

          <PipelineBoard
            threads={threads}
            onSelectThread={(id) => setSelectedThreadId(id)}
            onApproveCounter={handleApproveCounter}
            onSimulateReply={(id) => {
              setSelectedThreadId(id)
            }}
          />
        </div>
      </main>

      {/* Live Thread Drawer */}
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
          await updateCampaignMutation(params)
        }}
      />
    </div>
  )
}
