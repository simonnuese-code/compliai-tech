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
    MoreHorizontal,
    Pause,
    Play,
    Trash2,
    Sparkles,
    Brain,
    CalendarDays,
    Zap,
    ArrowRight,
    Minus,
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
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatDuration, formatPrice } from '@/lib/flugtracker/geo-utils';
import { TRACKER_STATUS_LABELS } from '@/lib/flugtracker/types';

// ─── Types ───────────────────────────────────────────────────

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
    source: string;
    // AI scoring
    valueScore: number | null;
    valueLabel: string | null;
    scoreBreakdown: {
        priceScore: number;
        durationScore: number;
        stopsScore: number;
        timeScore: number;
    } | null;
}

interface PriceTrend {
    currentBest: number;
    averagePrice: number;
    price7dAgo: number | null;
    changePercent7d: number | null;
    trend: 'falling' | 'stable' | 'rising';
    recommendation: 'buy_now' | 'wait' | 'neutral';
    recommendationText: string;
    confidence: number;
}

interface DatePrice {
    outbound: string;
    return: string;
    bestPrice: number;
    flightCount: number;
}

interface Intelligence {
    priceTrend: PriceTrend | null;
    bestDates: DatePrice[];
    totalFlightsAnalyzed: number;
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

// ─── Component ───────────────────────────────────────────────

export default function TrackerDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [tracker, setTracker] = useState<TrackerDetails | null>(null);
    const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // All flights sorted by value score (best deals first)
    const sortedFlights = [...(tracker?.flightResults || [])].sort((a, b) => {
        if (a.valueScore !== null && b.valueScore !== null) {
            return b.valueScore - a.valueScore;
        }
        return a.priceEuro - b.priceEuro;
    });

    // Chart data from best dates
    const chartData = (intelligence?.bestDates || []).map(d => ({
        date: format(new Date(d.outbound), 'dd.MM.', { locale: de }),
        price: d.bestPrice,
    }));

    const bestPrice = sortedFlights[0]?.priceEuro;
    const priceTrend = intelligence?.priceTrend;

