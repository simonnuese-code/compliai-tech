'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Fragebogen-Daten
const questionnaireSteps = [
    {
        title: "Allgemeine Informationen",
        questions: [
            {
                id: 'ai_purpose',
                question: 'Was ist der Hauptzweck Ihres KI-Systems?',
                type: 'textarea',
                required: true
            },
            {
                id: 'ai_users',
                question: 'Wer sind die Hauptnutzer des Systems?',
                type: 'select',
                options: ['Endverbraucher', 'Unternehmen (B2B)', 'Interne Mitarbeiter', 'Öffentliche Verwaltung'],
                required: true
            }
        ]
    },
    {
        title: "Daten & Training",
        questions: [
            {
                id: 'data_source',
                question: 'Woher stammen die Trainingsdaten?',
                type: 'select',
                options: ['Öffentlich verfügbar', 'Intern generiert', 'Gekauft / Lizenziert', 'Nutzerdaten'],
                required: true
            },
            {
                id: 'personal_data',
                question: 'Werden personenbezogene Daten verarbeitet?',
                type: 'select',
                options: ['Ja, sensibel (Gesundheit, Biometrie)', 'Ja, allgemein (Name, Email)', 'Nein, nur anonymisiert', 'Nein, gar nicht'],
                required: true
            }
        ]
    }
]

export default function NewCheckPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)

    const totalSteps = questionnaireSteps.length
    const progress = ((currentStep + 1) / totalSteps) * 100

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(current => current + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(current => current - 1)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            })

            const data = await res.json()

            if (res.ok) {
                router.push(`/dashboard/check/${data.id}`)
            }
        } catch (error) {
            console.error('Submit error:', error)
        }
        setLoading(false)
    }

    const currentStepData = questionnaireSteps[currentStep]

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                    Neuer Compliance Check
                </h1>
                <p className="text-gray-400">
                    Schritt {currentStep + 1} von {totalSteps}
                </p>
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-2" />

            {/* Questions */}
            <GlassCard padding="lg">
                <h2 className="text-2xl font-semibold text-white mb-6">
                    {currentStepData.title}
                </h2>

                <div className="space-y-6">
                    {currentStepData.questions.map((q) => (
                        <div key={q.id}>
                            <label className="block text-white font-medium mb-2">
                                {q.question}
                                {q.required && <span className="text-red-400 ml-1">*</span>}
                            </label>

                            {q.type === 'textarea' && (
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    rows={4}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder="Ihre Antwort..."
                                />
                            )}

                            {q.type === 'select' && (
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-900"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                >
                                    <option value="">Bitte wählen...</option>
                                    {q.options?.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Zurück
                </Button>

                {currentStep === totalSteps - 1 ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        size="lg"
                    >
                        {loading ? 'Wird analysiert...' : 'Check abschließen'}
                    </Button>
                ) : (
                    <Button onClick={handleNext} size="lg">
                        Weiter
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    )
}
