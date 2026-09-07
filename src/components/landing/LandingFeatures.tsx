import React from 'react'
import { Search, Bot, Mail, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Instant Creator Intelligence',
    description:
      'Analyze any creator profile or media kit in seconds. Get verified subscriber tiers, true engagement rates, recent sponsorship history, and direct business contacts.',
  },
  {
    icon: Bot,
    title: 'Autonomous Deal Negotiation',
    description:
      'AI agents handle multi-turn rate discussions, countering pricing and locking down deliverable packages based on your campaign targets and target CPM.',
  },
  {
    icon: Mail,
    title: 'Unified Deal Inbox',
    description:
      'Direct two-way email synchronization. Incoming creator responses are parsed, analyzed, and linked to deal stages in real time with zero manual copy-pasting.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict Budget Guardrails',
    description:
      'Set non-negotiable ceiling rates, deliverable checklists, and approval thresholds. Deals never close over budget without explicit human authorization.',
  },
]

export const LandingFeatures: React.FC = () => {
  return (
    <section id="features" className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Everything you need to scale creator partnerships
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Replace spreadsheets and messy inboxes with an end-to-end autonomous sponsorship engine.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-card/60 p-5 hover:border-border hover:bg-card/90 transition-all duration-200 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Icon className="size-4.5" />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
