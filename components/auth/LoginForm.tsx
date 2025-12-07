"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
    email: z.string().min(1, "Bitte geben Sie Ihre E-Mail oder Benutzername ein."),
    password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Ein Fehler ist aufgetreten.");
            }

            router.push("/dashboard");
            router.refresh(); // Ensure session state is updated
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 ring-1 ring-slate-900/5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-50/50 to-transparent opacity-50 pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Willkommen zurück.</h1>
                        <p className="text-slate-500">Melden Sie sich mit Ihren Zugangsdaten an.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                    Anmelden...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Noch kein Konto?{" "}
                            <Link href="/register" className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors">
                                Jetzt registrieren
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
