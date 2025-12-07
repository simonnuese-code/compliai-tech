"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

const resetPasswordSchema = z.object({
    password: z.string().min(10, "Passwort muss mindestens 10 Zeichen lang sein."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordValues) => {
        if (!token) {
            setError("Ungültiger Token.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Ein Fehler ist aufgetreten.");
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-900/5 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Ungültiger Link</h1>
                    <p className="text-slate-500 mb-6">Der Link zum Zurücksetzen des Passworts ist ungültig oder fehlt.</p>
                    <Button asChild className="w-full rounded-full">
                        <Link href="/login">Zum Login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-900/5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-50/50 to-transparent opacity-50 pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Neues Passwort</h1>
                        <p className="text-slate-500">
                            Bitte geben Sie Ihr neues Passwort ein.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-slate-900">Passwort geändert!</h3>
                                <p className="text-slate-500 text-sm">
                                    Ihr Passwort wurde erfolgreich aktualisiert. Sie werden in Kürze zum Login weitergeleitet.
                                </p>
                            </div>
                            <Button asChild className="w-full rounded-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500">
                                <Link href="/login">Jetzt einloggen</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700">Neues Passwort</Label>
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
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-6 rounded-full shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Speichern...
                                    </>
                                ) : (
                                    "Passwort ändern"
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
