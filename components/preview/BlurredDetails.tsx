import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";

export function BlurredDetails() {
    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 filter blur-sm select-none pointer-events-none">
                <Card>
                    <CardHeader>
                        <CardTitle>Detaillierte Analyse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Handlungsempfehlungen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                            <div className="h-4 bg-gray-100 rounded w-5/6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Nächste Schritte</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-24 bg-gray-100 rounded-lg" />
                    </CardContent>
                </Card>
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 border border-white/20">
                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-cyan-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-navy-900 mb-4">
                        Details freischalten
                    </h3>
                    <p className="text-gray-600 mb-8">
                        Erstellen Sie einen kostenlosen Account, um Ihre detaillierte Analyse und Handlungsempfehlungen zu sehen.
                    </p>
                    <Button asChild size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
                        <Link href="/signup">
                            Kostenlos registrieren
                        </Link>
                    </Button>
                    <p className="mt-4 text-sm text-gray-500">
                        Bereits registriert? <Link href="/login" className="text-cyan-600 hover:underline">Einloggen</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
