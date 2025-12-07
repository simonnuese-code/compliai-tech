import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/glass-card'
import { FileText, Download, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DokumentationPage() {
    const session = await getSession()
    if (!session.user?.id) return redirect('/login')

    const documents = await prisma.document.findMany({
        where: {
            userId: session.user.id,
            type: 'COMPLIANCE_REPORT'
        },
        orderBy: { updatedAt: 'desc' },
        include: {
            check: {
                select: {
                    riskLevel: true,
                    overallScore: true
                }
            }
        }
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Dokumentation
                </h1>
                <p className="text-slate-500">
                    Verwalten Sie Ihre technische Dokumentation und Berichte
                </p>
            </div>

            <div className="grid gap-4">
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <GlassCard key={doc.id} padding="md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start md:items-center gap-4">
                                    <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900 truncate pr-2">
                                            {doc.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(doc.updatedAt).toLocaleDateString('de-DE')}
                                            </span>
                                            {doc.check && (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    Score: {doc.check.overallScore}/100
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <a href={`/api/checks/${doc.checkId}/export`} download className="md:self-center self-end">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Download
                                    </Button>
                                </a>
                            </div>
                        </GlassCard>
                    ))
                ) : (
                    <GlassCard padding="lg">
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                Keine Dokumente vorhanden
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                Führen Sie einen Compliance Check durch und exportieren Sie das Ergebnis, um hier Dokumente zu sehen.
                            </p>
                            <Link href="/dashboard/check/new">
                                <Button>Neuen Check starten</Button>
                            </Link>
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    )
}
