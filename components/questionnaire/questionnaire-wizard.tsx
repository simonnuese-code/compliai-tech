'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Save,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GlassCard } from '@/components/ui/glass-card'
import { questionnaireData } from '@/lib/questionnaire-data'
import { cn } from '@/lib/utils'
import { Question, QuestionOption } from '@/types/questionnaire'

interface QuestionnaireWizardProps {
    mode: 'landing' | 'dashboard'
    initialAnswers?: Record<string, any>
    onComplete: (answers: Record<string, any>) => void
    onSave?: (answers: Record<string, any>) => void
}

export default function QuestionnaireWizard({
    mode,
    initialAnswers = {},
    onComplete,
    onSave
}: QuestionnaireWizardProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers)
    const [direction, setDirection] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Load draft from local storage if on landing page
    useEffect(() => {
        if (mode === 'landing') {
            const savedDraft = localStorage.getItem('compliai_check_draft')
            if (savedDraft) {
                try {
                    const { answers: savedAnswers, step } = JSON.parse(savedDraft)
                    setAnswers(prev => ({ ...prev, ...savedAnswers }))
                    if (typeof step === 'number' && step < questionnaireData.length) {
                        setCurrentStepIndex(step)
                    }
                } catch (e) {
                    console.error('Failed to load draft', e)
                }
            }
        }
    }, [mode])

    // Save draft to local storage
    useEffect(() => {
        if (mode === 'landing') {
            localStorage.setItem('compliai_check_draft', JSON.stringify({
                answers,
                step: currentStepIndex,
                timestamp: Date.now()
            }))
        }
        if (onSave) {
            onSave(answers)
        }
    }, [answers, currentStepIndex, mode, onSave])

    const currentStep = questionnaireData[currentStepIndex]
    const isLastStep = currentStepIndex === questionnaireData.length - 1
    const progress = ((currentStepIndex + 1) / questionnaireData.length) * 100

    const validateStep = () => {
        const newErrors: Record<string, string> = {}
        let isValid = true

        currentStep.questions.forEach(q => {
            if (q.required && !answers[q.id]) {
                newErrors[q.id] = 'Dies ist ein Pflichtfeld'
                isValid = false
            }
        })

        setErrors(newErrors)
        return isValid
    }

    const handleNext = () => {
        if (!validateStep()) return

        if (isLastStep) {
            onComplete(answers)
        } else {
            setDirection(1)
            setCurrentStepIndex(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleBack = () => {
        setDirection(-1)
        setCurrentStepIndex(prev => prev - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleAnswer = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
        // Clear error if exists
        if (errors[questionId]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[questionId]
                return newErrors
            })
        }
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Progress Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">
                        Schritt {currentStepIndex + 1} von {questionnaireData.length}
                    </span>
                    <span className="text-sm font-medium text-cyan-600">
                        {Math.round(progress)}%
                    </span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-500" />
            </div>

            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentStepIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <GlassCard padding="lg" className="border-slate-200 shadow-lg">
                        {/* Step Header */}
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                            {currentStep.icon && (
                                <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
                                    <currentStep.icon className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {currentStep.title}
                                </h2>
                                <p className="text-slate-500">
                                    {currentStep.description}
                                </p>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-8">
                            {currentStep.questions.map((question) => (
                                <QuestionInput
                                    key={question.id}
                                    question={question}
                                    value={answers[question.id]}
                                    error={errors[question.id]}
                                    onChange={(val) => handleAnswer(question.id, val)}
                                />
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Footer */}
            <div className="mt-8 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    className="text-slate-500 hover:text-slate-900"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Zurück
                </Button>

                <Button
                    onClick={handleNext}
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/20 text-white px-8"
                >
                    {isLastStep ? (
                        <>
                            Abschließen
                            <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                    ) : (
                        <>
                            Weiter
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

// Sub-component for rendering different input types
function QuestionInput({
    question,
    value,
    error,
    onChange
}: {
    question: Question
    value: any
    error?: string
    onChange: (val: any) => void
}) {
    return (
        <div className="space-y-3">
            <label className="block text-base font-semibold text-slate-900">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {question.description && (
                <p className="text-sm text-slate-500 mb-2">{question.description}</p>
            )}

            <div className="mt-2">
                {question.type === 'text' && (
                    <input
                        type="text"
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none",
                            error ? "border-red-300 focus:ring-red-200" : "border-slate-200"
                        )}
                        placeholder="Ihre Antwort..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}

                {question.type === 'textarea' && (
                    <textarea
                        rows={4}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none",
                            error ? "border-red-300 focus:ring-red-200" : "border-slate-200"
                        )}
                        placeholder="Beschreiben Sie hier..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}

                {question.type === 'select' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {question.options?.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => onChange(option.value)}
                                className={cn(
                                    "cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-3",
                                    value === option.value
                                        ? "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500"
                                        : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                                    value === option.value ? "border-cyan-500" : "border-slate-300"
                                )}>
                                    {value === option.value && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                                    )}
                                </div>
                                <span className={cn(
                                    "font-medium",
                                    value === option.value ? "text-cyan-900" : "text-slate-700"
                                )}>
                                    {option.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {question.type === 'yes_no' && (
                    <div className="flex gap-4">
                        {['yes', 'no'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => onChange(opt)}
                                className={cn(
                                    "flex-1 py-3 px-6 rounded-xl border font-medium transition-all",
                                    value === opt
                                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {opt === 'yes' ? 'Ja' : 'Nein'}
                            </button>
                        ))}
                    </div>
                )}

                {question.type === 'scale' && (
                    <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                onClick={() => onChange(num)}
                                className={cn(
                                    "w-12 h-12 rounded-xl border font-bold transition-all flex items-center justify-center",
                                    value === num
                                        ? "border-cyan-500 bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300"
                                )}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
