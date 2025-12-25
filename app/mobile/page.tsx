'use client';

import MobileNavBar from '@/components/mobile/MobileNavBar';
import { Shield, ArrowRight, Zap, CheckCircle2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function MobileHomePage() {
    return (
        <>
            <div className="px-6 pt-8 pb-32">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Hallo! 👋</h1>
                        <p className="text-slate-500 text-sm">Willkommen bei CompliAI</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-300">
                        <span className="text-slate-500 font-medium">S</span>
                    </div>
                </div>

                {/* Hero Card */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-cyan-500/20 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-4">
                            <Shield className="w-3.5 h-3.5" />
                            EU AI Act Ready
                        </span>
                        <h2 className="text-2xl font-bold mb-2">Compliance to go.</h2>
                        <p className="text-cyan-50 text-sm mb-6 leading-relaxed">
                            Prüfen Sie Ihre KI-Systeme direkt auf dem Smartphone. Schnell, sicher und einfach.
                        </p>
                        <Link href="/mobile/check" className="bg-white text-cyan-600 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 w-fit active:scale-95 transition-transform">
                            Jetzt Check starten
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Quick Stats / Actions */}
                <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Übersicht</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 active:scale-95 transition-transform">
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900">0</span>
                            <span className="text-xs text-slate-500 font-medium">Abgeschlossen</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 active:scale-95 transition-transform">
                        <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-slate-900">Neu</span>
                            <span className="text-xs text-slate-500 font-medium">Check starten</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Aktivitäten</h3>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-12">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <LayoutDashboard className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-900 font-medium">Keine Aktivitäten</p>
                    <p className="text-slate-500 text-sm mt-1">Starten Sie Ihren ersten Check.</p>
                </div>

            </div>

            <MobileNavBar />
        </>
    );
}
