# Landing Page Architecture

## Content Strategy
The landing page content is managed via Markdown files in `content/landing/`. Each section has a corresponding file:
- `hero.md`: Hero section content
- `problem.md`: Problem section content
- `solution.md`: Solution section content
- `how-it-works.md`: How it works section content
- `trust.md`: Trust section content
- `cta.md`: CTA section content
- `personas.md`: Personas section content (optional)
- `process.md`: Process section content (optional)

The content is parsed by `lib/landing-content.ts` which extracts:
- H1 as `headline`
- Paragraphs before the first H2 as `subheadline` (intro)
- H2 as item titles
- Content between H2s as item descriptions
- Custom tags `[CTA_PRIMARY]` and `[CTA_SECONDARY]` for buttons
- Lists as features

## Design System
- **Colors**: Primary color is `#1A9AD6` (OKLCH converted).
- **Glassmorphism**: Extensive use of `backdrop-blur-xl`, `bg-white/40`, and `border-white/40`.
- **Border Radius**: Consistent `28px` (1.75rem) for cards and buttons.
- **Icons**: Lucide React outline icons.

## Animations
Animations are centralized in `lib/animations.ts`:
- `headlineReveal`: For main headlines
- `fadeUp`: For general content entry
- `fadeUpStaggered`: For grid items
- `containerStagger`: Wrapper for grids to stagger children
- `softPop`: For icons
- `lineGrow`: For connector lines

## Components
- `HeroSection`: Displays headline, intro, CTAs, and trust features.
- `ProblemSection`, `SolutionSection`, `HowItWorksSection`, `TrustSection`: Render grids of cards based on parsed items.
- `CTASection`: Prominent call to action with gradient background.
