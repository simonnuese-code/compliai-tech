'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Clock,
    Calendar,
    MapPin,
    TrendingDown,
    TrendingUp,
    ExternalLink,
    Filter,
    MoreHorizontal,
    Pause,
    Play,
    Trash2,
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
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatDuration, formatPrice } from '@/lib/flugtracker/geo-utils';
import { TRACKER_STATUS_LABELS } from '@/lib/flugtracker/types';

interface FlightResult {
    id: string;
    priceEuro: number;
    airline: string;
    departureAirport: string;
    destinationAirport: string;
    outboundDate: string;
    returnDate: string;
    totalDurationMinutes: number;
    stops: number;
    bookingLink: string | null;
    checkedAt: string;
}

interface TrackerDetails {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'EXPIRED';
    departureAirports: string[];
    destinationAirports: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    flightResults: FlightResult[];
    lastCheckedAt: string | null;
}

export default function TrackerDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [tracker, setTracker] = useState<TrackerDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sort all results by date (newest first), then price (cheapest first)
    const allSortedResults = [...(tracker?.flightResults || [])].sort((a, b) => {
        const dateA = new Date(a.checkedAt).getTime();
        const dateB = new Date(b.checkedAt).getTime();
        // Group by scrape time (approx 1 min window)
        if (Math.abs(dateA - dateB) > 60000) {
            return dateB - dateA;
        }
        return a.priceEuro - b.priceEuro;
    });

    // Determine the latest scrape batch time
    const latestBatchTime = allSortedResults[0]?.checkedAt
        ? new Date(allSortedResults[0].checkedAt).getTime()
        : 0;

    // Filter flights to only show the ones from the latest scrape
    const latestFlights = allSortedResults.filter(f =>
        Math.abs(new Date(f.checkedAt).getTime() - latestBatchTime) < 60000
    );

    // Prepare chart data: Lowest price per scrape event, historical order
    // Group by scrape time
    const scrapes = new Map<string, number>();
    tracker?.flightResults.forEach(r => {
        const timeKey = new Date(r.checkedAt).toISOString().slice(0, 16); // Minute precision
        const currentMin = scrapes.get(timeKey);
        if (!currentMin || r.priceEuro < currentMin) {
            scrapes.set(timeKey, r.priceEuro);
        }
    });

    const chartData = Array.from(scrapes.entries())
        .map(([dateStr, price]) => ({
            date: format(new Date(dateStr), 'dd.MM', { locale: de }),
            fullDate: new Date(dateStr), // for sorting
            price,
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
        .slice(-20); // Last 20 data points

    const bestPrice = latestFlights[0]?.priceEuro;

    // Previous batch price for trend?
    // tough to get accurately without complex logic, let's simplify trend to standard deviation or just vs previous check
    // Find previous batch
    const previousBatchFlight = allSortedResults.find(f =>
        Math.abs(new Date(f.checkedAt).getTime() - latestBatchTime) > 60000
    );
    const previousPrice = previousBatchFlight?.priceEuro;

    useEffect(() => {
        fetchTrackerDetails();
    }, [id]);

    const fetchTrackerDetails = async () => {
        try {
            const res = await fetch(`/api/flugtracker/trackers/${id}`);
            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/flugtracker/login');
                    return;
                }
                throw new Error('Fehler beim Laden');
            }
            const data = await res.json();
            setTracker(data.tracker);
        } catch (error) {
            console.error('Error fetching tracker details:', error);
            toast.error('Fehler beim Laden der Details');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePauseResume = async () => {
        if (!tracker) return;
        const newStatus = tracker.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const endpoint =
            tracker.status === 'ACTIVE'
                ? `/api/flugtracker/trackers/${id}/pause`
                : `/api/flugtracker/trackers/${id}/resume`;

        try {
            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) throw new Error('Fehler');

            setTracker({ ...tracker, status: newStatus });
            toast.success(
                newStatus === 'PAUSED' ? 'Tracker pausiert' : 'Tracker fortgesetzt'
            );
        } catch (error) {
            toast.error('Fehler beim Aktualisieren');
        }
    };

    const handleManualCheck = async () => {
        toast.promise(
            fetch(`/api/flugtracker/trackers/${id}/scrape`, { method: 'POST' }).then(async (res) => {
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Fehler bei der Suche');
                }
            }),
            {
                loading: 'Suche Flüge...',
                success: 'Suche abgeschlossen! Seite wird aktualisiert.',
                error: (err) => err.message || 'Fehler bei der Suche',
            }
        );
        // Reload after a delay to show new results
        setTimeout(fetchTrackerDetails, 5000); // Give it a bit more time for cold start
    };

    const handleDelete = async () => {
        if (!confirm('Möchten Sie diesen Tracker wirklich löschen?')) return;
        try {
            const res = await fetch(`/api/flugtracker/trackers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Fehler beim Löschen');
            toast.success('Tracker gelöscht');
            router.push('/flugtracker/dashboard');
        } catch (error) {
            toast.error('Fehler beim Löschen des Trackers');
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            </div>
        );
    }

    if (!tracker) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
                <h1 className="text-2xl font-bold">Tracker nicht gefunden</h1>
                <Link href="/flugtracker/dashboard">
                    <Button variant="outline">Zurück zum Dashboard</Button>
                </Link>
            </div>
        );
    }

    const priceTrend =
        bestPrice && previousPrice
            ? ((bestPrice - previousPrice) / previousPrice) * 100
            : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Navbar Stub */}
            <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link
                        href="/flugtracker/dashboard"
                        className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Zurück</span>
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{tracker.name}</h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'border',
                                    tracker.status === 'ACTIVE'
                                        ? 'border-green-500/30 bg-green-500/20 text-green-400'
                                        : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                                )}
                            >
                                {TRACKER_STATUS_LABELS[tracker.status]}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {tracker.departureAirports.join('/')} →{' '}
                                {tracker.destinationAirports.join('/')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(tracker.dateRangeStart), 'dd.MM.', { locale: de })} -{' '}
                                {format(new Date(tracker.dateRangeEnd), 'dd.MM.yyyy', { locale: de })}
                            </div>
                            {tracker.lastCheckedAt && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    Zuletzt geprüft:{' '}
                                    {format(new Date(tracker.lastCheckedAt), 'dd.MM. HH:mm', { locale: de })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                            onClick={handleManualCheck}
                        >
                            Jetzt prüfen
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800">
                                <DropdownMenuItem onClick={handlePauseResume} className="focus:bg-white/10">
                                    {tracker.status === 'ACTIVE' ? (
                                        <>
                                            <Pause className="mr-2 h-4 w-4" /> Pausieren
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" /> Fortsetzen
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-white/10 bg-slate-800/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Bester Preis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">
                                    {bestPrice ? formatPrice(bestPrice) : '---'}
                                </span>
                                {bestPrice && previousPrice && (
                                    <span
                                        className={cn(
                                            'flex items-center text-sm',
                                            priceTrend <= 0 ? 'text-green-400' : 'text-red-400'
                                        )}
                                    >
                                        {priceTrend <= 0 ? (
                                            <TrendingDown className="mr-1 h-3 w-3" />
                                        ) : (
                                            <TrendingUp className="mr-1 h-3 w-3" />
                                        )}
                                        {Math.abs(Math.round(priceTrend))}%
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-slate-800/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Gefundene Flüge</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{latestFlights.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-slate-800/50 md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Preisverlauf</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[120px] pb-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        dot={{ fill: '#0ea5e9', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Table */}
                <div className="rounded-xl border border-white/10 bg-slate-800/30 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 p-4">
                        <h2 className="font-semibold text-white">Gefundene Flüge</h2>
                        <Button variant="outline" className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-300">
                            <Filter className="mr-2 h-3 w-3" /> Filter
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Airline</th>
                                    <th className="px-4 py-3 font-medium">Route</th>
                                    <th className="px-4 py-3 font-medium">Datum</th>
                                    <th className="px-4 py-3 font-medium">Dauer</th>
                                    <th className="px-4 py-3 font-medium text-right">Preis</th>
                                    <th className="px-4 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {latestFlights.map((flight) => (
                                    <tr key={flight.id} className="group hover:bg-slate-800/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{flight.airline}</div>
                                            <div className="text-xs text-slate-500">{flight.stops === 0 ? 'Direkt' : `${flight.stops} Stopps`}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {flight.departureAirport} → {flight.destinationAirport}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            <div>{format(new Date(flight.outboundDate), 'dd.MM.', { locale: de })} -</div>
                                            <div>{format(new Date(flight.returnDate), 'dd.MM.yyyy', { locale: de })}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {formatDuration(flight.totalDurationMinutes)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="text-lg font-bold text-white">{formatPrice(flight.priceEuro)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {flight.bookingLink && (
                                                <a
                                                    href={flight.bookingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button size="sm" className="bg-sky-600 hover:bg-sky-500">
                                                        Zum Angebot <ExternalLink className="ml-2 h-3 w-3" />
                                                    </Button>
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {latestFlights.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-500">
                                            Keine Flüge gefunden. Starten Sie eine Suche!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
