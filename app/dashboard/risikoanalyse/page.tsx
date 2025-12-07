import { GlassCard } from '@/components/ui/glass-card'
import { AlertTriangle } from 'lucide-react'

export default function RisikoanalysePage() {
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
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 mb-4">
                        <AlertTriangle className="w-8 h-8 text-cyan-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Bald verfügbar
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Diese Funktion wird in Kürze verfügbar sein.
                    </p>
                </div>
            </GlassCard>
        </div>
    )
}
