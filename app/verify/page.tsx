'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function VerifyContent() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(60)

    // Email update state
    const [isEditingEmail, setIsEditingEmail] = useState(false)
    const [newEmail, setNewEmail] = useState('')

    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    useEffect(() => {
        if (!email) {
            router.push('/register')
        } else {
            setNewEmail(email)
        }
    }, [email, router])

    // Timer logic
    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timerId)
        }
    }, [timeLeft])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Verifizierung fehlgeschlagen')
                setLoading(false)
                return
            }

            // Erfolgreich - redirect zum Dashboard
            router.push('/dashboard')
        } catch (err) {
            setError('Netzwerkfehler')
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (timeLeft > 0) return

        setLoading(true)
        setError('')
        setSuccessMessage('')

        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Fehler beim Senden')
            } else {
                setSuccessMessage('Neuer Code wurde gesendet.')
                setTimeLeft(60)
            }
        } catch (err) {
            setError('Netzwerkfehler')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail || newEmail === email) {
            setIsEditingEmail(false)
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/correct-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentEmail: email, newEmail }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Fehler beim Aktualisieren')
                setLoading(false)
            } else {
                setSuccessMessage('E-Mail aktualisiert. Code wurde an die neue Adresse gesendet.')
                setIsEditingEmail(false)
                setTimeLeft(60)
                // Update URL parameter without reload
                const params = new URLSearchParams(searchParams)
                params.set('email', newEmail)
                router.replace(`/verify?${params.toString()}`)
                setLoading(false)
            }
        } catch (err) {
            setError('Netzwerkfehler')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-slate-900">Email bestätigen</CardTitle>
                    <CardDescription className="text-base">
                        {!isEditingEmail ? (
                            <>
                                Code gesendet an <span className="font-semibold text-slate-900">{email}</span>
                                <button
                                    onClick={() => { setIsEditingEmail(true); setError(''); }}
                                    className="block mx-auto mt-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
                                >
                                    (E-Mail ändern?)
                                </button>
                            </>
                        ) : (
                            <span className="text-slate-600">E-Mail Adresse korrigieren</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {successMessage && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium text-center border border-emerald-200">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium text-center border border-rose-200">
                            {error}
                        </div>
                    )}

                    {isEditingEmail ? (
                        <form onSubmit={handleUpdateEmail} className="space-y-4">
                            <Input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Neue E-Mail Adresse"
                                className="text-center"
                                required
                            />
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setIsEditingEmail(false); setNewEmail(email || ''); setError(''); }}
                                >
                                    Abbrechen
                                </Button>
                                <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
                                    Speichern & Senden
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-3xl tracking-[1em] h-14 font-mono font-semibold"
                                    required
                                />
                                <div className="text-center">
                                    {timeLeft > 0 ? (
                                        <p className="text-xs text-slate-500 font-medium">
                                            Code erneut anfordern in {timeLeft}s
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={loading}
                                            className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold hover:underline"
                                        >
                                            Code erneut senden
                                        </button>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? 'Prüfe...' : 'Bestätigen'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    )
}
