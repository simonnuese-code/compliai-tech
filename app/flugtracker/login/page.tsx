'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Plane, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function FlugTrackerLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password');

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/flugtracker/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login fehlgeschlagen');
            }

            toast.success('Erfolgreich angemeldet!');
            router.push('/flugtracker/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login fehlgeschlagen');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/flugtracker/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Senden des Links');
            }

            setMagicLinkSent(true);
            toast.success('Magic Link gesendet! Prüfen Sie Ihre E-Mails.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Fehler beim Senden');
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
                            <h1 className="mb-2 text-2xl font-bold text-white">Willkommen zurück</h1>
                            <p className="text-slate-400">
                                Melden Sie sich an, um Ihre Tracker zu verwalten
                            </p>
                        </div>

                        {/* Magic Link Success State */}
                        {magicLinkSent ? (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                                    <Mail className="h-8 w-8 text-green-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">E-Mail gesendet!</h3>
                                <p className="mb-6 text-slate-400">
                                    Wir haben Ihnen einen Login-Link an <strong>{email}</strong> gesendet.
                                    Klicken Sie auf den Link in der E-Mail, um sich anzumelden.
                                </p>
                                <Button
                                    variant="outline"
                                    className="border-slate-600 text-slate-300 hover:bg-white/10"
                                    onClick={() => setMagicLinkSent(false)}
                                >
                                    Andere E-Mail verwenden
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Login Method Tabs */}
                                <div className="mb-6 flex rounded-lg bg-slate-900/50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('password')}
                                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${loginMethod === 'password'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Mit Passwort
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('magic')}
                                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${loginMethod === 'magic'
                                                ? 'bg-sky-500 text-white'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Magic Link
                                    </button>
                                </div>

                                {/* Password Login Form */}
                                {loginMethod === 'password' ? (
                                    <form onSubmit={handlePasswordLogin} className="space-y-5">
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
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-slate-300">
                                                    Passwort
                                                </Label>
                                                <Link
                                                    href="/flugtracker/forgot-password"
                                                    className="text-sm text-sky-400 hover:text-sky-300"
                                                >
                                                    Vergessen?
                                                </Link>
                                            </div>
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
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Wird angemeldet...
                                                </>
                                            ) : (
                                                <>
                                                    Anmelden
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                ) : (
                                    /* Magic Link Form */
                                    <form onSubmit={handleMagicLink} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="magic-email" className="text-slate-300">
                                                E-Mail
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                                <Input
                                                    id="magic-email"
                                                    type="email"
                                                    placeholder="ihre@email.de"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="border-slate-600 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500 focus:border-sky-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-400">
                                            Wir senden Ihnen einen Link per E-Mail, mit dem Sie sich sofort
                                            anmelden können. Kein Passwort nötig.
                                        </p>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Wird gesendet...
                                                </>
                                            ) : (
                                                <>
                                                    Magic Link senden
                                                    <Mail className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}

                                {/* Register Link */}
                                <p className="mt-8 text-center text-sm text-slate-400">
                                    Noch kein Konto?{' '}
                                    <Link
                                        href="/flugtracker/register"
                                        className="font-medium text-sky-400 hover:text-sky-300"
                                    >
                                        Jetzt registrieren
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
