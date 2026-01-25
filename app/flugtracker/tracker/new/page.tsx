'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
    Plane,
    MapPin,
    Calendar,
    Clock,
    Briefcase,
    Bell,
    Check,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Search,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Airport } from '@/lib/flugtracker/types';
import {
    FLEXIBILITY_LABELS,
    TRAVEL_CLASS_LABELS,
    LUGGAGE_OPTION_LABELS,
    REPORT_FREQUENCY_LABELS,
} from '@/lib/flugtracker/types';

const STEPS = [
    { id: 1, title: 'Abflug', icon: MapPin },
    { id: 2, title: 'Ziel', icon: MapPin },
    { id: 3, title: 'Zeitraum', icon: Calendar },
    { id: 4, title: 'Dauer', icon: Clock },
    { id: 5, title: 'Optionen', icon: Briefcase },
    { id: 6, title: 'Alerts', icon: Bell },
];

interface FormData {
    // Step 1: Departure
    departureCity: string;
    departureRadius: number;
    departureAirports: string[];
    departureCoords: { lat: number; lng: number } | null;

    // Step 2: Destination
    destinationCity: string;
    destinationAirports: string[];

    // Step 3: Date Range
    dateRangeStart: Date | undefined;
    dateRangeEnd: Date | undefined;

    // Step 4: Duration
    tripDurationDays: number;
    flexibility: 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2';

    // Step 5: Flight Options
    travelClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    luggageOption: 'INCLUDED' | 'HAND_ONLY' | 'BOTH';

    // Step 6: Notifications
    name: string;
    reportFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    priceAlertEnabled: boolean;
    priceAlertType: 'percent' | 'euro';
    priceAlertValue: number;
}

const initialFormData: FormData = {
    departureCity: '',
    departureRadius: 200,
    departureAirports: [],
    departureCoords: null,
    destinationCity: '',
    destinationAirports: [],
    dateRangeStart: undefined,
    dateRangeEnd: undefined,
    tripDurationDays: 7,
    flexibility: 'EXACT',
    travelClass: 'ECONOMY',
    luggageOption: 'BOTH',
    name: '',
    reportFrequency: 'WEEKLY',
    priceAlertEnabled: false,
    priceAlertType: 'percent',
    priceAlertValue: 15,
};

