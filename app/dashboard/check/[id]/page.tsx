import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Download,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    Shield,
    FileText,
    Server,
    Eye
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CheckResultPageProps {
    params: {
        id: string
    }
}

export default async function CheckResultPage({ params }: CheckResultPageProps) {
    const session = await getSession()
    if (!session.user?.id) return redirect('/login')

    const { id } = await params

    const check = await prisma.complianceCheck.findUnique({
        where: {
            id: id,
            userId: session.user.id
        }
    })

    if (!check) return notFound()

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
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/check" className="text-slate-400 hover:text-slate-600 transition-colors">
                            Compliance Checks
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-900 font-medium">Ergebnis</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Check-Ergebnis
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Durchgeführt am {new Date(check.createdAt).toLocaleDateString('de-DE')} um {new Date(check.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
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

            {/* Recommendations */}
            <GlassCard padding="lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-100">
                        <Eye className="w-5 h-5 text-cyan-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Handlungsempfehlungen</h2>
                </div>

                {recommendations.length > 0 ? (
                    <div className="space-y-4">
                        {recommendations.map((rec: any, index) => (
                            <div
                                key={index}
                                className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex gap-4"
                            >
                                <div className={cn(
                                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                    rec.priority === 'HIGH' ? "bg-red-500" :
                                        rec.priority === 'MEDIUM' ? "bg-amber-500" : "bg-blue-500"
                                )} />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                                        <Badge variant="outline" className="text-xs">
                                            {rec.category}
                                        </Badge>
                                        <Badge variant="outline" className={cn(
                                            "text-xs",
                                            rec.priority === 'HIGH' ? "text-red-600 bg-red-50 border-red-200" :
                                                rec.priority === 'MEDIUM' ? "text-amber-600 bg-amber-50 border-amber-200" : "text-blue-600 bg-blue-50 border-blue-200"
                                        )}>
                                            {rec.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-600 text-sm">
                                        {rec.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        Keine spezifischen Empfehlungen gefunden. Ihr System scheint gut aufgestellt zu sein!
                    </div>
                )}
            </GlassCard>
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
