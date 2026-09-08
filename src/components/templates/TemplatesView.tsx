import * as React from "react"
import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import {
  Search,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Trash2,
  Copy,
  CheckCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "@tanstack/react-router"

interface TemplatesViewProps {
  onOpenResearch?: () => void
}

export const TemplatesView: React.FC<TemplatesViewProps> = () => {
  const navigate = useNavigate()

  // Convex Live Subscriptions
  const templates = useQuery(api.emailTemplates.list, {})

  // Mutations
  const removeMutation = useMutation(api.emailTemplates.remove)
  const createMutation = useMutation(api.emailTemplates.create)
  const toggleStatusMutation = useMutation(api.emailTemplates.toggleStatus)
  const seedDefaultsMutation = useMutation(api.emailTemplates.seedDefaults)

  // Local state for list view
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSeeding, setIsSeeding] = useState(false)

  // Derived filter calculation during rendering
  const filteredTemplates = (templates || []).filter((t) => {
    const itemStatus = t.status ?? "active"
    const matchesStatus = statusFilter === "all" || itemStatus === statusFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTemplates.map((t) => t._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleEdit = (template: Doc<"emailTemplates">) => {
    void navigate({
      to: "/templates/$templateId",
      params: { templateId: template._id },
    })
  }

  const handleCreateNew = () => {
    void navigate({
      to: "/templates/new",
    })
  }

  const handleToggleStatus = async (id: Id<"emailTemplates">) => {
    await toggleStatusMutation({ id })
  }

  const handleDelete = async (id: Id<"emailTemplates">) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await removeMutation({ id })
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleDuplicate = async (template: Doc<"emailTemplates">) => {
    await createMutation({
      name: `${template.name} (Copy)`,
      category: template.category,
      status: template.status ?? "active",
      description: template.description,
      subject: template.subject,
      body: template.body,
      isDefault: false,
    })
  }

  const handleSeedDefaults = async () => {
    setIsSeeding(true)
    try {
      await seedDefaultsMutation({})
    } finally {
      setIsSeeding(false)
    }
  }

  // Format timestamp helper
  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  const isAllSelected =
    filteredTemplates.length > 0 &&
    selectedIds.length === filteredTemplates.length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Title & Action Buttons (Brevo Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Templates
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {(!templates || templates.length === 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="rounded-full text-xs font-medium px-4 h-9 cursor-pointer"
            >
              <span>{isSeeding ? "Seeding..." : "Load Defaults"}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            className="rounded-full text-xs font-semibold px-4 h-9 gap-1.5 cursor-pointer shadow-xs border-border/80"
          >
            <FolderPlus className="size-4 text-muted-foreground" />
            <span>Create folder</span>
          </Button>

          <Button
            type="button"
            onClick={handleCreateNew}
            className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold px-5 h-9 shadow-xs cursor-pointer"
          >
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* 2. Subnav Tabs (Brevo Underline Tab) */}
      <div className="border-b border-border/60 flex items-center gap-6">
        <button
          type="button"
          className="border-b-2 border-primary text-foreground font-semibold pb-2.5 text-sm cursor-pointer"
        >
          Email
        </button>
      </div>

      {/* 3. Controls & Filter Bar (Brevo Style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3 flex-1">
          {/* Select all checkbox */}
          <div className="pl-1">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              aria-label="Select all templates"
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for templates"
              className="pl-9 h-9 text-xs rounded-xl border-input"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Pagination summary */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground self-end sm:self-center">
          <span>
            {filteredTemplates.length > 0
              ? `1-${filteredTemplates.length} of ${filteredTemplates.length}`
              : "0 of 0"}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="size-7 rounded-lg opacity-40"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="size-7 rounded-lg opacity-40"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Template List (Brevo Rounded Card Rows) */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              No templates found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No templates match your active filters. Try resetting the search query."
                : "Get started by creating your first custom email template or loading defaults."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="rounded-full text-xs"
            >
              Load Defaults
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateNew}
              className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs px-4"
            >
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template, idx) => {
            const isSelected = selectedIds.includes(template._id)
            const templateStatus = template.status ?? "active"

            return (
              <div
                key={template._id}
                className="rounded-2xl border border-border/80 bg-card hover:border-border transition-colors p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs"
              >
                {/* Left Side: Checkbox & Template Meta */}
                <div className="flex items-center gap-4 min-w-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(template._id)}
                    aria-label={`Select ${template.name}`}
                  />

                  <div className="space-y-1 min-w-0">
                    <h3
                      onClick={() => handleEdit(template)}
                      className="text-sm font-semibold text-foreground hover:underline cursor-pointer truncate"
                    >
                      {template.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>#{idx + 1}</span>
                      <span>•</span>
                      <span>
                        Last Edited on{" "}
                        {formatTimestamp(template.updatedAt || template.createdAt)}
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(template._id)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                        title="Click to toggle status"
                      >
                        <span
                          className={`size-2 rounded-full ${
                            templateStatus === "active"
                              ? "bg-emerald-500"
                              : "bg-neutral-400"
                          }`}
                        />
                        <span className="capitalize">{templateStatus}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action & 3-Dots Menu */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                    className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                    title="Edit template"
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => handleEdit(template)}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        <Pencil className="size-3.5" />
                        <span>Edit template</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(template)}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        <Copy className="size-3.5" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(template._id)}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        <CheckCircle className="size-3.5" />
                        <span>
                          Set {templateStatus === "active" ? "Inactive" : "Active"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(template._id)}
                        className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
