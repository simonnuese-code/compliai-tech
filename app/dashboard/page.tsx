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

    // Calculate completion rate
    const completedChecks = await prisma.complianceCheck.count({
        where: {
            userId: session.user.id,
            status: 'COMPLETED'
        }
    })
    const completionRate = checksCount > 0
        ? Math.round((completedChecks / checksCount) * 100)
        : 0

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                    Willkommen zurück, {user?.name}! 👋
                </h1>
                <p className="text-gray-400">
                    Hier ist Ihre Compliance-Übersicht
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Durchgeführte Checks"
                    value={checksCount}
                    icon={CheckCircle}
                    color="blue"
                />
                <StatCard
                    title="Compliance-Rate"
                    value={`${completionRate}%`}
                    icon={TrendingUp}
                    color="green"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Offene Aufgaben"
                    value={openTasksCount}
                    icon={ListTodo}
                    color="amber"
                />
                <StatCard
                    title="Risikostufe"
                    value={latestChecks[0]?.riskLevel || "N/A"}
                    icon={AlertTriangle}
                    color={latestChecks[0]?.riskLevel === 'HIGH' ? 'red' : 'green'}
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
                                <Button size="lg" className="group">
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
                            <h2 className="text-xl font-semibold text-white">
                                Letzte Checks
                            </h2>
                            <Link
                                href="/dashboard/check"
                                className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1"
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
                                    className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">
                                                Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Score: {check.overallScore || 'N/A'}/100
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium",
                                            check.status === 'COMPLETED'
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-amber-500/20 text-amber-400"
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
                        <h2 className="text-xl font-semibold text-white mb-6">
                            Schnellaktionen
                        </h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/check/new"
                                className="block p-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-sky-500/20">
                                        <CheckCircle className="w-5 h-5 text-sky-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Neuer Check</p>
                                        <p className="text-sm text-gray-400">Compliance prüfen</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/dokumentation"
                                className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Dokumentation</p>
                                        <p className="text-sm text-gray-400">Templates erstellen</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/berichte"
                                className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <BarChart3 className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Bericht exportieren</p>
                                        <p className="text-sm text-gray-400">PDF generieren</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
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
