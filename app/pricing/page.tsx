import Navigation from '@/components/landing/Navigation'
import LiquidBackground from '@/components/landing/LiquidBackground'
import Footer from '@/components/landing/Footer'
import PricingPage from '@/components/pricing/PricingPage'
import { getCurrentUser } from '@/lib/session'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Preise - CompliAI | EU AI Act Compliance für KMU",
    description: "Transparente Preise für EU AI Act Compliance. Ab €100/Monat. Keine versteckten Kosten. 30 Tage Geld-zurück-Garantie.",
    keywords: ["EU AI Act", "Compliance", "Preise", "KMU", "DSGVO"]
}

export default async function Page() {
    const user = await getCurrentUser()

    return (
        <main className="relative min-h-screen bg-slate-50">
            <LiquidBackground />
            <Navigation user={user} />
            <PricingPage />
            <Footer />
        </main>
    )
}
