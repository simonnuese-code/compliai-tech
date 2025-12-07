import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/glass-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    Plus,
    CheckCircle,
    Clock,
    FileText,
    Download,
    AlertTriangle,
    ArrowRight
} from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'
import { cn } from '@/lib/utils'

export default async function CheckPage() {
    const session = await getSession()
    if (!session.user?.id) return null

    const checks = await prisma.complianceCheck.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            status: true,
            riskLevel: true,
            overallScore: true,
            createdAt: true,
            completedAt: true
        }
    })

    const hasNoChecks = checks.length === 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Compliance Checks
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Bewerten Sie Ihr KI-System gemäß EU AI Act
                    </p>
                </div>
                <Link href="/dashboard/check/new" className="w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto group rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Neuer Check
                    </Button>
                </Link>
            </div>

            {checks.length === 0 ? (
                <GlassCard padding="lg">
                    <EmptyState
                        icon={FileText}
                        title="Keine Checks gefunden"
                        description="Starten Sie Ihren ersten Compliance Check, um Risiken zu identifizieren."
                        action={
                            <Link href="/dashboard/check/new">
                                <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20">
                                    Jetzt starten
                                </Button>
                            </Link>
                        }
                    />
                </GlassCard>
            ) : (
                <div className="grid gap-4">
                    {checks.map((check) => (
                        <Link key={check.id} href={`/dashboard/check/${check.id}`} className="block group">
                            <GlassCard padding="md" hover>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start md:items-center gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl flex-shrink-0",
                                            check.status === 'COMPLETED'
                                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                                                : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50"
                                        )}>
                                            {check.status === 'COMPLETED' ? (
                                                <CheckCircle className="w-6 h-6" />
                                            ) : (
                                                <AlertTriangle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">
                                                Compliance Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    ID: {check.id.slice(0, 8)}...
                                                </span>
                                                {check.overallScore && (
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Score: {check.overallScore}/100
                                                    </span>
                                                )}
                                                {check.riskLevel && (
                                                    <Badge
                                                        variant={check.riskLevel === 'HIGH' || check.riskLevel === 'UNACCEPTABLE' ? 'destructive' : 'outline'}
                                                        className={cn(
                                                            check.riskLevel === 'MINIMAL' && "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                                                            check.riskLevel === 'LIMITED' && "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                                                            check.riskLevel === 'HIGH' && "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
                                                        )}
                                                    >
                                                        {check.riskLevel === 'MINIMAL' ? 'Minimal' :
                                                            check.riskLevel === 'LIMITED' ? 'Begrenzt' :
                                                                check.riskLevel === 'HIGH' ? 'Hoch' :
                                                                    check.riskLevel === 'UNACCEPTABLE' ? 'Unzulässig' : check.riskLevel}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 md:self-center self-end">
                                        <div className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:bg-slate-100 dark:group-hover:bg-slate-800")}>
                                            Details
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
