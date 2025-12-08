'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Minus, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const plans = [
    {
        id: 'starter',
        name: "Starter",
        description: "Für kleine Teams",
        target: "<10 Mitarbeiter",
        priceMonthly: 120,
        priceYearly: 1200,
        saving: 240,
        features: [
            "Kostenloser AI Compliance Check",
            "Automatische Risikoklassifizierung",
            "Compliance Dashboard mit Compli-Score",
            "1 KI-System registrierbar",
            "Basis-Dokumentationsvorlagen",
            "Email Support"
        ],
        highlight: false,
        cta: "Jetzt starten",
        href: "/register?plan=starter"
    },
    {
        id: 'professional',
        name: "Professional",
        description: "Für wachsende Unternehmen",
        target: "10-49 Mitarbeiter",
        priceMonthly: 360,
        priceYearly: 3600,
        saving: 720,
        features: [
            "Alles aus Starter, PLUS:",
            "Bis zu 5 KI-Systeme",
            "Automatischer Dokumentengenerator",
            "Prioritäts-Email & Chat Support",
            "Erweiterter AI Assistant (500 Fragen/Monat)",
            "Gesetzesänderungs-Alerts",
            "Team-Collaboration (bis zu 3 User)"
        ],
        highlight: true,
        cta: "Jetzt starten",
        href: "/register?plan=professional"
    },
    {
        id: 'business',
        name: "Business",
        description: "Für mittelgroße Unternehmen",
        target: "50-249 Mitarbeiter",
        priceMonthly: 960,
        priceYearly: 9600,
        saving: 1920,
        features: [
            "Alles aus Professional, PLUS:",
            "Unbegrenzte KI-Systeme",
            "Dedizierter Customer Success Manager",
            "Priority Support (24h Response Time)",
            "Unbegrenzter AI Assistant",
            "NIS2 & CSRD Add-on Module inklusive",
            "API-Zugang für Integrationen",
            "Advanced Analytics & Reporting"
        ],
        highlight: false,
        cta: "Jetzt starten",
        href: "/register?plan=business"
    },
    {
        id: 'enterprise',
        name: "Enterprise",
        description: "Maßgeschneiderte Lösungen",
        target: "250+ Mitarbeiter",
        priceMonthly: null,
        priceYearly: null,
        saving: 0,
        features: [
            "Alles aus Business, PLUS:",
            "Maßgeschneiderte Lösung",
            "Dediziertes Account Management",
            "White-Label Plattform",
            "Individuelle Schulungen",
            "Custom Feature Development"
        ],
        highlight: false,
        cta: "Kontakt aufnehmen",
        href: "mailto:service@compliai.tech?subject=Anfrage Enterprise Plan"
    }
]

