import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Download,
    CheckCircle,
    AlertTriangle,
    Shield,
    FileText,
    Server,
    Eye,
    PlayCircle,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function RisikoanalysePage() {
    const session = await getSession()
    if (!session.user?.id) return redirect('/login')

    const check = await prisma.complianceCheck.findFirst({
        where: {
            userId: session.user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    if (!check) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Risikoanalyse
                    </h1>
                    <p className="text-slate-500">
                        Detaillierte Risikoanalyse Ihres KI-Systems
                    </p>
                </div>
                <GlassCard padding="lg">
                    <EmptyState
                        icon={PlayCircle}
                        title="Keine Risikoanalyse gefunden"
                        description="Führen Sie Ihren ersten Compliance Check durch, um eine detaillierte Risikoanalyse zu erhalten."
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
            </div>
        )
    }

    const rawRecs = check.recommendations
    const recommendations = Array.isArray(rawRecs) ? rawRecs : []

    // Helper for risk colors
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'MINIMAL': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
            case 'LIMITED': return 'text-amber-600 bg-amber-50 border-amber-200'
            case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
            case 'UNACCEPTABLE': return 'text-rose-900 bg-rose-100 border-rose-300'
            default: return 'text-slate-600 bg-slate-50 border-slate-200'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500'
        if (score >= 60) return 'text-amber-500'
        return 'text-red-500'
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Risikoanalyse
                    </h1>
                    <p className="text-slate-500">
                        Aktuelle Analyse vom {new Date(check.createdAt).toLocaleDateString('de-DE')} um {new Date(check.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <a href={`/api/checks/${check.id}/export`} download>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            PDF Export
                        </Button>
                    </a>
                    <Link href="/dashboard/check/new">
                        <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20">
                            Neuer Check
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Overall Score */}
                <GlassCard padding="lg" className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-slate-500 font-medium mb-4">Gesamt-Score</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-slate-100"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className={cn(
                                    "transition-all duration-1000 ease-out",
                                    check.overallScore && check.overallScore >= 80 ? "stroke-emerald-500" :
                                        check.overallScore && check.overallScore >= 60 ? "stroke-amber-500" : "stroke-red-500"
                                )}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={351}
                                strokeDashoffset={351 - (351 * (check.overallScore || 0)) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className={cn("text-3xl font-bold", getScoreColor(check.overallScore || 0))}>
                                {check.overallScore}
                            </span>
                            <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Risk Level */}
                <GlassCard padding="lg" className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-slate-500 font-medium mb-4">Risikostufe</h3>
                    <div className={cn(
                        "px-6 py-3 rounded-full border-2 text-lg font-bold mb-2",
                        getRiskColor(check.riskLevel || 'UNKNOWN')
                    )}>
                        {check.riskLevel === 'MINIMAL' ? 'Minimal' :
                            check.riskLevel === 'LIMITED' ? 'Begrenzt' :
                                check.riskLevel === 'HIGH' ? 'Hoch' :
                                    check.riskLevel === 'UNACCEPTABLE' ? 'Unzulässig' : check.riskLevel}
                    </div>
                    <p className="text-sm text-slate-500 max-w-[200px]">
                        Basierend auf EU AI Act Klassifizierung
                    </p>
                </GlassCard>

                {/* Status */}
                <GlassCard padding="lg" className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-slate-500 font-medium mb-4">Status</h3>
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">Abgeschlossen</p>
                </GlassCard>
            </div>

            {/* Category Breakdown */}
            <div className="grid md:grid-cols-3 gap-6">
                <ScoreCard
                    title="Dokumentation"
                    score={check.documentationScore || 0}
                    icon={FileText}
                    description="Technische Dokumentation & Aufzeichnungen"
                />
                <ScoreCard
                    title="Technische Robustheit"
                    score={check.technicalScore || 0}
                    icon={Server}
                    description="Cybersicherheit & Genauigkeit"
                />
                <ScoreCard
                    title="Governance"
                    score={check.governanceScore || 0}
                    icon={Shield}
                    description="Menschliche Aufsicht & Risikomanagement"
                />
            </div>


        </div>
    )
}

function ScoreCard({ title, score, icon: Icon, description }: { title: string, score: number, icon: any, description: string }) {
    return (
        <GlassCard padding="md">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <span className={cn(
                    "text-lg font-bold",
                    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                    {score}/100
                </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 mb-3">{description}</p>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${score}%` }}
                />
            </div>
        </GlassCard>
    )
}
