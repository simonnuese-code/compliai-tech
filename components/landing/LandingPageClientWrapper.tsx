'use client'

import { useState, useEffect } from 'react'

import SectionNavigation from '@/components/landing/SectionNavigation'
import LiquidBackground from '@/components/landing/LiquidBackground'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PersonasSection from '@/components/landing/PersonasSection'
import TrustSection from '@/components/landing/TrustSection'
import CTASection from '@/components/landing/CTASection'
import {
    HeroContent,
    ProblemContent,
    SolutionContent,
    FeaturesContent,
    PersonasContent,
    TrustContent,
    CTAContent
} from '@/lib/types/landing'

interface LandingPageClientWrapperProps {
    content: {
        hero: HeroContent
        problem: ProblemContent
        solution: SolutionContent
        features: FeaturesContent
        personas: PersonasContent
        trust: TrustContent
        cta: CTAContent
    }
    user?: { name?: string | null; email: string } | null
}

export default function LandingPageClientWrapper({ content, user }: LandingPageClientWrapperProps) {
    return (
        <main className="relative min-h-screen">
            {/* Fixed Background */}
            <LiquidBackground />

            {/* Fixed Navigation Header */}
            <Navigation user={user} />

            {/* Vertical Section Navigation (Uncontrolled) */}
            <SectionNavigation />

            {/* Content Sections */}
            <HeroSection content={content.hero} />
            <ProblemSection content={content.problem} />
            <SolutionSection content={content.solution} />
            <FeaturesSection content={content.features} />
            <PersonasSection content={content.personas} />
            <TrustSection content={content.trust} />
            <CTASection content={content.cta} />
            <Footer />
        </main>
    )
}
