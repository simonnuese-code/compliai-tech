import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/dashboard/stat-card'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import {
    CheckCircle,
    AlertTriangle,
    ListTodo,
    TrendingUp,
    ArrowRight,
    PlayCircle,
    FileText,
    BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/dashboard/empty-state'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
    const session = await getSession()

    if (!session.user?.id) return null

    // Fetch User Stats
    const [user, checksCount, openTasksCount, latestChecks] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, onboarded: true }
        }),
        prisma.complianceCheck.count({
            where: { userId: session.user.id }
        }),
        prisma.task.count({
            where: {
                userId: session.user.id,
                status: { in: ['OPEN', 'IN_PROGRESS'] }
            }
        }),
        prisma.complianceCheck.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true,
                status: true,
                riskLevel: true,
                overallScore: true,
                createdAt: true
            }
        })
    ])

    const hasNoChecks = checksCount === 0

    // Calculate Compli-Score and Trend
    const currentScore = latestChecks[0]?.overallScore || 0
    const previousScore = latestChecks[1]?.overallScore || 0
    const scoreTrend = checksCount > 1 ? currentScore - previousScore : 0

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Willkommen zurück, <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">{user?.name}</span>
                </h1>
                <p className="text-slate-500">
                    Hier ist Ihre Compliance-Übersicht
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Durchgeführte Checks"
                    value={checksCount}
                    icon={<CheckCircle className="w-6 h-6 text-cyan-600" />}
                    color="blue"
                />
                <StatCard
                    title={
                        <span>
                            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent font-bold">Compli</span>
                            -Score
                        </span>
                    }
                    value={`${currentScore}/100`}
                    icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                    color="green"
                    trend={checksCount > 1 ? { value: Math.abs(scoreTrend), isPositive: scoreTrend >= 0 } : undefined}
                />
                <StatCard
                    title="Offene Aufgaben"
                    value={openTasksCount}
                    icon={<ListTodo className="w-6 h-6 text-amber-600" />}
                    color="amber"
                />
                <StatCard
                    title="Risikostufe"
                    value={latestChecks[0]?.riskLevel ? (
                        latestChecks[0].riskLevel === 'MINIMAL' ? 'Minimal' :
                            latestChecks[0].riskLevel === 'LIMITED' ? 'Begrenzt' :
                                latestChecks[0].riskLevel === 'HIGH' ? 'Hoch' :
                                    latestChecks[0].riskLevel === 'UNACCEPTABLE' ? 'Unzulässig' : 'Unbekannt'
                    ) : "N/A"}
                    icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                    color={latestChecks[0]?.riskLevel === 'HIGH' || latestChecks[0]?.riskLevel === 'UNACCEPTABLE' ? 'red' : 'green'}
                />
            </div>

            {/* Main Content Area */}
            {hasNoChecks ? (
                // Empty State - Erster Check
                <GlassCard padding="lg">
                    <EmptyState
                        icon={PlayCircle}
                        title="Starten Sie Ihren ersten Compliance Check"
                        description="Bewerten Sie Ihr KI-System in nur 10 Minuten und erhalten Sie eine detaillierte Risikoanalyse gemäß EU AI Act."
                        action={
                            <Link href="/dashboard/check/new">
                                <Button size="lg" className="group rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20">
                                    Check starten
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        }
                    />
                </GlassCard>
            ) : (
                // Has Checks - Show Latest
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Checks */}
                    <GlassCard padding="lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Letzte Checks
                            </h2>
                            <Link
                                href="/dashboard/check"
                                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center gap-1"
                            >
                                Alle anzeigen
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {latestChecks.map((check) => (
                                <Link
                                    key={check.id}
                                    href={`/dashboard/check/${check.id}`}
                                    className="block p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-900 font-medium">
                                                Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Score: {check.overallScore || 'N/A'}/100
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium",
                                            check.status === 'COMPLETED'
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                        )}>
                                            {check.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Bearbeitung'}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Quick Actions */}
                    <GlassCard padding="lg">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">
                            Schnellaktionen
                        </h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/check/new"
                                className="block p-4 rounded-xl bg-cyan-50 hover:bg-cyan-100/50 border border-cyan-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white border border-cyan-100 shadow-sm">
                                        <CheckCircle className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-900 font-medium">Neuer Check</p>
                                        <p className="text-sm text-slate-500">Compliance prüfen</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-cyan-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/dokumentation"
                                className="block p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                                        <FileText className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-900 font-medium">Dokumentation</p>
                                        <p className="text-sm text-slate-500">Templates erstellen</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/berichte"
                                className="block p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                                        <BarChart3 className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-900 font-medium">Bericht exportieren</p>
                                        <p className="text-sm text-slate-500">PDF generieren</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Onboarding Checklist (nur für neue User) */}
            {!user?.onboarded && (
                <GlassCard padding="lg">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Erste Schritte mit CompliAI
                    </h2>
                    <div className="space-y-3">
                        {/* Checklist items */}
                        <p className="text-gray-400">Willkommen! Starten Sie mit Ihrem ersten Compliance Check.</p>
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
