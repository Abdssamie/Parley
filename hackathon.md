# Hackathon log

- **Project:** Parley
- **Event:** Convex All Gas Hackathon
- **What it does:** Autonomous creator collaboration CRM automating research via Firecrawl, negotiations via OpenAI, and programmatic inboxes via AgentMail with real-time Convex subscriptions.
- **Live app:** not deployed
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** https://disciplined-greyhound-279.eu-west-1.convex.cloud
- **Components:** @convex-dev/static-hosting, @convex-dev/agent
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, real-time subscriptions, components
- **Auth:** none
- **AI models:** gpt-5.6-sol, gpt-4o-mini
- **Started:** 2026-09-06T21:27:42Z
- **Last updated:** 2026-09-07T15:36:00Z

## Log

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
