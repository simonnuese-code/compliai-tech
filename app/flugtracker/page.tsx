'use client';


import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Plane,
    Bell,
    TrendingDown,
    Mail,
    Calendar,
    MapPin,
    ArrowRight,
    Check,
    Sparkles,
    Clock,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function FlugTrackerLandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/flugtracker" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">FlugTracker</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/flugtracker/login">
                            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">
                                Anmelden
                            </Button>
                        </Link>
                        <Link href="/flugtracker/register">
                            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500">
                                Registrieren
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 lg:py-32">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-[120px]" />
                    <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
                </div>

                <div className="container relative mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-4xl text-center"
                    >
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-300">
                            <Sparkles className="h-4 w-4" />
                            <span>Nie wieder zu viel für Flüge bezahlen</span>
                        </div>

                        {/* Headline */}
                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Flugpreise überwachen,{' '}
                            <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                                automatisch informiert
                            </span>{' '}
                            werden
                        </h1>

                        {/* Subheadline */}
                        <p className="mb-10 text-lg text-slate-400 sm:text-xl">
                            Erstellen Sie Tracker für Ihre geplanten Reisen und erhalten Sie
                            regelmäßige Reports mit den besten Angeboten. Beim Preis-Drop werden
                            Sie sofort benachrichtigt.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/flugtracker/register">
                                <Button
                                    size="lg"
                                    className="group h-14 bg-gradient-to-r from-sky-500 to-blue-600 px-8 text-lg hover:from-sky-400 hover:to-blue-500"
                                >
                                    Kostenlos starten
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/flugtracker/login">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 border-slate-700 bg-transparent px-8 text-lg text-white hover:bg-white/10"
                                >
                                    Anmelden
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>100% kostenlos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Keine Kreditkarte nötig</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Jederzeit kündbar</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Hero Visual - Flight Tracker Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mx-auto mt-16 max-w-5xl"
                    >
                        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-1 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
                            <div className="overflow-hidden rounded-xl bg-slate-900/80">
                                {/* Mock Dashboard Preview */}
                                <div className="border-b border-white/10 px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                        <div className="h-3 w-3 rounded-full bg-green-500" />
                                        <span className="ml-4 text-sm text-slate-500">
                                            flugtracker.compliai.tech/dashboard
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <TrackerPreviewCard
                                            name="Sommerurlaub Shanghai"
                                            route="DUS/FMO → PVG/SHA"
                                            price={487}
                                            trend={-12}
                                            status="active"
                                        />
                                        <TrackerPreviewCard
                                            name="Geschäftsreise London"
                                            route="CGN → LHR/LGW"
                                            price={156}
                                            trend={5}
                                            status="active"
                                        />
                                        <TrackerPreviewCard
                                            name="Familienbesuch NYC"
                                            route="FRA → JFK/EWR"
                                            price={423}
                                            trend={-8}
                                            status="active"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mb-16 text-center"
                    >
                        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                            So funktioniert FlugTracker
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-400">
                            In nur 3 Schritten haben Sie Ihre Flugpreise im Blick
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <StepCard
                            step={1}
                            icon={<MapPin className="h-6 w-6" />}
                            title="Route definieren"
                            description="Wählen Sie Ihre Abflughäfen, Ziele und den gewünschten Reisezeitraum. Mehrere Flughäfen pro Route möglich."
                            delay={0}
                        />
                        <StepCard
                            step={2}
                            icon={<Bell className="h-6 w-6" />}
                            title="Benachrichtigungen einrichten"
                            description="Wählen Sie, wie oft Sie Reports erhalten möchten und setzen Sie optionale Preis-Alerts für Schnäppchen."
                            delay={0.1}
                        />
                        <StepCard
                            step={3}
                            icon={<TrendingDown className="h-6 w-6" />}
                            title="Sparen & buchen"
                            description="Erhalten Sie regelmäßig die besten Angebote per E-Mail und buchen Sie zum optimalen Zeitpunkt."
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="relative py-20 lg:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
                </div>

                <div className="container relative mx-auto px-4">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col justify-center"
                        >
                            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                                Alles was Sie für günstige Flüge brauchen
                            </h2>
                            <p className="mb-8 text-lg text-slate-400">
                                FlugTracker durchsucht mehrere Flugportale und findet die besten
                                Angebote für Ihre Route. Keine manuellen Preisvergleiche mehr.
                            </p>

                            <div className="space-y-4">
                                <BenefitItem
                                    icon={<Calendar className="h-5 w-5" />}
                                    title="Flexible Zeiträume"
                                    description="Überwachen Sie ganze Monate und finden Sie die günstigsten Reisetage."
                                />
                                <BenefitItem
                                    icon={<MapPin className="h-5 w-5" />}
                                    title="Mehrere Flughäfen"
                                    description="Vergleichen Sie alle Flughäfen in Ihrer Nähe automatisch."
                                />
                                <BenefitItem
                                    icon={<Mail className="h-5 w-5" />}
                                    title="E-Mail Reports"
                                    description="Erhalten Sie übersichtliche Reports täglich, wöchentlich oder monatlich."
                                />
                                <BenefitItem
                                    icon={<TrendingDown className="h-5 w-5" />}
                                    title="Preis-Alerts"
                                    description="Sofortige Benachrichtigung bei Preisrückgang unter Ihren Schwellenwert."
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            {/* Email Preview Card */}
                            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 shadow-2xl">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
                                        <Mail className="h-5 w-5 text-sky-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Neuer Report</p>
                                        <p className="font-medium text-white">Sommerurlaub Shanghai - KW 04</p>
                                    </div>
                                </div>
                                <div className="space-y-4 rounded-xl bg-slate-800/50 p-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <span className="text-slate-400">🏆 Beste Option</span>
                                        <span className="text-2xl font-bold text-white">487€</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Route</span>
                                            <span className="text-white">DUS → PVG</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Datum</span>
                                            <span className="text-white">15.08. - 29.08.2025</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Airline</span>
                                            <span className="text-white">Lufthansa</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Flugzeit</span>
                                            <span className="text-white">11h 20min, Direkt</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400">
                                        <TrendingDown className="h-4 w-4" />
                                        <span className="text-sm">-36€ (-6.9%) vs. letzte Woche</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 lg:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px]" />
                </div>

                <div className="container relative mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                            Bereit zum Sparen?
                        </h2>
                        <p className="mb-10 text-lg text-slate-400">
                            Erstellen Sie jetzt Ihren ersten FlugTracker und verpassen Sie nie
                            wieder ein gutes Angebot für Ihre Traumreise.
                        </p>
                        <Link href="/flugtracker/register">
                            <Button
                                size="lg"
                                className="group h-14 bg-gradient-to-r from-sky-500 to-blue-600 px-10 text-lg hover:from-sky-400 hover:to-blue-500"
                            >
                                Jetzt kostenlos registrieren
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
                                <Plane className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-semibold text-white">FlugTracker</span>
                            <span className="text-slate-500">by CompliAI</span>
                        </div>
                        <div className="flex gap-6 text-sm text-slate-400">
                            <Link href="/impressum" className="hover:text-white">
                                Impressum
                            </Link>
                            <Link href="/datenschutz" className="hover:text-white">
                                Datenschutz
                            </Link>
                            <Link href="/agb" className="hover:text-white">
                                AGB
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Component: Tracker Preview Card
function TrackerPreviewCard({
    name,
    route,
    price,
    trend,
    status,
}: {
    name: string;
    route: string;
    price: number;
    trend: number;
    status: 'active' | 'paused';
}) {
    const isPositive = trend < 0;
    return (
        <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center justify-between">
                <span
                    className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-500/20 text-slate-400'
                    )}
                >
                    {status === 'active' ? 'Aktiv' : 'Pausiert'}
                </span>
                <Clock className="h-4 w-4 text-slate-500" />
            </div>
            <h3 className="mb-1 font-semibold text-white">{name}</h3>
            <p className="mb-3 text-sm text-slate-400">{route}</p>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{price}€</span>
                <span
                    className={cn(
                        'flex items-center gap-1 text-sm',
                        isPositive ? 'text-green-400' : 'text-red-400'
                    )}
                >
                    <TrendingDown
                        className={cn('h-4 w-4', !isPositive && 'rotate-180')}
                    />
                    {Math.abs(trend)}%
                </span>
            </div>
        </div>
    );
}

// Component: Step Card
function StepCard({
    step,
    icon,
    title,
    description,
    delay,
}: {
    step: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
        >
            <Card className="group relative h-full overflow-hidden border-white/10 bg-gradient-to-b from-slate-800/50 to-slate-900/50 transition-all hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/10 transition-transform group-hover:scale-150" />
                <CardContent className="relative p-8">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
                            {icon}
                        </div>
                        <span className="text-4xl font-bold text-white/20">{step}</span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
                    <p className="text-slate-400">{description}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Component: Benefit Item
function BenefitItem({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                {icon}
            </div>
            <div>
                <h4 className="font-medium text-white">{title}</h4>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
        </div>
    );
}
