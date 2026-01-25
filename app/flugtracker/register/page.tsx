'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Plane, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function FlugTrackerRegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Password requirements check
    const passwordRequirements = [
        { label: 'Mindestens 8 Zeichen', met: password.length >= 8 },
        { label: 'Mindestens eine Zahl', met: /\d/.test(password) },
        { label: 'Mindestens ein Buchstabe', met: /[a-zA-Z]/.test(password) },
    ];

    const allRequirementsMet = passwordRequirements.every((req) => req.met);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allRequirementsMet) {
            toast.error('Bitte erfüllen Sie alle Passwort-Anforderungen');
            return;
        }

        if (!passwordsMatch) {
            toast.error('Die Passwörter stimmen nicht überein');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/flugtracker/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registrierung fehlgeschlagen');
            }

            toast.success('Registrierung erfolgreich!');
            router.push('/flugtracker/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link href="/flugtracker" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">FlugTracker</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex flex-1 items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl">
                        {/* Header */}
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-white">Konto erstellen</h1>
                            <p className="text-slate-400">
                                Starten Sie jetzt mit der Überwachung Ihrer Flugpreise
                            </p>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">
                                    E-Mail
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ihre@email.de"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="border-slate-600 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500 focus:border-sky-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">
                                    Passwort
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="border-slate-600 bg-slate-900/50 pl-10 pr-10 text-white placeholder:text-slate-500 focus:border-sky-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {password.length > 0 && (
                                    <div className="mt-3 space-y-1.5">
                                        {passwordRequirements.map((req, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-400' : 'text-slate-500'
                                                    }`}
                                            >
                                                <div
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full ${req.met ? 'bg-green-500/20' : 'bg-slate-700'
                                                        }`}
                                                >
                                                    {req.met && <Check className="h-3 w-3" />}
                                                </div>
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-slate-300">
                                    Passwort bestätigen
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`border-slate-600 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500 focus:border-sky-500 ${confirmPassword.length > 0 && !passwordsMatch
                                                ? 'border-red-500 focus:border-red-500'
                                                : ''
                                            }`}
                                        required
                                    />
                                </div>
                                {confirmPassword.length > 0 && !passwordsMatch && (
                                    <p className="text-xs text-red-400">
                                        Die Passwörter stimmen nicht überein
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Wird erstellt...
                                    </>
                                ) : (
                                    <>
                                        Kostenlos registrieren
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            {/* Terms */}
                            <p className="text-center text-xs text-slate-500">
                                Mit der Registrierung akzeptieren Sie unsere{' '}
                                <Link href="/agb" className="text-sky-400 hover:underline">
                                    AGB
                                </Link>{' '}
                                und{' '}
                                <Link href="/datenschutz" className="text-sky-400 hover:underline">
                                    Datenschutzerklärung
                                </Link>
                            </p>
                        </form>

                        {/* Login Link */}
                        <p className="mt-8 text-center text-sm text-slate-400">
                            Bereits registriert?{' '}
                            <Link
                                href="/flugtracker/login"
                                className="font-medium text-sky-400 hover:text-sky-300"
                            >
                                Jetzt anmelden
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
