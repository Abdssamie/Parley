import type { FunctionReturnType } from 'convex/server'
import type { api } from '../convex/_generated/api'

export type PipelineStage =
  | 'discovered'
  | 'pitched'
  | 'negotiating'
  | 'review_required'
  | 'accepted'
  | 'declined'
  | 'ghosted'

export type ThreadDetail = FunctionReturnType<typeof api.threads.get>
export type ThreadsList = FunctionReturnType<typeof api.threads.listByCampaign>
export type EnrichedThread = NonNullable<ThreadsList>[number]
