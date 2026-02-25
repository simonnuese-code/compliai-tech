'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
    Plane,
    ArrowLeft,
    Cake,
    Check,
    X,
    Loader2,
    Mail,
    User,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function FlugTrackerSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [birthday, setBirthday] = useState('');
    const [originalBirthday, setOriginalBirthday] = useState('');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/flugtracker/login');
                    return;
                }
                throw new Error('Fehler beim Laden');
            }
            const data = await res.json();
            setUserName(data.name || '');
            setUserEmail(data.email || '');
            const bday = data.birthday ? data.birthday.split('T')[0] : '';
            setBirthday(bday);
            setOriginalBirthday(bday);
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Fehler beim Laden der Benutzerdaten');
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanged = birthday !== originalBirthday;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/update-birthday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birthday: birthday || null }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Fehler beim Speichern');
            }

            toast.success('Geburtstag erfolgreich gespeichert 🎂');
            setOriginalBirthday(birthday);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            const res = await fetch('/api/user/update-birthday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birthday: null }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Fehler beim Entfernen');
            }

            toast.success('Geburtstag entfernt');
            setBirthday('');
            setOriginalBirthday('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/flugtracker/dashboard" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">FlugTracker</span>
                    </Link>

                    <Link href="/flugtracker/dashboard">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück zum Dashboard
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-white">Einstellungen</h1>
                        <p className="mt-2 text-slate-400">
                            Verwalte dein Profil und persönliche Einstellungen
                        </p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Profile Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-2xl border border-white/10 bg-slate-800/50 p-6 shadow-2xl backdrop-blur-xl"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
                                        <User className="h-5 w-5 text-sky-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Profil</h2>
                                        <p className="text-sm text-slate-400">Deine Kontoinformationen</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs uppercase tracking-wider">Name</Label>
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
                                            <User className="h-4 w-4 text-slate-500" />
                                            <span className="text-white">{userName || '—'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs uppercase tracking-wider">E-Mail</Label>
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
                                            <Mail className="h-4 w-4 text-slate-500" />
                                            <span className="text-white truncate">{userEmail}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Birthday Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-2xl border border-white/10 bg-slate-800/50 p-6 shadow-2xl backdrop-blur-xl"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                        <Cake className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Geburtstag</h2>
                                        <p className="text-sm text-slate-400">
                                            Erhalte an deinem Geburtstag eine besondere Nachricht
                                        </p>
                                    </div>
                                </div>

                                {/* Info Banner */}
                                <div className="mb-6 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-sky-500/10 border border-purple-500/20 p-4">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-slate-300">
                                            Wenn du deinen Geburtstag hinterlegst, bekommst du an deinem
                                            besonderen Tag eine festliche E-Mail von uns! 🎂🎉
                                        </p>
                                    </div>
                                </div>

                                {/* Birthday Input */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Geburtsdatum</Label>
                                        <div className="relative">
                                            <Cake className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="birthday"
                                                type="date"
                                                value={birthday}
                                                onChange={(e) => setBirthday(e.target.value)}
                                                className="border-slate-600 bg-slate-900/50 pl-10 text-white [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        {hasChanged && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="mr-2 h-4 w-4" />
                                                    )}
                                                    Speichern
                                                </Button>
                                            </motion.div>
                                        )}
                                        {originalBirthday && !hasChanged && (
                                            <Button
                                                onClick={handleRemove}
                                                disabled={isRemoving}
                                                variant="outline"
                                                className="border-slate-600 bg-transparent text-slate-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                {isRemoving ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="mr-2 h-4 w-4" />
                                                )}
                                                Entfernen
                                            </Button>
                                        )}
                                    </div>

                                    {/* Current birthday display */}
                                    {originalBirthday && !hasChanged && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3"
                                        >
                                            <p className="text-sm text-purple-300">
                                                🎂 Dein Geburtstag ist am{' '}
                                                <span className="font-semibold text-purple-200">
                                                    {new Date(originalBirthday + 'T00:00:00').toLocaleDateString('de-DE', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                {' '}hinterlegt.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
