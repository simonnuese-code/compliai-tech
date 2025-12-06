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
    Download
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

            {hasNoChecks ? (
                <GlassCard padding="lg">
                    <EmptyState
                        icon={FileText}
                        title="Noch keine Checks durchgeführt"
                        description="Starten Sie Ihren ersten Compliance Check und erhalten Sie eine detaillierte Bewertung Ihres KI-Systems."
                        action={
                            <Link href="/dashboard/check/new">
                                <Button size="lg">
                                    Ersten Check starten
                                </Button>
                            </Link>
                        }
                    />
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {checks.map((check) => (
                        <GlassCard key={check.id} padding="lg" hover>
                            <Link href={`/dashboard/check/${check.id}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            check.status === 'COMPLETED'
                                                ? "bg-emerald-500/20"
                                                : "bg-amber-500/20"
                                        )}>
                                            {check.status === 'COMPLETED' ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                                            ) : (
                                                <Clock className="w-6 h-6 text-amber-400" />
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-gray-400">
                                                    Score: {check.overallScore || 'N/A'}/100
                                                </span>
                                                {check.riskLevel && (
                                                    <Badge
                                                        variant={check.riskLevel === 'HIGH' || check.riskLevel === 'UNACCEPTABLE' ? 'destructive' : 'outline'}
                                                        className={cn(
                                                            check.riskLevel === 'MINIMAL' && "text-emerald-400 border-emerald-400/50",
                                                            check.riskLevel === 'LIMITED' && "text-amber-400 border-amber-400/50",
                                                        )}
                                                    >
                                                        {check.riskLevel}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {check.status === 'COMPLETED' && (
                                            <Button variant="ghost" size="sm">
                                                <Download className="w-4 h-4 mr-2" />
                                                PDF
                                            </Button>
                                        )}
                                        <Badge variant={
                                            check.status === 'COMPLETED' ? 'default' : 'secondary'
                                        }>
                                            {check.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Bearbeitung'}
                                        </Badge>
                                    </div>
                                </div>
                            </Link>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}
