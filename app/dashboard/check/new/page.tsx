'use client'

import { useRouter } from 'next/navigation'
import QuestionnaireWizard from '@/components/questionnaire/questionnaire-wizard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCheckPage() {
    const router = useRouter()

    const handleComplete = async (answers: Record<string, any>) => {
        try {
            const res = await fetch('/api/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Speichern')
            }

            router.push(`/dashboard/check/${data.id}`)
        } catch (error: any) {
            console.error('Submit error:', error)
            alert('Ein Fehler ist aufgetreten: ' + error.message)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/check"
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Neuer Compliance Check
                    </h1>
                    <p className="text-slate-500">
                        Führen Sie eine vollständige Bewertung Ihres KI-Systems durch
                    </p>
                </div>
            </div>

            <QuestionnaireWizard
                mode="dashboard"
                onComplete={handleComplete}
            />
        </div>
    )
}
