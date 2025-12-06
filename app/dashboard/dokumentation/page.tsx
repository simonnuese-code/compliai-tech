import { GlassCard } from '@/components/ui/glass-card'
import { FileText } from 'lucide-react'

export default function DokumentationPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                    Dokumentation
                </h1>
                <p className="text-gray-400">
                    Verwalten Sie Ihre technische Dokumentation
                </p>
            </div>

            <GlassCard padding="lg">
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-4">
                        <FileText className="w-8 h-8 text-sky-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Bald verfügbar
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Diese Funktion wird in Kürze verfügbar sein.
                    </p>
                </div>
            </GlassCard>
        </div>
    )
}
