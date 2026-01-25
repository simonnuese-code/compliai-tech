'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
    Plane,
    Plus,
    Clock,
    TrendingDown,
    TrendingUp,
    Pause,
    Play,
    Trash2,
    Edit,
    Settings,
    LogOut,
    Calendar,
    MapPin,
    Loader2,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatRoute, formatDateRange } from '@/lib/flugtracker/geo-utils';
import { TRACKER_STATUS_LABELS } from '@/lib/flugtracker/types';

interface Tracker {
    id: string;
    name: string;
    departureAirports: string[];
    destinationAirports: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    tripDurationDays: number;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'EXPIRED';
    cheapestPrice: number | null;
    flightsFound: number;
    lastCheckedAt: string | null;
    createdAt: string;
}

export default function FlugTrackerDashboard() {
    const router = useRouter();
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTrackerId, setDeleteTrackerId] = useState<string | null>(null);

    useEffect(() => {
        fetchTrackers();
    }, []);

    const fetchTrackers = async () => {
        try {
            const res = await fetch('/api/flugtracker/trackers');
            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/flugtracker/login');
                    return;
                }
                throw new Error('Fehler beim Laden');
            }
            const data = await res.json();
            setTrackers(data.trackers);
        } catch (error) {
            console.error('Error fetching trackers:', error);
            toast.error('Fehler beim Laden der Tracker');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePauseResume = async (trackerId: string, currentStatus: string) => {
        try {
            const endpoint =
                currentStatus === 'ACTIVE'
                    ? `/api/flugtracker/trackers/${trackerId}/pause`
                    : `/api/flugtracker/trackers/${trackerId}/resume`;

            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) throw new Error('Fehler');

            setTrackers((prev) =>
                prev.map((t) =>
                    t.id === trackerId
                        ? { ...t, status: currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
                        : t
                )
            );

            toast.success(
                currentStatus === 'ACTIVE' ? 'Tracker pausiert' : 'Tracker fortgesetzt'
            );
        } catch (error) {
            console.error('Error updating tracker:', error);
            toast.error('Fehler beim Aktualisieren');
        }
    };

    const handleDelete = async () => {
        if (!deleteTrackerId) return;

        try {
            const res = await fetch(`/api/flugtracker/trackers/${deleteTrackerId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Fehler');

            setTrackers((prev) => prev.filter((t) => t.id !== deleteTrackerId));
            toast.success('Tracker gelöscht');
        } catch (error) {
            console.error('Error deleting tracker:', error);
            toast.error('Fehler beim Löschen');
        } finally {
            setDeleteTrackerId(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/flugtracker/auth/logout', { method: 'POST' });
            router.push('/flugtracker/login');
        } catch (error) {
            console.error('Logout error:', error);
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

                    <div className="flex items-center gap-4">
                        <Link href="/flugtracker/tracker/new">
                            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500">
                                <Plus className="mr-2 h-4 w-4" />
                                Neuer Tracker
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="border-slate-700 bg-slate-800"
                            >
                                <DropdownMenuItem
                                    className="text-slate-300 focus:bg-white/10 focus:text-white"
                                    onClick={() => router.push('/flugtracker/settings')}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Einstellungen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem
                                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Abmelden
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Meine Tracker</h1>
                    <p className="mt-2 text-slate-400">
                        Überwachen Sie Ihre Flugpreise und erhalten Sie die besten Angebote
                    </p>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    </div>
                ) : trackers.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16"
                    >
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/20">
                            <Plane className="h-10 w-10 text-sky-400" />
                        </div>
                        <h2 className="mb-2 text-xl font-semibold text-white">
                            Noch keine Tracker
                        </h2>
                        <p className="mb-6 max-w-md text-center text-slate-400">
                            Erstellen Sie Ihren ersten Tracker, um Flugpreise zu überwachen und
                            die besten Angebote zu finden.
                        </p>
                        <Link href="/flugtracker/tracker/new">
                            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500">
                                <Plus className="mr-2 h-4 w-4" />
                                Ersten Tracker erstellen
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    /* Tracker Grid */
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {trackers.map((tracker, index) => (
                            <TrackerCard
                                key={tracker.id}
                                tracker={tracker}
                                index={index}
                                onPauseResume={handlePauseResume}
                                onDelete={(id) => setDeleteTrackerId(id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteTrackerId}
                onOpenChange={() => setDeleteTrackerId(null)}
            >
                <AlertDialogContent className="border-slate-700 bg-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                            Tracker löschen?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten und
                            gespeicherten Flugpreise werden gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-600 bg-transparent text-slate-300 hover:bg-white/10">
                            Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function TrackerCard({
    tracker,
    index,
    onPauseResume,
    onDelete,
}: {
    tracker: Tracker;
    index: number;
    onPauseResume: (id: string, status: string) => void;
    onDelete: (id: string) => void;
}) {
    const route = formatRoute(tracker.departureAirports, tracker.destinationAirports);
    const dateRange = formatDateRange(
        new Date(tracker.dateRangeStart),
        new Date(tracker.dateRangeEnd)
    );

    const statusColors = {
        ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
        PAUSED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
        EXPIRED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="group overflow-hidden border-white/10 bg-gradient-to-b from-slate-800/50 to-slate-900/50 transition-all hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/5">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex-1">
                        <Badge
                            variant="outline"
                            className={cn('mb-2 border', statusColors[tracker.status])}
                        >
                            {TRACKER_STATUS_LABELS[tracker.status]}
                        </Badge>
                        <CardTitle className="text-lg text-white">{tracker.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="border-slate-700 bg-slate-800"
                        >
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/flugtracker/tracker/${tracker.id}`}
                                    className="flex items-center text-slate-300 focus:bg-white/10 focus:text-white"
                                >
                                    <ChevronRight className="mr-2 h-4 w-4" />
                                    Details anzeigen
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/flugtracker/tracker/${tracker.id}/edit`}
                                    className="flex items-center text-slate-300 focus:bg-white/10 focus:text-white"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-slate-300 focus:bg-white/10 focus:text-white"
                                onClick={() => onPauseResume(tracker.id, tracker.status)}
                            >
                                {tracker.status === 'ACTIVE' ? (
                                    <>
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pausieren
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Fortsetzen
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                onClick={() => onDelete(tracker.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span className="font-mono">{route}</span>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{dateRange}</span>
                    </div>

                    {/* Price & Stats */}
                    <div className="flex items-end justify-between border-t border-white/10 pt-4">
                        <div>
                            <p className="text-xs text-slate-500">Günstigster Preis</p>
                            {tracker.cheapestPrice ? (
                                <p className="text-2xl font-bold text-white">
                                    {Math.round(tracker.cheapestPrice)}€
                                </p>
                            ) : (
                                <p className="text-lg text-slate-500">—</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Flüge gefunden</p>
                            <p className="text-lg font-semibold text-slate-300">
                                {tracker.flightsFound}
                            </p>
                        </div>
                    </div>

                    {/* Last Checked */}
                    {tracker.lastCheckedAt && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>
                                Zuletzt geprüft:{' '}
                                {new Date(tracker.lastCheckedAt).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