export default function NewTrackerPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.departureAirports.length > 0;
            case 2:
                return formData.destinationAirports.length > 0;
            case 3:
                return formData.dateRangeStart && formData.dateRangeEnd;
            case 4:
                return formData.tripDurationDays > 0;
            case 5:
                return true;
            case 6:
                return formData.name.trim().length > 0;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < 6 && canProceed()) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!canProceed()) return;

        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                departureAirports: formData.departureAirports,
                departureRadiusKm: formData.departureRadius,
                destinationAirports: formData.destinationAirports,
                dateRangeStart: formData.dateRangeStart?.toISOString(),
                dateRangeEnd: formData.dateRangeEnd?.toISOString(),
                tripDurationDays: formData.tripDurationDays,
                flexibility: formData.flexibility,
                travelClass: formData.travelClass,
                luggageOption: formData.luggageOption,
                reportFrequency: formData.reportFrequency,
                priceAlertThresholdPercent: formData.priceAlertEnabled && formData.priceAlertType === 'percent'
                    ? formData.priceAlertValue
                    : undefined,
                priceAlertThresholdEuro: formData.priceAlertEnabled && formData.priceAlertType === 'euro'
                    ? formData.priceAlertValue
                    : undefined,
            };

            const res = await fetch('/api/flugtracker/trackers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Fehler beim Erstellen');
            }

            toast.success('Tracker erfolgreich erstellt!');
            router.push('/flugtracker/dashboard');
        } catch (error) {
            console.error('Error creating tracker:', error);
            toast.error('Fehler beim Erstellen des Trackers');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link href="/flugtracker/dashboard" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">FlugTracker</span>
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="mx-auto mb-8 max-w-3xl">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex flex-1 items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                                                isActive
                                                    ? 'border-sky-500 bg-sky-500 text-white'
                                                    : isCompleted
                                                        ? 'border-green-500 bg-green-500 text-white'
                                                        : 'border-slate-600 bg-slate-800 text-slate-400'
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <Icon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'mt-2 text-xs',
                                                isActive ? 'text-sky-400' : 'text-slate-500'
                                            )}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={cn(
                                                'mx-2 h-0.5 flex-1',
                                                isCompleted ? 'bg-green-500' : 'bg-slate-700'
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="mx-auto max-w-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-2xl border border-white/10 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl"
                        >
                            {currentStep === 1 && (
                                <Step1Departure formData={formData} updateFormData={updateFormData} />
                            )}
                            {currentStep === 2 && (
                                <Step2Destination formData={formData} updateFormData={updateFormData} />
                            )}
                            {currentStep === 3 && (
                                <Step3DateRange formData={formData} updateFormData={updateFormData} />
                            )}
                            {currentStep === 4 && (
                                <Step4Duration formData={formData} updateFormData={updateFormData} />
                            )}
                            {currentStep === 5 && (
                                <Step5Options formData={formData} updateFormData={updateFormData} />
                            )}
                            {currentStep === 6 && (
                                <Step6Notifications formData={formData} updateFormData={updateFormData} />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="border-slate-600 bg-transparent text-slate-300 hover:bg-white/10"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück
                        </Button>

                        {currentStep < 6 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                            >
                                Weiter
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={!canProceed() || isSubmitting}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Wird erstellt...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Tracker erstellen
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Step 1: Departure Airport Selection
function Step1Departure({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    const [searchQuery, setSearchQuery] = useState(formData.departureCity);
    const [searchResults, setSearchResults] = useState<Airport[]>([]);
    const [nearbyAirports, setNearbyAirports] = useState<Airport[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const searchAirports = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/flugtracker/airports/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.airports || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchAirports(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchAirports]);

    const handleCitySelect = async (airport: Airport) => {
        setSearchQuery(airport.city);
        setShowResults(false);
        updateFormData({
            departureCity: airport.city,
            departureCoords: { lat: airport.latitude, lng: airport.longitude },
        });

        // Fetch nearby airports
        try {
            const res = await fetch(
                `/api/flugtracker/airports/nearby?lat=${airport.latitude}&lng=${airport.longitude}&radius=${formData.departureRadius}`
            );
            const data = await res.json();
            setNearbyAirports(data.airports || []);
            // Auto-select the nearest airport
            if (data.airports?.length > 0) {
                updateFormData({
                    departureAirports: [data.airports[0].iataCode],
                });
            }
        } catch (error) {
            console.error('Nearby airports error:', error);
        }
    };

    const handleRadiusChange = async (value: number[]) => {
        const radius = value[0];
        updateFormData({ departureRadius: radius });

        if (formData.departureCoords) {
            try {
                const res = await fetch(
                    `/api/flugtracker/airports/nearby?lat=${formData.departureCoords.lat}&lng=${formData.departureCoords.lng}&radius=${radius}`
                );
                const data = await res.json();
                setNearbyAirports(data.airports || []);
            } catch (error) {
                console.error('Nearby airports error:', error);
            }
        }
    };

    const toggleAirport = (iataCode: string) => {
        const current = formData.departureAirports;
        if (current.includes(iataCode)) {
            updateFormData({
                departureAirports: current.filter((c) => c !== iataCode),
            });
        } else {
            updateFormData({
                departureAirports: [...current, iataCode],
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Abflughafen wählen</h2>
                <p className="mt-1 text-slate-400">
                    Geben Sie Ihre Stadt ein und wählen Sie die Flughäfen in Ihrer Nähe
                </p>
            </div>

            {/* City Search */}
            <div className="relative">
                <Label className="text-slate-300">Stadt</Label>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder="z.B. Münster, Düsseldorf, Frankfurt..."
                        className="border-slate-600 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-500" />
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 py-2 shadow-xl">
                        {searchResults.slice(0, 8).map((airport) => (
                            <button
                                key={airport.iataCode}
                                onClick={() => handleCitySelect(airport)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/10"
                            >
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <div>
                                    <p className="text-white">
                                        {airport.city}, {airport.country}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {airport.name} ({airport.iataCode})
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Radius Slider */}
            {formData.departureCoords && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Suchradius</Label>
                        <span className="text-sm font-medium text-sky-400">
                            {formData.departureRadius} km
                        </span>
                    </div>
                    <Slider
                        value={[formData.departureRadius]}
                        onValueChange={handleRadiusChange}
                        min={50}
                        max={300}
                        step={25}
                        className="py-4"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>50 km</span>
                        <span>300 km</span>
                    </div>
                </div>
            )}

            {/* Nearby Airports */}
            {nearbyAirports.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-slate-300">Flughäfen im Umkreis</Label>
                    <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                        {nearbyAirports.map((airport) => (
                            <div
                                key={airport.iataCode}
                                className="flex items-center gap-3 py-2"
                            >
                                <Checkbox
                                    id={airport.iataCode}
                                    checked={formData.departureAirports.includes(airport.iataCode)}
                                    onCheckedChange={() => toggleAirport(airport.iataCode)}
                                />
                                <label
                                    htmlFor={airport.iataCode}
                                    className="flex flex-1 cursor-pointer items-center justify-between"
                                >
                                    <div>
                                        <span className="font-medium text-white">{airport.iataCode}</span>
                                        <span className="ml-2 text-slate-400">{airport.name}</span>
                                    </div>
                                    <span className="text-sm text-slate-500">{airport.distance} km</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Airports Summary */}
            {formData.departureAirports.length > 0 && (
                <div className="rounded-lg bg-sky-500/10 p-4">
                    <p className="text-sm text-sky-400">
                        Ausgewählt: {formData.departureAirports.join(', ')}
                    </p>
                </div>
            )}
        </div>
    );
}

// Step 2: Destination Airport Selection
function Step2Destination({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    const [searchQuery, setSearchQuery] = useState(formData.destinationCity);
    const [searchResults, setSearchResults] = useState<Airport[]>([]);
    const [cityAirports, setCityAirports] = useState<Airport[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const searchAirports = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/flugtracker/airports/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.airports || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchAirports(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchAirports]);

    const handleCitySelect = async (airport: Airport) => {
        setSearchQuery(airport.city);
        setShowResults(false);
        updateFormData({ destinationCity: airport.city });

        // Find all airports in this city
        try {
            const res = await fetch(`/api/flugtracker/airports/search?q=${encodeURIComponent(airport.city)}`);
            const data = await res.json();
            const cityResults = (data.airports || []).filter(
                (a: Airport) => a.city.toLowerCase() === airport.city.toLowerCase()
            );
            setCityAirports(cityResults);
            // Auto-select all airports in the city
            if (cityResults.length > 0) {
                updateFormData({
                    destinationAirports: cityResults.map((a: Airport) => a.iataCode),
                });
            }
        } catch (error) {
            console.error('City airports error:', error);
        }
    };

    const toggleAirport = (iataCode: string) => {
        const current = formData.destinationAirports;
        if (current.includes(iataCode)) {
            updateFormData({
                destinationAirports: current.filter((c) => c !== iataCode),
            });
        } else {
            updateFormData({
                destinationAirports: [...current, iataCode],
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Ziel wählen</h2>
                <p className="mt-1 text-slate-400">
                    Geben Sie Ihr Reiseziel ein und wählen Sie die Flughäfen
                </p>
            </div>

            {/* City Search */}
            <div className="relative">
                <Label className="text-slate-300">Zielstadt</Label>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder="z.B. Shanghai, New York, London..."
                        className="border-slate-600 bg-slate-900/50 pl-10 text-white placeholder:text-slate-500"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-500" />
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 py-2 shadow-xl">
                        {searchResults.slice(0, 8).map((airport) => (
                            <button
                                key={airport.iataCode}
                                onClick={() => handleCitySelect(airport)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/10"
                            >
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <div>
                                    <p className="text-white">
                                        {airport.city}, {airport.country}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {airport.name} ({airport.iataCode})
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* City Airports */}
            {cityAirports.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-slate-300">Flughäfen in {formData.destinationCity}</Label>
                    <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                        {cityAirports.map((airport) => (
                            <div
                                key={airport.iataCode}
                                className="flex items-center gap-3 py-2"
                            >
                                <Checkbox
                                    id={`dest-${airport.iataCode}`}
                                    checked={formData.destinationAirports.includes(airport.iataCode)}
                                    onCheckedChange={() => toggleAirport(airport.iataCode)}
                                />
                                <label
                                    htmlFor={`dest-${airport.iataCode}`}
                                    className="flex flex-1 cursor-pointer items-center"
                                >
                                    <span className="font-medium text-white">{airport.iataCode}</span>
                                    <span className="ml-2 text-slate-400">{airport.name}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Airports Summary */}
            {formData.destinationAirports.length > 0 && (
                <div className="rounded-lg bg-sky-500/10 p-4">
                    <p className="text-sm text-sky-400">
                        Ausgewählt: {formData.destinationAirports.join(', ')}
                    </p>
                </div>
            )}
        </div>
    );
}

// Step 3: Date Range Selection
function Step3DateRange({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Reisezeitraum</h2>
                <p className="mt-1 text-slate-400">
                    Wählen Sie den Zeitraum, in dem Sie reisen möchten
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Start Date */}
                <div className="space-y-2">
                    <Label className="text-slate-300">Frühestes Hinflugdatum</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start border-slate-600 bg-slate-900/50 text-left font-normal hover:bg-slate-800',
                                    !formData.dateRangeStart && 'text-slate-500'
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {formData.dateRangeStart
                                    ? format(formData.dateRangeStart, 'dd.MM.yyyy', { locale: de })
                                    : 'Datum wählen'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto border-slate-700 bg-slate-800 p-0">
                            <CalendarComponent
                                mode="single"
                                selected={formData.dateRangeStart}
                                onSelect={(date) => updateFormData({ dateRangeStart: date })}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                    <Label className="text-slate-300">Spätestes Rückflugdatum</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start border-slate-600 bg-slate-900/50 text-left font-normal hover:bg-slate-800',
                                    !formData.dateRangeEnd && 'text-slate-500'
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {formData.dateRangeEnd
                                    ? format(formData.dateRangeEnd, 'dd.MM.yyyy', { locale: de })
                                    : 'Datum wählen'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto border-slate-700 bg-slate-800 p-0">
                            <CalendarComponent
                                mode="single"
                                selected={formData.dateRangeEnd}
                                onSelect={(date) => updateFormData({ dateRangeEnd: date })}
                                disabled={(date) =>
                                    date < new Date() ||
                                    (formData.dateRangeStart ? date <= formData.dateRangeStart : false)
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Summary */}
            {formData.dateRangeStart && formData.dateRangeEnd && (
                <div className="rounded-lg bg-sky-500/10 p-4">
                    <p className="text-sm text-sky-400">
                        Wir suchen Flüge zwischen dem{' '}
                        {format(formData.dateRangeStart, 'dd.MM.yyyy', { locale: de })} und dem{' '}
                        {format(formData.dateRangeEnd, 'dd.MM.yyyy', { locale: de })}
                    </p>
                </div>
            )}
        </div>
    );
}

// Step 4: Trip Duration
function Step4Duration({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Reisedauer</h2>
                <p className="mt-1 text-slate-400">
                    Wie lange soll Ihre Reise dauern?
                </p>
            </div>

            {/* Duration Input */}
            <div className="space-y-2">
                <Label className="text-slate-300">Anzahl Tage</Label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        min={1}
                        max={90}
                        value={formData.tripDurationDays}
                        onChange={(e) =>
                            updateFormData({ tripDurationDays: parseInt(e.target.value) || 1 })
                        }
                        className="w-24 border-slate-600 bg-slate-900/50 text-center text-white"
                    />
                    <span className="text-slate-400">Tage</span>
                </div>
            </div>

            {/* Flexibility */}
            <div className="space-y-4">
                <Label className="text-slate-300">Flexibilität</Label>
                <RadioGroup
                    value={formData.flexibility}
                    onValueChange={(value) =>
                        updateFormData({
                            flexibility: value as 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2',
                        })
                    }
                    className="space-y-3"
                >
                    {(Object.entries(FLEXIBILITY_LABELS) as [keyof typeof FLEXIBILITY_LABELS, string][]).map(
                        ([value, label]) => (
                            <div
                                key={value}
                                className="flex items-center space-x-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4"
                            >
                                <RadioGroupItem value={value} id={value} />
                                <label htmlFor={value} className="flex-1 cursor-pointer text-white">
                                    {label}
                                    <p className="text-sm text-slate-400">
                                        {value === 'EXACT'
                                            ? `Genau ${formData.tripDurationDays} Tage`
                                            : value === 'PLUS_MINUS_1'
                                                ? `${formData.tripDurationDays - 1} bis ${formData.tripDurationDays + 1} Tage`
                                                : `${formData.tripDurationDays - 2} bis ${formData.tripDurationDays + 2} Tage`}
                                    </p>
                                </label>
                            </div>
                        )
                    )}
                </RadioGroup>
            </div>
        </div>
    );
}

// Step 5: Flight Options
function Step5Options({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Flugoptionen</h2>
                <p className="mt-1 text-slate-400">
                    Wählen Sie Ihre bevorzugte Reiseklasse und Gepäckoptionen
                </p>
            </div>

            {/* Travel Class */}
            <div className="space-y-2">
                <Label className="text-slate-300">Reiseklasse</Label>
                <Select
                    value={formData.travelClass}
                    onValueChange={(value) =>
                        updateFormData({
                            travelClass: value as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
                        })
                    }
                >
                    <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                        {(Object.entries(TRAVEL_CLASS_LABELS) as [keyof typeof TRAVEL_CLASS_LABELS, string][]).map(
                            ([value, label]) => (
                                <SelectItem key={value} value={value} className="text-white focus:bg-white/10">
                                    {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Luggage Option */}
            <div className="space-y-2">
                <Label className="text-slate-300">Gepäck</Label>
                <Select
                    value={formData.luggageOption}
                    onValueChange={(value) =>
                        updateFormData({
                            luggageOption: value as 'INCLUDED' | 'HAND_ONLY' | 'BOTH',
                        })
                    }
                >
                    <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                        {(Object.entries(LUGGAGE_OPTION_LABELS) as [keyof typeof LUGGAGE_OPTION_LABELS, string][]).map(
                            ([value, label]) => (
                                <SelectItem key={value} value={value} className="text-white focus:bg-white/10">
                                    {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Step 6: Notifications
function Step6Notifications({
    formData,
    updateFormData,
}: {
    formData: FormData;
    updateFormData: (updates: Partial<FormData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Benachrichtigungen</h2>
                <p className="mt-1 text-slate-400">
                    Benennen Sie Ihren Tracker und wählen Sie Ihre Benachrichtigungsoptionen
                </p>
            </div>

            {/* Tracker Name */}
            <div className="space-y-2">
                <Label className="text-slate-300">Tracker Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="z.B. Sommerurlaub Shanghai"
                    className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
                />
            </div>

            {/* Report Frequency */}
            <div className="space-y-2">
                <Label className="text-slate-300">Report-Frequenz</Label>
                <Select
                    value={formData.reportFrequency}
                    onValueChange={(value) =>
                        updateFormData({
                            reportFrequency: value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                        })
                    }
                >
                    <SelectTrigger className="border-slate-600 bg-slate-900/50 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                        {(Object.entries(REPORT_FREQUENCY_LABELS) as [keyof typeof REPORT_FREQUENCY_LABELS, string][]).map(
                            ([value, label]) => (
                                <SelectItem key={value} value={value} className="text-white focus:bg-white/10">
                                    {label}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Price Alert Toggle */}
            <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                    <div>
                        <p className="font-medium text-white">Preis-Alert aktivieren</p>
                        <p className="text-sm text-slate-400">
                            Erhalten Sie sofort eine E-Mail bei Preisrückgang
                        </p>
                    </div>
                    <Switch
                        checked={formData.priceAlertEnabled}
                        onCheckedChange={(checked) =>
                            updateFormData({ priceAlertEnabled: checked })
                        }
                    />
                </div>

                {/* Price Alert Options */}
                {formData.priceAlertEnabled && (
                    <div className="space-y-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
                        <RadioGroup
                            value={formData.priceAlertType}
                            onValueChange={(value) =>
                                updateFormData({ priceAlertType: value as 'percent' | 'euro' })
                            }
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percent" id="percent" />
                                <label htmlFor="percent" className="text-white">
                                    Prozent
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="euro" id="euro" />
                                <label htmlFor="euro" className="text-white">
                                    Euro
                                </label>
                            </div>
                        </RadioGroup>

                        <div className="flex items-center gap-3">
                            <span className="text-slate-300">Benachrichtigen bei Rückgang um</span>
                            <Input
                                type="number"
                                min={1}
                                value={formData.priceAlertValue}
                                onChange={(e) =>
                                    updateFormData({ priceAlertValue: parseInt(e.target.value) || 1 })
                                }
                                className="w-20 border-slate-600 bg-slate-900/50 text-center text-white"
                            />
                            <span className="text-slate-300">
                                {formData.priceAlertType === 'percent' ? '%' : '€'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-green-500/10 p-4">
                <p className="mb-2 font-medium text-green-400">Zusammenfassung</p>
                <ul className="space-y-1 text-sm text-slate-300">
                    <li>
                        ✈️ Route: {formData.departureAirports.join('/')} →{' '}
                        {formData.destinationAirports.join('/')}
                    </li>
                    <li>📅 Dauer: {formData.tripDurationDays} Tage</li>
                    <li>📧 Reports: {REPORT_FREQUENCY_LABELS[formData.reportFrequency]}</li>
                    {formData.priceAlertEnabled && (
                        <li>
                            🔔 Alert bei -{formData.priceAlertValue}
                            {formData.priceAlertType === 'percent' ? '%' : '€'}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
