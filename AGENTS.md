<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## UI & Theme Design Rules
- **Preserve Theme & Strict Neutrality**:
  - Always preserve the application's unified design system and theme palette.
  - Never introduce random saturated or arbitrary color utility classes on icons, badges, or accents (e.g. `text-blue-500`, `text-amber-500`, `text-emerald-500`, `text-indigo-500`, `bg-emerald-600`, etc.).
  - Always use standard semantic theme tokens: `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-background`, `bg-card`, `bg-muted`, `border-border`.
- **No Dead / Non-Functional UI Elements**:
  - Every icon, button, and interactive element rendered in the UI must have a working purpose and real implementation (e.g. functioning click handler, interactive popover/dropdown, or tooltip).
  - Never leave dead buttons or placeholder icons that do nothing (e.g. fake dropdown chevrons, non-functional help icons, or unhandled action triggers).
