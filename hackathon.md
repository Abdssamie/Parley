# Hackathon log

- **Project:** Parley
- **Event:** Convex All Gas Hackathon
- **What it does:** Autonomous creator collaboration CRM automating research via Firecrawl, negotiations via OpenAI, and programmatic inboxes via AgentMail with real-time Convex subscriptions.
- **Live app:** not deployed
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** https://disciplined-greyhound-279.eu-west-1.convex.cloud
- **Components:** @convex-dev/static-hosting, @convex-dev/agent, @agentmail/convex, @firecrawl/firecrawl-convex
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, scheduled functions, realtime subscriptions, components
- **Auth:** none
- **AI models:** gpt-5.6-sol, gpt-4o-mini
- **Started:** 2026-09-06T21:27:42Z
- **Last updated:** 2026-09-07T16:36:00Z

## Log

### 2026-09-07 - AgentMail, Firecrawl Components & Neutral Cards
Integrated official Convex components for AgentMail and Firecrawl, and overhauled dashboard metric cards to neutral Claymorphism styling:
- Mounted `@agentmail/convex` component (`convex/convex.config.ts`). Created `convex/email.ts` providing durable send mutations, reactive thread and inbox queries, delivery status tracking, and automated inbound mail routing directly into the AI negotiation loop (`api.agent.processInboundWithAgent`). Mounted Svix-verified `/agentmail/webhook` route in `convex/http.ts`.
- Mounted `@firecrawl/firecrawl-convex` component (`convex/convex.config.ts`) with typed component env. Refactored `convex/firecrawl.ts` to `FirecrawlClient` executing within Convex's native runtime (removed `"use node"`), retaining fallback simulation for offline testing while unlocking web search, site mapping, and durable multi-page site crawls (`startDurableCrawl`, `getCrawlProgress`, `listCrawlPages`).
- Built neutral Claymorphism card primitives (`src/components/ui/neutral-card.tsx`) featuring `NeutralStatCard` (pill badges, high-contrast stats, micro-trend notes) and `NeutralWaveChartCard` (interactive 3m/30d/7d range switcher with dual-spline gradient waveform visualization). Replaced colorful icon-box metric cards in `src/components/DashboardOverview.tsx` and `src/components/CampaignMetrics.tsx`.

### 2026-09-07 - Refine Data Tables, Checkboxes & Scrollbar Theme
Refined CRM data table UX and dark theme integration:
- Compressed and streamlined table headers and toolbars across Campaigns (`src/components/crm/campaigns/CampaignsView.tsx`) and Creators (`src/components/crm/creators/CreatorsView.tsx`), replacing multi-row tabs with compact single-row search, select dropdowns, and icon actions.
- Restored official shadcn Table primitive baseline (`src/components/ui/table.tsx`).
- Installed and integrated official shadcn Checkbox component (`src/components/ui/checkbox.tsx`) adhering to the Claymorphism dark palette (`bg-primary text-primary-foreground` on select).
- Fixed cross-browser dark scrollbar rendering by setting `color-scheme: dark;` on `html`, `body`, and `.dark`, and establishing standard 12px dark track and thumb scrollbar styles in `src/index.css`.

### 2026-09-07 - fa19d9b
Overhauled dashboard UI to production shadcn standards with a Claymorphism theme and Poppins typography:
- Rebuilt persistent workspace sidebar navigation (`src/components/app-sidebar.tsx`, `src/components/ui/sidebar.tsx`) strictly on the official shadcn sidebar baseline with collapsible icon state.
- Created dedicated Executive Dashboard (`src/components/DashboardOverview.tsx`) centralizing real-time KPI metrics (Total Budget, Active Campaigns, Reach, Average Cost, Committed Spend) and quick action shortcuts.
- Replaced card layouts on Campaigns (`src/components/crm/campaigns/CampaignsView.tsx`) and Creators (`src/components/crm/creators/CreatorsView.tsx`) with pure data tables supporting inline cell modification directly updating Convex documents (`campaigns.update`, `creators.update`).
- Eradicated legacy custom UI badges and header elements, migrating modal and drawer surfaces to shadcn Dialog and Sheet primitives (`src/components/crm/campaigns/NewCampaignModal.tsx`, `src/components/crm/creators/CreatorDrawer.tsx`, `src/components/ResearchModal.tsx`, `src/components/CampaignSettingsModal.tsx`).

