# Hackathon log

- **Project:** Parley
- **Event:** Convex All Gas Hackathon
- **What it does:** Autonomous creator collaboration CRM automating research via Firecrawl, negotiations via OpenAI, and programmatic inboxes via AgentMail with real-time Convex subscriptions.
- **Live app:** not deployed
- **Repo:** https://github.com/Abdssamie/Parley
- **Frontend:** Convex static hosting
- **Convex deployment:** https://disciplined-greyhound-279.eu-west-1.convex.cloud
- **Components:** @convex-dev/static-hosting, @convex-dev/agent, @agentmail/convex, @firecrawl/firecrawl-convex, @convex-dev/better-auth
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, scheduled functions, realtime subscriptions, components
- **Auth:** Better Auth (@convex-dev/better-auth) with session cookies and credential auth
- **AI models:** gpt-5.6-sol, gpt-4o-mini
- **Started:** 2026-09-06T21:27:42Z
- **Last updated:** 2026-09-10T17:07:32Z

## Log

### 2026-09-10 - 0d5845f: Deterministic Rules Engine (A/B/C/D), Radix Kanban Workspace & AI Copilot Drafting
Implemented deterministic negotiation state machine with four-rule budget guardrails, interactive ReUI Radix drag-and-drop Kanban workspace, and OpenAI email copilot:
- **Deterministic State Machine & Rules Engine (`convex/pipeline.ts`, `convex/integrations/openai.ts`, `convex/schema.ts`):**
  - Built deterministic decision engine evaluating inbound creator proposals against campaign budget caps:
    - **Rule A (Green Light):** Quote within budget cap -> auto-accept / confirmation draft, stage transitions to `accepted`, and generates dynamic onboarding agreement link (`https://parley.app/onboard/...`).
    - **Rule B (Counter-Offer):** Quote > budget cap but <= 125% -> autonomous counter-offer drafted anchored strictly to campaign cap; dispatches immediately in `full_autonomy` mode or pauses for human review in `human_in_the_loop` mode.
    - **Rule C (Hard Block):** Quote > 125% of budget cap -> triggers human approval gate, halting auto-replies and placing deal in `review_required` stage.
    - **Rule D (Decline/Ghosted):** Rejection intent or creator inactivity timeout (>5 days) -> moves deal to `declined` or `ghosted`.
  - Schema extension (`convex/schema.ts`): Added `review_required` and `ghosted` pipeline stages to `threads` table; added `ruleTriggered`, `requestedRate`, `sentimentScore`, `contractLink`, `autonomyMode`, `lastInboundAt`, `proposedDeliverables`, and `timelineConstraint`.
- **Interactive ReUI Radix Kanban Board (`src/components/ui/kanban.tsx`, `src/components/PipelineBoard.tsx`, `convex/threads.ts`):**
  - Integrated `@dnd-kit/core` and `@dnd-kit/sortable` with Radix UI primitives for fluid, multi-column deal management across 6 workflow stages (`Discovered`, `Pitched`, `Negotiating`, `Review Required`, `Accepted`, `Declined / Ghosted`).
  - Column headers display live deal counts and real-time aggregated pipeline dollar values ($).
  - Optimistic drag-and-drop deal movement synchronized with Convex backend (`api.threads.moveStage`).
  - High-density deal cards displaying creator avatar, handle, platform, audience reach, agreed deliverables, proposed vs requested rates, sentiment scores, and rule pills (`Rule A (Within Budget)`, `Rule B (Countered)`, `Rule C (Blocked)`).
- **Copilot AI Email Drafting & Streamlined Thread Drawer (`convex/agent.ts`, `src/components/ThreadDrawer.tsx`):**
  - Built `draftEmailWithAgent` action in `convex/agent.ts` leveraging OpenAI (`gpt-4o-mini` / `gpt-5.6-sol`) with smart contextual fallbacks.
  - Redesigned thread drawer with single-click AI prompt chips ("Counter-offer $2,000", "Accept & send onboarding contract", "Ask for media kit & metrics", "Polite pass"), real-time email dispatch via AgentMail, and full message timeline.
- **Working State Retention & UI Polish (`src/components/ResearchModal.tsx`, `src/components/crm/creators/NewCreatorModal.tsx`, `src/hooks/useTheme.ts`):**
  - Maintained modal and drawer input persistence across discovery modals, search queries, and full-page template editing.
  - Added `useTheme.ts` hook for smooth dark/light theme switching adhering strictly to the neutral theme palette.
  - Convex features: schema, tables, indexes, queries, mutations, actions, scheduled functions, realtime subscriptions (`convex/schema.ts`, `convex/pipeline.ts`, `convex/threads.ts`, `convex/agent.ts`, `convex/integrations/openai.ts`).

### 2026-09-08 - Brevo-Style Dynamic Email Templates, CodeMirror Editor & Full Route Architecture
Implemented full-stack dynamic email template system with live data interpolation, dedicated routing, and developer-grade CodeMirror editing:
- **Backend (Convex):**
  - Added `emailTemplates` table in `convex/schema.ts` with indexes for workspace lookups by status and category.
  - Implemented CRUD and seeding in `convex/emailTemplates.ts` (`list`, `get`, `create`, `update`, `toggleStatus`, `remove`, `seedDefaults`).
  - Seeded 4 standard production templates (Pitch & Initial Outreach, Creative Deliverables Brief, Contract & Scope Confirmation, Follow-up).
