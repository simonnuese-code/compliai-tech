'use client';

import { Home, LayoutDashboard, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto h-16">
                <Link href="/mobile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mobile') && pathname === '/mobile' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link href="/mobile/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mobile/dashboard') ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutDashboard className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Cockpit</span>
                </Link>

                <Link href="/mobile/check" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mobile/check') ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full p-3 -mt-6 shadow-lg border-4 border-white">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-900 mt-1">Check</span>
                </Link>

                <Link href="/mobile/chat" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mobile/chat') ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-[10px] font-medium">AI Chat</span>
                </Link>

                <Link href="/mobile/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mobile/profile') ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Profil</span>
                </Link>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" /> {/* Safe Area Spacer */}
        </div>
    );
}
