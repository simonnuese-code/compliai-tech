import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Compliance Checks
                    </h1>
                    <p className="text-gray-400">
                        Bewerten Sie Ihr KI-System gemäß EU AI Act
                    </p>
                </div>
                <Link href="/dashboard/check/new">
                    <Button size="lg" className="group">
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
                        <GlassCard key={check.id} padding="md" hover>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl",
                                        check.status === 'COMPLETED'
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                            : "bg-amber-50 text-amber-600 border border-amber-100"
                                    )}>
                                        {check.status === 'COMPLETED' ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            Compliance Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-sm text-slate-500">
                                                ID: {check.id.slice(0, 8)}...
                                            </span>
                                            {check.overallScore && (
                                                <span className="text-sm font-medium text-slate-700">
                                                    Score: {check.overallScore}/100
                                                </span>
                                            )}
                                            {check.riskLevel && (
                                                <Badge
                                                    variant={check.riskLevel === 'HIGH' || check.riskLevel === 'UNACCEPTABLE' ? 'destructive' : 'outline'}
                                                    className={cn(
                                                        check.riskLevel === 'MINIMAL' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                        check.riskLevel === 'LIMITED' && "bg-amber-50 text-amber-700 border-amber-200",
                                                        check.riskLevel === 'HIGH' && "bg-red-50 text-red-700 border-red-200",
                                                    )}
                                                >
                                                    {check.riskLevel}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link href={`/dashboard/check/${check.id}`}>
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                            Details
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}
