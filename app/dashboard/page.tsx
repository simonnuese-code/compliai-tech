import { getCurrentUser } from "@/lib/session";
import Navigation from "@/components/landing/Navigation";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#bfdbfe] via-[#eff6ff] to-[#ffffff] relative overflow-hidden">
            {/* Soft Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')] bg-repeat" />

            <Navigation user={user} />

            <main className="pt-32 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="bg-[#0f172a] rounded-2xl p-8 md:p-12 shadow-2xl shadow-blue-900/20 border border-white/10 backdrop-blur-sm relative overflow-hidden mb-8">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent opacity-30 pointer-events-none" />

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Willkommen, {user.name || user.email}.
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Hier sehen Sie Ihre Compliance-Checks und nächsten Schritte.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Letzter Check</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Sie haben noch keine Checks durchgeführt.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Nächste Aufgaben</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Starten Sie Ihren ersten Compliance-Check.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
