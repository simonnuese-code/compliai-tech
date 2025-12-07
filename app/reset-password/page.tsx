import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Navigation from "@/components/landing/Navigation";
import { Suspense } from "react";

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#bfdbfe] via-[#eff6ff] to-[#ffffff] relative overflow-hidden">
            {/* Soft Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')] bg-repeat" />

            <Navigation />

            <main className="pt-32 pb-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
                <Suspense fallback={<div>Laden...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </main>
        </div>
    );
}
