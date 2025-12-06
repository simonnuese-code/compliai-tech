export interface LandingItem {
  title: string
  description: string
}

export interface BaseContent {
  headline: string
  subheadline: string
}

export interface HeroContent extends BaseContent {
  features: string[]
  ctaPrimary: string
  ctaSecondary: string
}

export interface SectionWithItemsContent extends BaseContent {
  items: LandingItem[]
}

export interface CTAContent extends BaseContent {
  features: string[]
  ctaPrimary: string
  ctaSecondary: string
}

// Re-export specific types as aliases for clarity in components
export type ProblemContent = SectionWithItemsContent
export type SolutionContent = SectionWithItemsContent
export type HowItWorksContent = SectionWithItemsContent
export type TrustContent = SectionWithItemsContent
export type PersonasContent = SectionWithItemsContent
export type ProcessContent = SectionWithItemsContent
export type FeaturesContent = SectionWithItemsContent
