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
