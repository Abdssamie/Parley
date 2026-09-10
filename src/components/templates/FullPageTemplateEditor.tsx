import * as React from "react"
import { useState, useRef } from "react"
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { html } from "@codemirror/lang-html"
import { oneDark } from "@codemirror/theme-one-dark"
import {
  Eye,
  MoreVertical,
  Pencil,
  Check,
  Layers,
  X,
  Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VariablePicker } from "./VariablePicker"
import { renderTemplate, extractVariables } from "@/lib/template-engine"
import type { Doc } from "../../../convex/_generated/dataModel"

export interface FullPageTemplateEditorProps {
  name: string
  onNameChange: (name: string) => void
  body: string
  onBodyChange: (body: string) => void
  subject: string
  onSaveAndQuit: () => Promise<void> | void
  onQuit: () => void
  creators: Doc<"creators">[]
  campaigns: Doc<"campaigns">[]
  senderName?: string
  senderEmail?: string
}

export const FullPageTemplateEditor: React.FC<FullPageTemplateEditorProps> = ({
  name,
  onNameChange,
  body,
  onBodyChange,
  subject,
  onSaveAndQuit,
  onQuit,
  creators,
  campaigns,
  senderName = "Parley Partnerships",
  senderEmail = "partnerships@parley.app",
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(
    creators[0]?._id ?? ""
  )
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?._id ?? ""
  )

  const editorRef = useRef<ReactCodeMirrorRef>(null)

  const testCreator = creators.find((c) => c._id === selectedCreatorId) ?? creators[0] ?? null
  const testCampaign = campaigns.find((c) => c._id === selectedCampaignId) ?? campaigns[0] ?? null

  const previewContext = {
    creator: testCreator,
    campaign: testCampaign,
    sender: { name: senderName, email: senderEmail },
    brandName: "Parley",
  }

  const renderedSubject = renderTemplate(subject, previewContext)
  const renderedBody = renderTemplate(body, previewContext)
  const detectedVars = extractVariables(body)

  const insertToken = (token: string) => {
    const view = editorRef.current?.view
    if (view) {
      const { state } = view
      const range = state.selection.main
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: token },
        selection: { anchor: range.from + token.length },
      })
      view.focus()
    } else {
      onBodyChange(body + token)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveAndQuit()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col h-screen w-screen overflow-hidden select-none">
      {/* 1. Full-Width Top Header Bar (Matching Brevo Image 0) */}
      <header className="h-16 shrink-0 border-b border-border/70 px-6 sm:px-8 flex items-center justify-between bg-card/60 backdrop-blur-sm">
        {/* Left: Brand Icon + Editable Title */}
        <div className="flex items-center gap-3">
          {/* Brand Icon Mark (like Brevo's green circle 'B') */}
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs select-none">
            P
          </div>

          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  autoFocus
                  className="h-8 text-sm font-semibold py-0 w-64 rounded-lg"
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
                title="Click to rename"
              >
                <span className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {name || "Untitled template"}
                </span>
                <Pencil className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions ({ } Insert Variable, Preview & Test, Save & Quit, 3-dots) */}
        <div className="flex items-center gap-2.5">
          {/* SINGLE clean variable insertion button in header */}
          <VariablePicker
            onSelectVariable={(v) => insertToken(v.tag)}
            label="Insert Variable"
            size="sm"
            variant="outline"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreviewModal(true)}
            className="rounded-full text-xs font-semibold px-4 h-9 shadow-xs cursor-pointer border-border/80 hover:bg-muted"
          >
            <span>Preview & Test</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !body.trim()}
            className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold px-5 h-9 shadow-xs cursor-pointer"
          >
            <span>{isSaving ? "Saving..." : "Save & Quit"}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem onClick={() => setShowPreviewModal(true)} className="cursor-pointer text-xs">
                Test simulation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onQuit} className="cursor-pointer text-xs text-muted-foreground">
                Discard & Exit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. Robust Professional Code/Template Editor Workspace */}
      <main className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-4 sm:p-6">
        <div className="flex-1 flex flex-col min-h-0 border border-border/80 mx-auto w-full max-w-6xl rounded-lg overflow-hidden bg-[#282c34] shadow-md select-text">
          {/* Editor Chrome Header Bar */}
          <div className="h-9 px-4 bg-[#21252b] border-b border-[#181a1f] flex items-center justify-between text-xs text-neutral-400 select-none">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-neutral-400" />
              <span className="font-mono text-[11px] text-neutral-300">template_body.html</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span>HTML / Liquid / Handlebars</span>
            </div>
          </div>

          {/* Robust CodeMirror Editor Engine */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeMirror
              ref={editorRef}
              value={body}
              height="100%"
              theme={oneDark}
              extensions={[html()]}
              onChange={(value) => onBodyChange(value)}
              placeholder="Enter email HTML or plaintext body here. Click '{ } Insert Variable' in the top bar to insert dynamic tokens..."
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: false,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
                rectangularSelection: true,
                crosshairCursor: false,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
              }}
              className="h-full overflow-hidden text-sm font-mono [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-content]:p-4"
            />
          </div>

          {/* Editor Status Bar */}
          <div className="h-7 px-4 bg-[#21252b] border-t border-[#181a1f] flex items-center justify-between text-[11px] text-neutral-400 select-none">
            <div className="flex items-center gap-4">
              <span>{detectedVars.length} dynamic token{detectedVars.length === 1 ? "" : "s"} detected</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>{body.length} chars</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Preview & Test Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-background shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Eye className="size-4 text-primary" />
                <span>Live Rendered Email Preview</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPreviewModal(false)}
                className="size-7 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Test Simulation Pickers */}
            <div className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Layers className="size-3.5 text-muted-foreground" />
                <span>Simulate dynamic fields with:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedCreatorId}
                  onChange={(e) => setSelectedCreatorId(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 truncate"
                >
                  {creators.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.platform})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 truncate"
                >
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rendered Preview Canvas */}
            <div className="rounded-xl border border-border/70 bg-card p-5 space-y-3">
              <div className="border-b border-border/50 pb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Subject
                </span>
                <span className="text-base font-bold text-foreground">
                  {renderedSubject || "(Empty subject)"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>To: {testCreator?.name || "Creator"} &lt;{testCreator?.email || "email@creator.com"}&gt;</span>
                <span>From: {senderName}</span>
              </div>

              <div className="pt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans min-h-[140px] max-h-[300px] overflow-y-auto">
                {renderedBody || "(Empty email body)"}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-full px-5 text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
