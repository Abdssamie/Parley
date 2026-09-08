import * as React from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { TemplateEditorView } from "@/components/templates/TemplateEditorView"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export const TemplatePage: React.FC = () => {
  const params = useParams({ strict: false }) as { templateId?: string }
  const templateId = params.templateId
  const navigate = useNavigate()

  const isNew = !templateId || templateId === "new"

  // Fetch template data if editing existing
  const template = useQuery(
    api.emailTemplates.get,
    isNew ? "skip" : { id: templateId as Id<"emailTemplates"> }
  )

  // Fetch workspace data for preview simulation
  const creators = useQuery(api.creators.list, {}) || []
  const campaigns = useQuery(api.campaigns.list, {}) || []
  const session = authClient.useSession()
  const currentUser = session.data?.user

  // Handle back navigation explicitly to /templates
  const handleBack = () => {
    void navigate({ to: "/templates" })
  }

  if (!isNew && template === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading template...</span>
        </div>
      </div>
    )
  }

  if (!isNew && template === null) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm font-semibold text-foreground">Template not found.</p>
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950"
        >
          Back to templates
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-8">
      <TemplateEditorView
        key={template?._id ?? "new"}
        template={isNew ? null : (template ?? null)}
        onBack={handleBack}
        creators={creators}
        campaigns={campaigns}
        currentUser={currentUser}
      />
    </div>
  )
}