### 2026-09-07 - Functional CRM Base (Creators & Campaigns)
Built a dark-themed Airtable/Attio-style CRM foundational base:
- Persistent workspace sidebar navigation (`src/components/layout/Sidebar.tsx`) connecting Creators, Campaigns, and Autonomous Deals Pipeline.
- Creators data grid view (`src/components/crm/creators/CreatorsView.tsx`) with row selection, colorful avatar badges, status and platform pills, formatted reach/views/cost metrics, and a dynamic "Calculate" aggregation summary footer.
- Firecrawl instant scraping modal and manual entry modal (`src/components/crm/creators/NewCreatorModal.tsx`), plus full intelligence dossier drawer (`src/components/crm/creators/CreatorDrawer.tsx`).
- Campaigns data grid view (`src/components/crm/campaigns/CampaignsView.tsx`) with isometric drive illustration empty state, currency picker, and campaign creation modal (`src/components/crm/campaigns/NewCampaignModal.tsx`).
- Cleaned schema: eradicated `budgetCap` across schema, functions, and client, standardizing on `budget`. Re-seeded Convex with 20 authentic creators and showcase campaigns.
Migrated Firecrawl tool integration to the official `@mendable/firecrawl-js` npm SDK. Isolated Node.js built-ins (`node:buffer`, `node:assert`, `undici`) into a dedicated Node-runtime Convex action module (`convex/firecrawl.ts` with `"use node";`), maintaining clean edge V8 execution for queries, mutations, and agent tools across `convex/agent.ts` and `convex/pipeline.ts`. Re-verified end-to-end bundling, TypeScript checks, and Vite client build.

### 2026-09-07 - e391b4c
Mounted `@convex-dev/agent` component in `convex/convex.config.ts` with durable thread persistence. Built autonomous creator collaboration agent (`parleyNegotiator`) powered by OpenAI (`gpt-5.6-sol`) in `convex/agent.ts`. Integrated robust Firecrawl tools for structured media kit scraping, reach extraction, and subpage mapping (`convex/integrations/firecrawl.ts`). Added AgentMail outbound email delivery tools and closed-loop inbound webhook dispatch (`convex/http.ts`, `convex/integrations/agentmail.ts`) to auto-trigger agent negotiation steps upon creator email replies.

### 2026-09-06 - 842ae38
Renamed project branding to Parley across client interface, Convex server functions, AI prompt contracts, and package configuration (`package.json`, `index.html`, `src/components/Navbar.tsx`, `convex/pipeline.ts`).

### 2026-09-06 - 77eb7df
Scaffolded Parley full-stack architecture. Initialized Convex database schema with campaigns, creators, threads, and messages tables. Implemented real-time Convex queries and mutations for the CRM pipeline, along with sponsor integration stubs for Firecrawl web extraction, OpenAI fee extraction and counter-offer drafting, and AgentMail programmatic inboxes (`convex/schema.ts`, `convex/campaigns.ts`, `convex/creators.ts`, `convex/threads.ts`, `convex/messages.ts`, `convex/pipeline.ts`, `convex/http.ts`). Built Vite + TanStack Router client with Tailwind CSS and shadcn UI components featuring a real-time Kanban board, live thread drawer, campaign guardrail controls, and human-in-the-loop review approvals (`src/App.tsx`, `src/components/PipelineBoard.tsx`, `src/components/ThreadDrawer.tsx`).
