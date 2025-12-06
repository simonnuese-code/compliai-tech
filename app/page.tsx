import Navigation from '@/components/landing/Navigation'
import LiquidBackground from '@/components/landing/LiquidBackground'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PersonasSection from '@/components/landing/PersonasSection'
import TrustSection from '@/components/landing/TrustSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import FloatingCTA from '@/components/landing/FloatingCTA'
import { getLandingContent } from '@/lib/landing-content'
import {
  HeroContent,
  ProblemContent,
  SolutionContent,
  FeaturesContent,
  PersonasContent,
  TrustContent,
  CTAContent
} from '@/lib/types/landing'

// Import the new client wrapper component
import LandingPageClientWrapper from '@/components/landing/LandingPageClientWrapper'

import { getCurrentUser } from '@/lib/session'

export default async function Home() {
  const heroContent = await getLandingContent('hero') as unknown as HeroContent
  const problemContent = await getLandingContent('problem') as unknown as ProblemContent
  const solutionContent = await getLandingContent('solution') as unknown as SolutionContent
  const featuresContent = await getLandingContent('features') as unknown as FeaturesContent
  const personasContent = await getLandingContent('personas') as unknown as PersonasContent
  const trustContent = await getLandingContent('trust') as unknown as TrustContent
  const ctaContent = await getLandingContent('cta') as unknown as CTAContent

  const user = await getCurrentUser()

  return (
    <LandingPageClientWrapper
      content={{
        hero: heroContent,
        problem: problemContent,
        solution: solutionContent,
        features: featuresContent,
        personas: personasContent,
        trust: trustContent,
        cta: ctaContent
      }}
      user={user}
    />
  )
}