    useEffect(() => {
        fetchTrackerDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            setIntelligence(data.intelligence || null);
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
            toast.success(newStatus === 'PAUSED' ? 'Tracker pausiert' : 'Tracker fortgesetzt');
        } catch {
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
                success: 'Suche abgeschlossen!',
                error: (err) => err.message || 'Fehler bei der Suche',
            }
        );
        setTimeout(fetchTrackerDetails, 6000);
    };

    const handleDelete = async () => {
        if (!confirm('Möchten Sie diesen Tracker wirklich löschen?')) return;
        try {
            const res = await fetch(`/api/flugtracker/trackers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Fehler beim Löschen');
            toast.success('Tracker gelöscht');
            router.push('/flugtracker/dashboard');
        } catch {
            toast.error('Fehler beim Löschen des Trackers');
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                    <p className="text-sm text-slate-500">Analysiere Flugdaten...</p>
                </div>
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            {/* Navbar */}
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
                {/* Header */}
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
                                {tracker.departureAirports.join('/')} → {tracker.destinationAirports.join('/')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(tracker.dateRangeStart), 'dd.MM.', { locale: de })} -{' '}
                                {format(new Date(tracker.dateRangeEnd), 'dd.MM.yyyy', { locale: de })}
                            </div>
                            {tracker.lastCheckedAt && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    Zuletzt: {format(new Date(tracker.lastCheckedAt), 'dd.MM. HH:mm', { locale: de })}
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
                            <Zap className="mr-2 h-4 w-4" />
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
                                        <><Pause className="mr-2 h-4 w-4" /> Pausieren</>
                                    ) : (
                                        <><Play className="mr-2 h-4 w-4" /> Fortsetzen</>
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

                {/* ═══ AI RECOMMENDATION CARD ═══ */}
                {priceTrend && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Card className={cn(
                            'overflow-hidden border',
                            priceTrend.recommendation === 'buy_now'
                                ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 to-slate-900/50'
                                : priceTrend.recommendation === 'wait'
                                    ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/50 to-slate-900/50'
                                    : 'border-sky-500/30 bg-gradient-to-r from-sky-950/50 to-slate-900/50'
                        )}>
                            <CardContent className="py-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl',
                                            priceTrend.recommendation === 'buy_now'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : priceTrend.recommendation === 'wait'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-sky-500/20 text-sky-400'
                                        )}>
                                            <Brain className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="mb-1 flex items-center gap-2">
                                                <h3 className="font-semibold text-white">AI Empfehlung</h3>
                                                <Badge variant="outline" className={cn(
                                                    'text-xs border',
                                                    priceTrend.recommendation === 'buy_now'
                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                        : priceTrend.recommendation === 'wait'
                                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                            : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                                                )}>
                                                    {priceTrend.recommendation === 'buy_now' ? '🟢 Jetzt buchen'
                                                        : priceTrend.recommendation === 'wait' ? '🟡 Abwarten'
                                                            : '🔵 Beobachten'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-400">{priceTrend.recommendationText}</p>
                                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                                <span>Durchschnitt: {formatPrice(priceTrend.averagePrice)}</span>
                                                {priceTrend.changePercent7d !== null && (
                                                    <span className="flex items-center gap-1">
                                                        7 Tage:
                                                        {priceTrend.changePercent7d <= 0 ? (
                                                            <span className="text-emerald-400">{priceTrend.changePercent7d}%</span>
                                                        ) : (
                                                            <span className="text-red-400">+{priceTrend.changePercent7d}%</span>
                                                        )}
                                                    </span>
                                                )}
                                                <span>Konfidenz: {priceTrend.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-500">Bester Preis</div>
                                        <div className="text-3xl font-bold text-white">{formatPrice(priceTrend.currentBest)}</div>
                                        <div className="flex items-center justify-end gap-1 text-sm">
                                            {priceTrend.trend === 'falling' && <TrendingDown className="h-4 w-4 text-emerald-400" />}
                                            {priceTrend.trend === 'rising' && <TrendingUp className="h-4 w-4 text-red-400" />}
                                            {priceTrend.trend === 'stable' && <Minus className="h-4 w-4 text-slate-400" />}
                                            <span className={cn(
                                                priceTrend.trend === 'falling' ? 'text-emerald-400'
                                                    : priceTrend.trend === 'rising' ? 'text-red-400'
                                                        : 'text-slate-400'
                                            )}>
                                                {priceTrend.trend === 'falling' ? 'Fallend' : priceTrend.trend === 'rising' ? 'Steigend' : 'Stabil'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ STATS GRID ═══ */}
                <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <Card className="border-white/10 bg-slate-800/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Bester Preis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-3xl font-bold text-white">
                                    {bestPrice ? formatPrice(bestPrice) : '---'}
                                </span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-white/10 bg-slate-800/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Analysierte Flüge</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-3xl font-bold text-white">{intelligence?.totalFlightsAnalyzed || sortedFlights.length}</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Card className="border-white/10 bg-slate-800/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Beste Daten</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-3xl font-bold text-white">{intelligence?.bestDates?.length || 0}</span>
                                <span className="ml-1 text-sm text-slate-500">gescannt</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Price chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-white/10 bg-slate-800/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Preisverlauf</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[80px] pb-0">
                                {chartData.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#0ea5e9"
                                                strokeWidth={2}
                                                fill="url(#priceGradient)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                                        Wird nach dem nächsten Scan angezeigt
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* ═══ BEST DATES ═══ */}
                {intelligence?.bestDates && intelligence.bestDates.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
                        <Card className="border-white/10 bg-slate-800/30 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <CalendarDays className="h-5 w-5 text-sky-400" />
                                    Beste Reisedaten
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    {intelligence.bestDates.slice(0, 6).map((datePrice, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'rounded-xl border px-4 py-3 transition-all',
                                                i === 0
                                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                                    : 'border-white/10 bg-slate-800/50 hover:border-sky-500/30'
                                            )}
                                        >
                                            <div className="text-xs text-slate-400">
                                                {format(new Date(datePrice.outbound), 'dd. MMM', { locale: de })} → {format(new Date(datePrice.return), 'dd. MMM', { locale: de })}
                                            </div>
                                            <div className={cn(
                                                'text-lg font-bold',
                                                i === 0 ? 'text-emerald-400' : 'text-white'
                                            )}>
                                                {formatPrice(datePrice.bestPrice)}
                                            </div>
                                            {i === 0 && (
                                                <div className="mt-1 text-xs text-emerald-400">★ Günstigster Tag</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ FLIGHT RESULTS ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="rounded-xl border border-white/10 bg-slate-800/30 overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/10 p-4">
                            <h2 className="flex items-center gap-2 font-semibold text-white">
                                <Sparkles className="h-5 w-5 text-sky-400" />
                                Flüge nach Wertung
                            </h2>
                            <span className="text-sm text-slate-500">{sortedFlights.length} Ergebnisse</span>
                        </div>

                        <div className="divide-y divide-white/5">
                            {sortedFlights.map((flight, index) => (
                                <div key={flight.id} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-slate-800/30">
                                    {/* Value Score Badge */}
                                    <div className="flex-shrink-0">
                                        {flight.valueScore !== null ? (
                                            <div className={cn(
                                                'flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold',
                                                flight.valueScore >= 85 ? 'bg-emerald-500/20 text-emerald-400'
                                                    : flight.valueScore >= 70 ? 'bg-sky-500/20 text-sky-400'
                                                        : flight.valueScore >= 55 ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-slate-500/20 text-slate-400'
                                            )}>
                                                {flight.valueScore}
                                            </div>
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/50 text-xs text-slate-500">
                                                —
                                            </div>
                                        )}
                                    </div>

                                    {/* Flight Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{flight.airline}</span>
                                            {flight.valueLabel && (
                                                <Badge variant="outline" className={cn(
                                                    'text-xs border',
                                                    flight.valueLabel === 'Hervorragend' ? 'border-emerald-500/30 text-emerald-400'
                                                        : flight.valueLabel === 'Sehr gut' ? 'border-sky-500/30 text-sky-400'
                                                            : flight.valueLabel === 'Gut' ? 'border-amber-500/30 text-amber-400'
                                                                : 'border-slate-500/30 text-slate-400'
                                                )}>
                                                    {flight.valueLabel}
                                                </Badge>
                                            )}
                                            {index === 0 && sortedFlights.length > 1 && (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                                    Top-Empfehlung
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                                            <span className="font-mono">{flight.departureAirport} <ArrowRight className="inline h-3 w-3" /> {flight.destinationAirport}</span>
                                            <span>
                                                {format(new Date(flight.outboundDate), 'dd.MM.', { locale: de })} - {format(new Date(flight.returnDate), 'dd.MM.', { locale: de })}
                                            </span>
                                            <span>{formatDuration(flight.totalDurationMinutes)}</span>
                                            <span>{flight.stops === 0 ? 'Direkt' : `${flight.stops} Stopp${flight.stops > 1 ? 's' : ''}`}</span>
                                        </div>
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">{formatPrice(flight.priceEuro)}</div>
                                            <div className="text-xs text-slate-500">{flight.source}</div>
                                        </div>
                                        {flight.bookingLink && (
                                            <a href={flight.bookingLink} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" className="bg-sky-600 hover:bg-sky-500">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sortedFlights.length === 0 && (
                                <div className="py-16 text-center">
                                    <Sparkles className="mx-auto mb-4 h-8 w-8 text-slate-600" />
                                    <p className="text-slate-500">Noch keine Flüge gefunden. Starten Sie eine Suche!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
