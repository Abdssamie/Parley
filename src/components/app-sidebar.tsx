import * as React from "react"
import {
  Users,
  Target,
  Sparkles,
  Settings,
  Plus,
  Compass,
  LayoutDashboard,
} from "lucide-react"
import { NavUser } from "./nav-user"
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

export type AppNavView = "dashboard" | "campaigns" | "creators" | "pipeline" | "settings"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView: AppNavView
  onSelectView: (view: AppNavView) => void
  campaignsCount?: number
  creatorsCount?: number
  threadsCount?: number
  onOpenResearch?: () => void
}

export function AppSidebar({
  currentView,
  onSelectView,
  campaignsCount = 0,
  creatorsCount = 0,
  threadsCount = 0,
  onOpenResearch,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* 1. Header: Brand / Workspace */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground select-none"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight">Parley</span>
                <span className="truncate text-xs text-muted-foreground font-normal">Autonomous CRM</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. Content: Two Groups according to baseline */}
      <SidebarContent>
        {/* Group 1: Core Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "dashboard"}
                  onClick={() => onSelectView("dashboard")}
                  tooltip="Dashboard Overview"
                >
                  <LayoutDashboard className="size-4 text-primary" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Campaigns */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "campaigns"}
                  onClick={() => onSelectView("campaigns")}
                  tooltip="Campaigns"
                >
                  <Target className="size-4 text-primary" />
                  <span>Campaigns</span>
                </SidebarMenuButton>
                {campaignsCount > 0 && (
                  <SidebarMenuBadge>{campaignsCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              {/* Creators CRM */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "creators"}
                  onClick={() => onSelectView("creators")}
                  tooltip="Creators CRM"
                >
                  <Users className="size-4 text-primary" />
                  <span>Creators CRM</span>
                </SidebarMenuButton>
                {creatorsCount > 0 && (
                  <SidebarMenuBadge>{creatorsCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              {/* Autonomous Pipeline */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "pipeline"}
                  onClick={() => onSelectView("pipeline")}
                  tooltip="Negotiation Pipeline"
                >
                  <Compass className="size-4 text-primary" />
                  <span>Negotiation Pipeline</span>
                </SidebarMenuButton>
                {threadsCount > 0 && (
                  <SidebarMenuBadge>{threadsCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Quick Actions & Workspace */}
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {onOpenResearch && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onOpenResearch}
                    tooltip="Autonomous Research & Pitch"
                  >
                    <Plus className="size-4 text-emerald-500" />
                    <span>Research & Pitch</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === "settings"}
                  onClick={() => onSelectView("settings")}
                  tooltip="Workspace Settings"
                >
                  <Settings className="size-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer: Account / Profile menu */}
      <SidebarFooter>
        <NavUser onSelectView={onSelectView} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
