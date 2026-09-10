import * as React from "react"
import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"
import {
  ArrowLeft,
  Pencil,
  Eye,
  MoreVertical,
  Smile,
  Check,
  Lightbulb,
  Copy,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VariablePicker } from "./VariablePicker"
import { FullPageTemplateEditor } from "./FullPageTemplateEditor"

const EMAIL_EMOJIS = ["👋", "🤝", "🚀", "🎯", "🔥", "✨", "💡", "📩", "📈", "⭐", "🎉", "💼"]

interface TemplateEditorViewProps {
  template: Doc<"emailTemplates"> | null
  onBack: () => void
  creators: Doc<"creators">[]
  campaigns: Doc<"campaigns">[]
  currentUser?: { name?: string | null; email?: string | null } | null
  initialFullPage?: boolean
}

export const TemplateEditorView: React.FC<TemplateEditorViewProps> = ({
  template,
  onBack,
  creators,
  campaigns,
  currentUser,
  initialFullPage = false,
}) => {
  // Mode: Overview Settings (Image 1) vs Dedicated Full-Page Content Editor (Image 0)
  const [isFullPageEditing, setIsFullPageEditing] = useState(initialFullPage)

  // Form fields
  const [name, setName] = useState(template?.name ?? "New template")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [status, setStatus] = useState<"active" | "inactive">(
    template?.status ?? "active"
  )
  const [category, setCategory] = useState<"pitch" | "negotiation" | "followup" | "contract">(
    template?.category ?? "pitch"
  )
  const [previewText, setPreviewText] = useState(
    template?.description ?? "Exclusive creator collaboration proposal"
  )
  const [senderName, setSenderName] = useState(
    currentUser?.name || "Abdessamie El Moubarki"
  )
  const [senderEmail, setSenderEmail] = useState(
    currentUser?.email || "partnerships@parley.app"
  )
  const [subject, setSubject] = useState(template?.subject ?? "")
  const [body, setBody] = useState(template?.body ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subjectInputRef = useRef<HTMLInputElement>(null)
  const previewTextInputRef = useRef<HTMLInputElement>(null)

  // Convex mutations
  const createMutation = useMutation(api.emailTemplates.create)
  const updateMutation = useMutation(api.emailTemplates.update)

  const insertSubjectToken = (token: string) => {
    if (!subjectInputRef.current) {
      setSubject((prev) => prev + token)
      return
    }
    const input = subjectInputRef.current
    const start = input.selectionStart ?? subject.length
    const end = input.selectionEnd ?? subject.length
    const next = subject.slice(0, start) + token + subject.slice(end)
    setSubject(next)
    requestAnimationFrame(() => {
      input.focus()
      const pos = start + token.length
      input.setSelectionRange(pos, pos)
    })
  }

  const insertPreviewToken = (token: string) => {
    if (!previewTextInputRef.current) {
      setPreviewText((prev) => prev + token)
      return
    }
    const input = previewTextInputRef.current
    const start = input.selectionStart ?? previewText.length
    const end = input.selectionEnd ?? previewText.length
    const next = previewText.slice(0, start) + token + previewText.slice(end)
    setPreviewText(next)
    requestAnimationFrame(() => {
      input.focus()
      const pos = start + token.length
      input.setSelectionRange(pos, pos)
    })
  }

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) return

    setIsSubmitting(true)
    try {
      if (template) {
        await updateMutation({
          id: template._id,
          name: name.trim(),
          category,
          status,
          description: previewText.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
        })
      } else {
        await createMutation({
          name: name.trim(),
          category,
          status,
          description: previewText.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
          isDefault: false,
        })
      }
      onBack()
    } catch (err) {
      console.error("Failed to save template:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If in dedicated full-page content editor mode (Image 0), take over full window
  if (isFullPageEditing) {
    return (
      <FullPageTemplateEditor
        name={name}
        onNameChange={setName}
        body={body}
        onBodyChange={setBody}
        subject={subject}
        onSaveAndQuit={async () => {
          await handleSave()
          setIsFullPageEditing(false)
        }}
        onQuit={() => setIsFullPageEditing(false)}
        creators={creators}
        campaigns={campaigns}
        senderName={senderName}
        senderEmail={senderEmail}
      />
    )
  }

  // Overview Settings Page (Matching Brevo Image 1)
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="size-9 rounded-full cursor-pointer hover:bg-muted"
            title="Back to templates"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                    autoFocus
                    className="h-8 text-base font-bold py-0 w-64"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(false)}
                    className="h-7 px-2"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {name || "New template"}
                  </h1>
                  <Pencil className="size-3.5 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </div>
              )}
            </div>

            {/* Status indicator pill */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setStatus((prev) => (prev === "active" ? "inactive" : "active"))
                }
                className="flex items-center gap-1.5 font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                title="Click to toggle status"
              >
                <span
                  className={`size-2 rounded-full ${
                    status === "active" ? "bg-emerald-500" : "bg-neutral-400"
                  }`}
                />
                <span className="capitalize">{status}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Right Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFullPageEditing(true)}
            className="rounded-full text-xs font-semibold gap-1.5 px-4 h-9 shadow-xs cursor-pointer"
          >
            <Eye className="size-3.5" />
            <span>Preview & test</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !name.trim() || !subject.trim() || !body.trim()}
            className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold px-5 h-9 shadow-xs cursor-pointer"
          >
            <span>{isSubmitting ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Two-Column Split Layout (Matching Brevo Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Content Preview Card with Edit button (Image 1) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
            {/* Header: Content title + Working 3-dots menu + Edit button */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Content</h2>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                      title="Content options"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setIsFullPageEditing(true)}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                      <span>Fullscreen Editor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void navigator.clipboard.writeText(body)
                      }}
                      className="cursor-pointer gap-2 text-xs"
                    >
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Copy body text</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setBody("")}
                      className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Clear body</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clicking Edit opens the Dedicated Full-Page Canvas (Image 0)! */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullPageEditing(true)}
                  className="rounded-xl text-xs font-semibold h-8 px-4 cursor-pointer shadow-xs border-border/80 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  Edit
                </Button>
              </div>
            </div>

            {/* Email Canvas Preview */}
            <div
              onClick={() => setIsFullPageEditing(true)}
              className="rounded-xl border border-border/70 bg-background p-6 min-h-[380px] flex flex-col justify-between shadow-xs cursor-pointer hover:border-primary/50 transition-colors group"
              title="Click to edit content in full-page mode"
            >
              <div className="space-y-4">
                {/* Brand Logo Placeholder (Like Brevo Image 1) */}
                <div className="flex items-center justify-center py-2">
                  <div className="w-24 h-9 rounded-md bg-muted/80 text-foreground font-bold flex items-center justify-center text-xs tracking-wider uppercase">
                    Parley
                  </div>
                </div>

                {/* Subject Header */}
                <div className="border-b border-border/50 pb-2 text-center">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    {subject || (
                      <span className="text-muted-foreground font-normal italic">
                        {"{{subject}}"}
                      </span>
                    )}
                  </h3>
                </div>

                {/* Body Content Snippet */}
                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans line-clamp-10">
                  {body || (
                    <span className="text-muted-foreground italic">
                      {"{{content}}"}
                    </span>
                  )}
                </div>
              </div>

              {/* Email Footer Note */}
              <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                This email was sent by {senderName}.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Metadata Form (Matching Brevo Image 1) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs">
            {/* Sender Email */}
            <div className="space-y-1.5">
              <Label htmlFor="sender-email" className="text-xs font-semibold text-foreground">
                Sender email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sender-email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="abdessamie.elmoubarki@moondesk.tech"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Sender Name */}
            <div className="space-y-1.5">
              <Label htmlFor="sender-name" className="text-xs font-semibold text-foreground">
                Sender name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Abdessamie El Moubarki"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Subject Line (Matching Brevo Image 1) */}
            <div className="space-y-1.5">
              <Label htmlFor="subject-line" className="text-xs font-semibold text-foreground">
                Subject line <span className="text-destructive">*</span>
              </Label>

              <div className="rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                <Input
                  ref={subjectInputRef}
                  id="subject-line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Partnership: {{campaign.title}} x {{creator.name}}"
                  className="border-0 shadow-none focus-visible:ring-0 text-xs font-medium h-10 px-3"
                  required
                />
                <div className="flex items-center justify-start gap-1 px-3 py-1.5 border-t border-border/50 bg-muted/20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                        title="Insert emoji"
                      >
                        <Smile className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 p-2 rounded-xl">
                      <div className="grid grid-cols-6 gap-1">
                        {EMAIL_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertSubjectToken(emoji)}
                            className="size-7 rounded-md hover:bg-muted text-sm flex items-center justify-center cursor-pointer transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <VariablePicker
                    iconOnly
                    onSelectVariable={(v) => insertSubjectToken(v.tag)}
                  />
                </div>
              </div>
            </div>

            {/* Preview Text (Preheader, Matching Brevo Image 1) */}
            <div className="space-y-1.5">
              <Label htmlFor="preview-text" className="text-xs font-semibold text-foreground">
                Preview text
              </Label>

              <div className="rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                <Input
                  ref={previewTextInputRef}
                  id="preview-text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Brief inbox preview snippet..."
                  className="border-0 shadow-none focus-visible:ring-0 text-xs h-10 px-3"
                />
                <div className="flex items-center justify-start gap-1 px-3 py-1.5 border-t border-border/50 bg-muted/20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                        title="Insert emoji"
                      >
                        <Smile className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 p-2 rounded-xl">
                      <div className="grid grid-cols-6 gap-1">
                        {EMAIL_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertPreviewToken(emoji)}
                            className="size-7 rounded-md hover:bg-muted text-sm flex items-center justify-center cursor-pointer transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <VariablePicker
                    iconOnly
                    onSelectVariable={(v) => insertPreviewToken(v.tag)}
                  />
                </div>
              </div>

              {/* Lightbulb hint */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Lightbulb className="size-3 text-muted-foreground shrink-0" />
                <span>Keep it under 35 characters to make sure it is not truncated.</span>
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="category-select" className="text-xs font-semibold text-foreground">
                Workflow Category
              </Label>
              <select
                id="category-select"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as "pitch" | "negotiation" | "followup" | "contract"
                  )
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="pitch">Pitch & Outreach</option>
                <option value="negotiation">Negotiation Counter</option>
                <option value="followup">Follow-up</option>
                <option value="contract">Agreement & Scope</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