const faqs = [
    {
        question: "Kann ich jederzeit kündigen?",
        answer: "Ja, Sie können Ihr Abonnement jederzeit zum Ende des aktuellen Abrechnungszeitraums kündigen. Es gibt keine langfristigen Bindungen, es sei denn, Sie entscheiden sich für die jährliche Zahlung."
    },
    {
        question: "Was passiert bei einem Upgrade?",
        answer: "Wenn Sie ein Upgrade durchführen, wird der bereits gezahlte Betrag anteilig verrechnet. Sie zahlen nur die Differenz für die verbleibende Zeit des Abrechnungszeitraums."
    },
    {
        question: "Gibt es eine Geld-zurück-Garantie?",
        answer: "Ja, wir bieten eine 30-tägige Geld-zurück-Garantie für alle Neukunden. Wenn Sie nicht zufrieden sind, erhalten Sie Ihr Geld zurück – ohne Fragen."
    },
    {
        question: "Sind meine Daten sicher?",
        answer: "Sicherheit hat bei uns höchste Priorität. Wir nutzen modernste Verschlüsselungstechnologien und hosten unsere Server in ISO-zertifizierten Rechenzentren in Deutschland."
    }
]

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false)
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    return (
        <div className="relative z-10 pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-24">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 md:mb-6"
                >
                    Transparente Preise.<br />
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Keine versteckten Kosten.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-600 max-w-2xl mx-auto mb-10"
                >
                    Wählen Sie den Plan, der zu Ihrer Unternehmensgröße passt. Jederzeit kündbar.
                </motion.p>

                {/* Toggle */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-4"
                >
                    <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-slate-900" : "text-slate-500")}>
                        Monatlich
                    </span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className="relative w-14 h-8 rounded-full bg-slate-200 p-1 transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                        <motion.div
                            className="w-6 h-6 rounded-full bg-white shadow-sm"
                            animate={{ x: isYearly ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                    <span className={cn("text-sm font-medium transition-colors flex items-center gap-2", isYearly ? "text-slate-900" : "text-slate-500")}>
                        Jährlich
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            20% sparen
                        </span>
                    </span>
                </motion.div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16 md:mb-24">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className={cn(
                            "relative",
                            plan.highlight && "md:-mt-8 md:mb-8 z-10"
                        )}
                    >
                        <GlassCard
                            className={cn(
                                "h-full flex flex-col relative overflow-hidden transition-all duration-300",
                                plan.highlight
                                    ? "border-cyan-200 shadow-xl shadow-cyan-500/10 scale-100 md:scale-105"
                                    : "hover:border-slate-300 hover:shadow-lg hover:-translate-y-2"
                            )}
                            padding="lg"
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                            )}
                            {plan.highlight && (
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm">
                                        <Star className="w-3 h-3 fill-current" />
                                        BESTSELLER
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                                <p className="text-sm text-slate-500 mb-2">{plan.description}</p>
                                <div className="inline-block px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                    {plan.target}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-6 h-20">
                                {plan.priceMonthly !== null ? (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-slate-900">
                                                {isYearly ? plan.priceYearly?.toLocaleString('de-DE') : plan.priceMonthly?.toLocaleString('de-DE')} €
                                            </span>
                                            <span className="text-slate-500">
                                                /{isYearly ? 'Jahr' : 'Monat'}
                                            </span>
                                        </div>
                                        {isYearly && plan.saving > 0 && (
                                            <p className="text-sm text-emerald-600 mt-1 font-medium">
                                                Sie sparen {plan.saving} €
                                            </p>
                                        )}
                                        {isYearly && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                {Math.round(plan.priceYearly! / 12)} € / Monat (jährlich)
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-slate-900">
                                            Individuell
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* CTA */}
                            <div className="mb-8">
                                <Link href={plan.href} className="block">
                                    <Button
                                        className={cn(
                                            "w-full rounded-xl h-12 text-base font-medium transition-all duration-300",
                                            plan.highlight
                                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 border-0"
                                                : "bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </div>

                            {/* Features */}
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900 mb-4">
                                    {plan.id === 'starter' ? 'Alles was Sie brauchen:' : `Alles aus ${plans[index - 1]?.name}, PLUS:`}
                                </p>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                            {feature.startsWith("Alles aus") ? (
                                                <span className="font-medium text-slate-900">{feature}</span>
                                            ) : (
                                                <>
                                                    <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                                    <span className="leading-tight">
                                                        {feature.includes("Compli-Score") ? (
                                                            <>
                                                                Compliance Dashboard mit <span className="text-sky-500 font-semibold">Compli</span>-Score
                                                            </>
                                                        ) : (
                                                            feature
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mb-16 md:mb-24">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Häufig gestellte Fragen</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <GlassCard
                            key={index}
                            className="cursor-pointer overflow-hidden transition-all duration-300 hover:border-slate-300"
                            padding="none"
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        >
                            <div className="p-6 flex items-center justify-between gap-4">
                                <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                                {openFaq === index ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <AnimatePresence>
                                {openFaq === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mb-12 md:mb-20">
                <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-500">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-cyan-200 blur-3xl" />
                    </div>

                    <div className="relative z-10 py-20 px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-sm">
                            Bereit für stressfreie Compliance?
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Starten Sie jetzt Ihren kostenlosen Compliance Check. <br className="hidden md:block" />
                            Sicher, schnell und ohne Verpflichtungen.
                        </p>
                        <Link href="/register">
                            <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-white text-blue-600 hover:bg-slate-50 border-0 font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                                Jetzt kostenlos testen
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
