import * as React from "react"
import {
  Users,
  Target,
  ChevronDown,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TEMPLATE_VARIABLES,
  type TemplateVariable,
} from "@/lib/template-engine"

interface VariablePickerProps {
  onSelectVariable: (variable: TemplateVariable) => void
  size?: "default" | "sm" | "icon"
  variant?: "outline" | "ghost" | "secondary"
  className?: string
  label?: string
  iconOnly?: boolean
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelectVariable,
  size = "sm",
  variant = "ghost",
  className,
  label = "Insert Dynamic Field",
  iconOnly = false,
}) => {
  const creatorVars = TEMPLATE_VARIABLES.filter((v) => v.category === "creator")
  const campaignVars = TEMPLATE_VARIABLES.filter((v) => v.category === "campaign")
  const brandVars = TEMPLATE_VARIABLES.filter(
    (v) => v.category === "sender" || v.category === "brand"
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            type="button"
            variant={variant}
            size="sm"
            className={`h-7 px-2 font-mono font-bold text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-md border border-transparent hover:border-border transition-colors ${className ?? ""}`}
            title="Insert dynamic field { }"
          >
            <span className="tracking-tight font-mono text-sm">{`{ }`}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant={variant}
            size={size}
            className={`gap-1.5 text-xs font-medium cursor-pointer rounded-md ${className ?? ""}`}
          >
            <span className="font-mono font-bold text-xs">{`{ }`}</span>
            <span>{label}</span>
            <ChevronDown className="size-3 opacity-60 ml-0.5" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto z-50">
        {/* Creator Fields Group */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1.5">
          <Users className="size-3.5 text-blue-500" />
          <span>Creator Data Fields</span>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {creatorVars.map((v) => (
            <DropdownMenuItem
              key={v.key}
              onClick={() => onSelectVariable(v)}
              className="cursor-pointer flex flex-col items-start gap-0.5 px-2.5 py-1.5 focus:bg-accent"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-xs text-foreground">{v.label}</span>
                <code className="text-[10px] font-mono bg-muted/80 text-foreground font-semibold px-1.5 py-0.5 rounded">
                  {v.tag}
                </code>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                e.g. {v.example}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Campaign Fields Group */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1.5">
          <Target className="size-3.5 text-emerald-500" />
          <span>Campaign Data Fields</span>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {campaignVars.map((v) => (
            <DropdownMenuItem
              key={v.key}
              onClick={() => onSelectVariable(v)}
              className="cursor-pointer flex flex-col items-start gap-0.5 px-2.5 py-1.5 focus:bg-accent"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-xs text-foreground">{v.label}</span>
                <code className="text-[10px] font-mono bg-muted/80 text-foreground font-semibold px-1.5 py-0.5 rounded">
                  {v.tag}
                </code>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                e.g. {v.example}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sender / Brand Fields Group */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-2 py-1.5">
          <Building className="size-3.5 text-amber-500" />
          <span>Sender & Brand Fields</span>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {brandVars.map((v) => (
            <DropdownMenuItem
              key={v.key}
              onClick={() => onSelectVariable(v)}
              className="cursor-pointer flex flex-col items-start gap-0.5 px-2.5 py-1.5 focus:bg-accent"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-xs text-foreground">{v.label}</span>
                <code className="text-[10px] font-mono bg-muted/80 text-foreground font-semibold px-1.5 py-0.5 rounded">
                  {v.tag}
                </code>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                e.g. {v.example}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Quick variable chips for commonly inserted tokens.
 */
interface QuickVariableChipsProps {
  onInsertTag: (tag: string) => void
}

export const QuickVariableChips: React.FC<QuickVariableChipsProps> = ({ onInsertTag }) => {
  const quickItems = [
    { tag: "{{creator.name}}", label: "Creator Name" },
    { tag: "{{campaign.title}}", label: "Campaign Title" },
    { tag: "{{creator.platform}}", label: "Platform" },
    { tag: "{{campaign.deliverables}}", label: "Deliverables" },
    { tag: "{{creator.rate}}", label: "Rate" },
    { tag: "{{sender.name}}", label: "Sender Name" },
  ]

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-muted-foreground">Quick insert:</span>
      {quickItems.map((item) => (
        <button
          key={item.tag}
          type="button"
          onClick={() => onInsertTag(item.tag)}
          className="inline-flex items-center text-[10px] font-mono bg-secondary/80 hover:bg-secondary text-secondary-foreground px-2 py-0.5 rounded border border-border/60 transition-colors cursor-pointer"
          title={`Insert ${item.tag}`}
        >
          +{item.label}
        </button>
      ))}
    </div>
  )
}
