import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does autonomous negotiation work?',
    answer:
      'You configure target CPMs, per-creator price ceilings, and deliverable packages. Parley evaluates incoming proposals and autonomously counters within your approved bounds, never committing to rates above your ceiling.',
  },
  {
    question: 'What happens if a creator asks for non-standard terms?',
    answer:
      'If a creator requests custom rights, usage extensions, or compensation above your budget caps, the system automatically pauses negotiation on that thread and flags it for human review.',
  },
  {
    question: 'Do creators know they are interacting with AI?',
    answer:
      'Negotiation emails are written naturally and professionally. They originate from your verified company email address with natural phrasing tailored to each creator’s niche and content style.',
  },
  {
    question: 'Can I approve messages before they are sent?',
    answer:
      'Yes. You can switch between Full Autopilot (instant negotiation within rules) and Review Mode (where proposed replies require a one-click human approval).',
  },
  {
    question: 'How quickly can our team get started?',
    answer:
      'You can create an account, establish your campaign budget guardrails, and begin creator discovery in under five minutes.',
  },
]

export const LandingFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Clear answers about safety, automation controls, and workflow integration.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="rounded-lg border border-border/70 bg-card/60 transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-foreground cursor-pointer select-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
