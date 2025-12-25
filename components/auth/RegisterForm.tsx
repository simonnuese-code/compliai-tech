"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

const registerSchema = z.object({
    name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein."),
    email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
    company: z.string().min(2, "Unternehmen muss mindestens 2 Zeichen lang sein."),
    password: z.string().min(10, "Passwort muss mindestens 10 Zeichen lang sein."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [checkAnswers, setCheckAnswers] = useState<Record<string, any> | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromTest = searchParams.get('from') === 'test';

    useEffect(() => {
        if (fromTest) {
            const saved = localStorage.getItem('compliai_check_final');
            if (saved) {
                try {
                    setCheckAnswers(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse check answers', e);
                }
            }
        }
    }, [fromTest]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    company: data.company,
                    checkAnswers: checkAnswers // Send answers if present
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                let errorMessage = result.error || result.message || "Ein Fehler ist aufgetreten.";
                if (result.details?.fieldErrors) {
                    const details = Object.entries(result.details.fieldErrors)
                        .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
                        .join('; ');
                    errorMessage += ` (${details})`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            // Clear local storage if check was submitted
            if (checkAnswers) {
                localStorage.removeItem('compliai_check_final');
                localStorage.removeItem('compliai_check_draft');
            }

            // Redirect to verification page
            router.push(`/verify?email=${encodeURIComponent(data.email)}`)
        } catch (error: any) {
            setError(error.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {fromTest && checkAnswers && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-3 backdrop-blur-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                        <p className="font-semibold">Check erfolgreich abgeschlossen!</p>
                        <p className="text-sm opacity-90">Registrieren Sie sich jetzt, um Ihre detaillierte Auswertung zu sehen.</p>
                    </div>
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-900/5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-50/50 to-transparent opacity-50 pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Konto erstellen.</h1>
                        <p className="text-slate-500">
                            Kostenlos registrieren und <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">CompliAI</span> testen.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Max Mustermann"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-rose-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700">E-Mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@firma.de"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-rose-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-slate-700">Unternehmen</Label>
                            <Input
                                id="company"
                                type="text"
                                placeholder="Ihr Unternehmen GmbH"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                                {...register("company")}
                            />
                            {errors.company && (
                                <p className="text-sm text-rose-500">{errors.company.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700">Passwort</Label>
                            <Input
                                id="password"
                                type="password"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-rose-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-700">Passwort bestätigen</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-rose-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-6 rounded-full shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registrieren...
                                </>
                            ) : (
                                "Registrieren"
                            )}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-sm">Oder</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.location.href = '/api/auth/apple/login'}
                                className="w-full bg-black hover:bg-slate-900 text-white border-0 font-medium py-6 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.08-.49-3.17.06-1.12.55-2.09.43-3.07-.56A11.36 11.36 0 0 1 3.5 13.9c-.31-3.6 2.37-5.96 5.37-6.04 1.45-.04 2.5.95 3.3.95.8 0 1.96-1.02 3.42-.95 1.13.05 2.19.49 2.97 1.25-2.6 1.4-2.18 5.2.42 6.35-.55 1.58-1.28 3.14-1.93 4.82ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.22-1.84 4.08-3.74 4.25Z" /></svg>
                                Mit Apple registrieren
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.location.href = '/api/auth/google/login'}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-6 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Google
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.location.href = '/api/auth/github/login'}
                                    className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white border-0 font-medium py-6 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    GitHub
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Bereits ein Konto?{" "}
                            <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors">
                                Zum Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