- **Template Engine & Variable System (`src/lib/template-engine.ts`, `src/components/templates/VariablePicker.tsx`):**
  - Interpolation engine supporting tokens: creator fields (`name`, `handle`, `platform`, `niche`, `email`, `rate`), campaign fields (`title`, `budget`, `deliverables`, `niche`), and sender metadata (`name`, `email`, `brand`).
  - Single header `{ } Insert Variable` picker inserting dynamic tags at cursor position without UI clutter or duplicate controls.
  - Removed all `e.g.` subtitle clutter from variable picker dropdown items, formatting each token as a clean single row with label and code badge.
- **Robust Code Editor (`src/components/templates/FullPageTemplateEditor.tsx`):**
  - Integrated `@uiw/react-codemirror` with `@codemirror/lang-html` and `@codemirror/theme-one-dark`.
  - Replaced nested rounded cards and plain HTML `<textarea>` with full-canvas code editor chrome featuring line numbers, HTML/token syntax highlighting, status bar (token count, UTF-8, char count), and cursor-position insertion via `EditorView.dispatch`.
  - Removed subject field redundancy from the content canvas, keeping subject configuration purely in the template settings overview.
- **Routing & Navigation Architecture (`src/main.tsx`, `src/App.tsx`, `src/pages/TemplatePage.tsx`):**
  - Registered explicit TanStack router routes: `/dashboard`, `/campaigns`, `/creators`, `/pipeline`, `/templates`, `/templates/new`, and `/templates/$templateId`.
  - Replaced nested conditionals with an idiomatic `switch (view)` statement in `src/App.tsx`.
  - Fixed back button navigation so exiting template editing cleanly returns to `/templates` instead of falling back to `/`.
  - Eradicated sparkle icons in navigation and action toolbars in favor of purposeful `Bot` and `Zap` icons.
- **Theme Neutrality & Functional UI Polish (`AGENTS.md`, `TemplateEditorView.tsx`, `VariablePicker.tsx`):**
  - Standardized all icon colors across the template picker and editor to semantic `text-muted-foreground` and `text-primary`, eliminating arbitrary saturated colors (`text-blue-500`, `text-emerald-500`, `text-amber-500`, `bg-emerald-600`).
  - Added strict theme preservation and no-dead-UI rules to `AGENTS.md`.
  - Converted non-functional placeholder icons into working controls: replaced the dead 3-dots on Content with a working DropdownMenu (fullscreen editor, copy body, clear content); removed fake dropdown chevron from Save button; replaced dead Smile buttons with working Emoji Picker popovers; and removed non-functional HelpCircle clutter.
  - Removed live simulation effect and controls (variables counter, creator/campaign selectors) from the template overview page; the Content card now renders raw template content and tokens (`{{creator.name}}`, `{{subject}}`, etc.) with standard email footer notes.

### 2026-09-07 - Sidebar User Profile & Account Dropdown Menu
Streamlined dashboard navigation by migrating user account controls from the header to the persistent sidebar footer:
- Cleaned dashboard top bar (`src/App.tsx`), removing header user badge and sign-out button to maximize focal workspace room for actions and search.
- Created `NavUser` component (`src/components/nav-user.tsx`) and embedded it into `SidebarFooter` (`src/components/app-sidebar.tsx`), replacing the static live sync pill.
- Integrated profile trigger displaying user avatar (initials fallback), name, email, and vertical ellipsis menu trigger.
- Implemented popout Radix dropdown menu featuring user identity summary, quick navigation items (Account, Billing, Organization), and authenticated Sign Out action invoking Better Auth (`authClient.signOut()`) with redirect to `/sign-in`.

### 2026-09-07 - Better Auth Component, Dedicated Landing & Auth Pages, Protected Dashboard Gate
Integrated `@convex-dev/better-auth` with Convex components and established secure route protection:
- Mounted `@convex-dev/better-auth` component in `convex/convex.config.ts`, pinned `better-auth@~1.6.15` to comply with component peer dependencies, and configured `convex/auth.config.ts` provider.
- Created `convex/auth.ts` configuring Convex database adapter, cross-domain origin rules, and reactive `getCurrentUser` query. Registered Better Auth HTTP endpoints with CORS support in `convex/http.ts`.
- Created frontend authentication client (`src/lib/auth-client.ts`) with `convexClient()` and `crossDomainClient()` plugins, wrapping the app with `ConvexBetterAuthProvider` in `src/main.tsx`.
- Built dedicated Landing Page (`/`):
  - Hero with punchy product copy, ambient top glow light effect (`blur-3xl bg-primary/45`), background dot pattern overlay, full two-column workspace preview (mini-sidebar, 4 neutral KPI cards, dual-line wave velocity chart, active talent negotiations table), and smooth bottom gradient fade overlay.
  - 4-pillar product features grid (Creator Intelligence, Autonomous Negotiations, Unified Inbound Inbox, Budget Guardrails).
  - Clear segmented billing interval switcher (Monthly vs Annual with `Save 20%` pill tag) across Starter, Growth, and Enterprise tiers.
  - Expandable FAQ and clean product footer with consistent Parley branding.
- Built dedicated auth pages (`/sign-in` and `/sign-up`) with credentials authentication, form validation, error banners, and a convenient one-click demo login option.
- Enforced strict authorization guard (`src/components/auth/ProtectedRoute.tsx`) on `/dashboard`: unauthenticated requests cannot access the CRM dashboard and are immediately redirected to `/sign-in`. Authenticated users receive a header `UserMenu` with profile info and a clean Sign Out trigger.

### 2026-09-07 - AgentMail, Firecrawl Components & Neutral Cards
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
