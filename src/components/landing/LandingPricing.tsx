import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'For growing brands testing autonomous creator outreach.',
    popular: false,
    features: [
      'Up to 25 automated deals/mo',
      'Creator bio & rate extraction',
      'Autonomous email negotiation',
      'Real-time deal pipeline board',
      'Standard email support',
    ],
  },
  {
    name: 'Growth',
    price: 149,
    description: 'For scaling marketing teams managing regular monthly campaigns.',
    popular: true,
    features: [
      'Up to 150 automated deals/mo',
      'Batch creator discovery & vetting',
      'Custom budget caps & CPM rules',
      'Automated contract & agreement drafting',
      'Two-way email sync with custom domain',
      'Priority inbound thread processing',
    ],
  },
  {
    name: 'Enterprise',
    price: 499,
    description: 'For agencies and brands running high-volume talent campaigns.',
    popular: false,
    features: [
      'Unlimited automated deals & pipelines',
      'High-throughput discovery runs',
      'Custom negotiation policy rules',
      'Multi-seat workspace collaboration',
      'Dedicated onboarding & 24/7 support',
      'Custom SLAs and invoicing',
    ],
  },
]

export const LandingPricing: React.FC = () => {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-16 border-b border-border/40 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Simple, predictable pricing
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Choose a plan that fits your deal volume. Upgrade or cancel anytime.
          </p>

          <div className="pt-3 flex items-center justify-center">
            <div className="inline-flex items-center rounded-xl border border-border/80 bg-muted/40 p-1 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-4 py-2 font-medium transition-all cursor-pointer ${
                  !annual
                    ? 'bg-card text-foreground shadow-sm border border-border/60 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all cursor-pointer ${
                  annual
                    ? 'bg-card text-foreground shadow-sm border border-border/60 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Annual billing</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const price = annual ? Math.round(plan.price * 0.8) : plan.price
            return (
              <div
                key={i}
                className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'border-primary/70 bg-card/90 shadow-md ring-1 ring-primary/30'
                    : 'border-border/70 bg-card/50 shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                    {plan.popular && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        Popular
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground min-h-[32px]">{plan.description}</p>

                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">${price}</span>
                    <span className="text-xs text-muted-foreground font-mono">/mo</span>
                  </div>

                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <Link to="/sign-up">
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      size="sm"
                      className="w-full h-9 font-medium cursor-pointer shadow-2xs"
                    >
                      Choose {plan.name}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
