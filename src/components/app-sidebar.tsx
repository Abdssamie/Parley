import React from "react"
import {
  Users,
  Target,
  Sparkles,
  Settings,
  Plus,
  Compass,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export type AppNavView = "creators" | "campaigns" | "pipeline" | "settings"

interface AppSidebarProps {
  currentView: AppNavView
  onSelectView: (view: AppNavView) => void
  creatorsCount?: number
  campaignsCount?: number
  threadsCount?: number
  onOpenResearch?: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onSelectView,
  creatorsCount = 0,
  campaignsCount = 0,
  threadsCount = 0,
  onOpenResearch,
}) => {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Workspace Brand Header */}
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold tracking-tight text-sidebar-foreground text-sm">
              Bloomshine
            </span>
            <span className="text-[11px] text-muted-foreground">
              Autonomous CRM
            </span>
          </div>
        </div>

        {onOpenResearch && (
          <div className="mt-2 group-data-[collapsible=icon]:hidden">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onOpenResearch}
              className="w-full flex items-center justify-center gap-1.5 shadow-sm font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Research & Pitch</span>
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Core CRM Modules */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Core Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Creators */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "creators"}
                  onClick={() => onSelectView("creators")}
                  tooltip="Creators CRM"
                  className="font-medium"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span>Creators</span>
                </SidebarMenuButton>
                {creatorsCount > 0 && (
                  <SidebarMenuBadge className="bg-primary/10 text-primary font-semibold text-[10px]">
                    {creatorsCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              {/* Campaigns */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "campaigns"}
                  onClick={() => onSelectView("campaigns")}
                  tooltip="Campaigns"
                  className="font-medium"
                >
                  <Target className="h-4 w-4 text-accent-foreground" />
                  <span>Campaigns</span>
                </SidebarMenuButton>
                {campaignsCount > 0 && (
                  <SidebarMenuBadge className="bg-secondary text-secondary-foreground font-semibold text-[10px]">
                    {campaignsCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              {/* Autonomous Pipeline */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "pipeline"}
                  onClick={() => onSelectView("pipeline")}
                  tooltip="Autonomous Negotiation Pipeline"
                  className="font-medium"
                >
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Negotiation Pipeline</span>
                </SidebarMenuButton>
                {threadsCount > 0 && (
                  <SidebarMenuBadge className="bg-primary/20 text-primary font-semibold text-[10px]">
                    {threadsCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "settings"}
                  onClick={() => onSelectView("settings")}
                  tooltip="Settings"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-card/60 border border-border/40 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate font-mono text-[11px]">Convex Reactive Sync</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
