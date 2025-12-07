'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import QuestionnaireWizard from '@/components/questionnaire/questionnaire-wizard'
import { GlassCard } from '@/components/ui/glass-card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestPage() {
    const router = useRouter()

    const handleComplete = (answers: Record<string, any>) => {
        // Save final answers
        localStorage.setItem('compliai_check_final', JSON.stringify(answers))
        // Redirect to register
        router.push('/register?from=test')
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Zurück zur Startseite
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                        <span className="text-white font-bold">C</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">CompliAI</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-slate-900 mb-4"
                    >
                        Kostenloser Compliance Check
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-500"
                    >
                        Prüfen Sie Ihr KI-System in wenigen Minuten auf Konformität mit dem EU AI Act.
                    </motion.p>
                </div>

                <QuestionnaireWizard
                    mode="landing"
                    onComplete={handleComplete}
                />
            </div>
        </div>
    )
}
