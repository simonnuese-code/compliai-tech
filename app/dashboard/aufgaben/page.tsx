import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListTodo, CheckCircle2, ArrowRight, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function AufgabenPage() {
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

    const rawRecs = check?.recommendations
    const recommendations = Array.isArray(rawRecs) ? rawRecs : []

    if (!check || recommendations.length === 0) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Aufgaben
                    </h1>
                    <p className="text-slate-500">
                        Verwalten Sie Ihre Compliance-Aufgaben
                    </p>
                </div>

                <GlassCard padding="lg">
                    <EmptyState
                        icon={ListTodo}
                        title="Keine offenen Aufgaben"
                        description="Führen Sie einen Compliance Check durch, um personalisierte Handlungsempfehlungen zu erhalten."
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Aufgaben
                </h1>
                <p className="text-slate-500">
                    Basierend auf Ihrem letzten Compliance-Check vom {new Date(check.createdAt).toLocaleDateString('de-DE')}
                </p>
            </div>

            <div className="grid gap-4">
                {recommendations.map((rec: any, index: number) => (
                    <GlassCard key={index} padding="md" className="group hover:border-cyan-200 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className={cn(
                                    "mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                    rec.priority === 'HIGH' ? "bg-red-50 border-red-100 text-red-600" :
                                        rec.priority === 'MEDIUM' ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-blue-50 border-blue-100 text-blue-600"
                                )}>
                                    <ListTodo className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-slate-900 truncate pr-2 w-full md:w-auto">
                                            {rec.title}
                                        </h3>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-xs bg-slate-50">
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
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {rec.description}
                                    </p>
                                </div>
                            </div>

                            {/* Placeholder for future "Mark as done" functionality */}
                            <div className="flex-shrink-0 self-end md:self-center">
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50">
                                    <CheckCircle2 className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    )
}
