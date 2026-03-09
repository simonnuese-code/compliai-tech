'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
    CheckCircle,
    Plane,
    Trophy,
    Settings,
    LogOut,
    ArrowRight,
    Sparkles,
    Shield,
    TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
    title: string
    description: string
    icon: React.ReactNode
    href: string
    gradient: string
    glowColor: string
    badge?: string
    badgeColor?: string
    delay: number
    features: string[]
}

function ServiceCard({ title, description, icon, href, gradient, glowColor, badge, badgeColor, delay, features }: ServiceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Link href={href} className="group block">
                <div className={cn(
                    "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl",
                    "transition-all duration-500 hover:scale-[1.02] hover:border-white/20",
                    "hover:shadow-2xl cursor-pointer h-full"
                )}
                    style={{ boxShadow: `0 0 0px ${glowColor}` }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 20px 60px -12px ${glowColor}`
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0px ${glowColor}`
                    }}
                >
                    {/* Gradient Background Effect */}
                    <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        gradient
                    )} />

                    {/* Content */}
                    <div className="relative p-8">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                                "flex h-14 w-14 items-center justify-center rounded-2xl",
                                "bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                                gradient.replace('bg-gradient-to-br', '')
                            )}
                                style={{ background: `linear-gradient(135deg, ${glowColor}, ${glowColor}dd)` }}
                            >
                                {icon}
                            </div>
                            {badge && (
                                <span className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                                    badgeColor || "bg-emerald-500/20 text-emerald-400"
                                )}>
                                    <Sparkles className="h-3 w-3" />
                                    {badge}
                                </span>
                            )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                            {title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed group-hover:text-slate-300 transition-colors">
                            {description}
                        </p>

                        {/* Features */}
                        <div className="space-y-2 mb-6">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                    <div className="h-1 w-1 rounded-full bg-slate-600 group-hover:bg-slate-400 transition-colors" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                            <span>Öffnen</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

export default function HubPageClient({ user }: { user: { name: string | null; email: string } }) {
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[100px]" />
            </div>

            {/* Top Navigation */}
            <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="relative h-8 w-40 block transition-opacity hover:opacity-80">
                        <Image
                            src="/compliai-logo-transparent.png"
                            alt="CompliAI"
                            fill
                            className="object-contain object-left"
                            priority
                            unoptimized
                        />
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/hub/settings"
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <Settings className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-white truncate max-w-[150px]">{user.name || 'User'}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors group"
                            title="Abmelden"
                        >
                            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                        Willkommen zurück,{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {user.name || 'User'}
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Wähle einen Service, um loszulegen.
                    </p>
                </motion.div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <ServiceCard
                        title="Compliance Check"
                        description="KI-System nach EU AI Act prüfen. Risikoanalyse, Dokumentation und Aufgabenmanagement."
                        icon={<Shield className="h-7 w-7 text-white" />}
                        href="/hub/compliance"
                        gradient="bg-gradient-to-br from-cyan-500/10 to-blue-500/10"
                        glowColor="#06b6d4"
                        delay={0.1}
                        features={[
                            "Compliance-Score & Risikobewertung",
                            "Automatische Empfehlungen",
                            "PDF-Berichte exportieren",
                        ]}
                    />

                    <ServiceCard
                        title="FlugTracker"
                        description="Flugpreise überwachen und automatisch über die besten Angebote informiert werden."
                        icon={<Plane className="h-7 w-7 text-white" />}
                        href="/hub/flugtracker"
                        gradient="bg-gradient-to-br from-sky-500/10 to-indigo-500/10"
                        glowColor="#3b82f6"
                        delay={0.2}
                        features={[
                            "Preisvergleich über mehrere Portale",
                            "Automatische Preis-Alerts",
                            "Wöchentliche E-Mail-Reports",
                        ]}
                    />



                    <ServiceCard
                        title="Sport-Bot"
                        description="Dein persönlicher Fußball-Assistent. Live-Ergebnisse, Spielpläne und WhatsApp-Benachrichtigungen."
                        icon={<Trophy className="h-7 w-7 text-white" />}
                        href="/hub/sportbot"
                        gradient="bg-gradient-to-br from-emerald-500/10 to-green-500/10"
                        glowColor="#22c55e"
                        badge="NEU"
                        badgeColor="bg-emerald-500/20 text-emerald-400"
                        delay={0.3}
                        features={[
                            "Live-Ergebnisse & Updates",
                            "WhatsApp-Benachrichtigungen",
                            "Alle europäischen Top-Ligen",
                        ]}
                    />
                </div>

                {/* Quick Stats / Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600"
                >
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <span>EU AI Act konform</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-500" />
                        <span>Compliance Management</span>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
