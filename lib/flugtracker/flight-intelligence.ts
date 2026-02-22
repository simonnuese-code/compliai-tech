import { prisma } from '@/lib/prisma';

/**
 * FlightIntelligence — the AI brain of the FlugTracker.
 * 
 * Provides:
 * 1. Smart Value Scoring (like Google Flights "best flights")
 * 2. Price Trend Analysis from historical data
 * 3. "Buy Now" vs "Wait" recommendations (like Hopper)
 * 4. Best date detection across the search range
 */

// ─── VALUE SCORE ─────────────────────────────────────────────

export interface ScoredFlight {
  /** 0–100 score. 100 = best value. */
  valueScore: number;
  /** Human-readable label */
  valueLabel: 'Hervorragend' | 'Sehr gut' | 'Gut' | 'Akzeptabel' | 'Teuer';
  /** Breakdown of individual score components */
  scoreBreakdown: {
    priceScore: number;
    durationScore: number;
    stopsScore: number;
    timeScore: number;
  };
}

interface FlightForScoring {
  priceEuro: number;
  totalDurationMinutes: number;
  stops: number;
  outboundDate: Date;
  airline: string;
}

/**
 * Calculate a smart value score for a set of flights.
 * Normalizes all flights relative to each other (like Google Flights).
 * 
 * Weights:
 * - Price: 50% (most important)
 * - Duration: 25%
 * - Stops: 15%
 * - Departure time: 10% (prefer 7-11 AM)
 */
export function scoreFlights(flights: FlightForScoring[]): Map<number, ScoredFlight> {
  if (flights.length === 0) return new Map();

  // Extract min/max for normalization
  const prices = flights.map(f => f.priceEuro).filter(p => p > 0);
  const durations = flights.map(f => f.totalDurationMinutes).filter(d => d > 0);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  const scores = new Map<number, ScoredFlight>();

  flights.forEach((flight, index) => {
    // 1. Price Score (0-100, lower price = higher score)
    const priceRange = maxPrice - minPrice;
    const priceScore = priceRange > 0
      ? Math.round(100 - ((flight.priceEuro - minPrice) / priceRange) * 100)
      : 100; // All same price → perfect score

    // 2. Duration Score (0-100, shorter = higher)
    const durationRange = maxDuration - minDuration;
    const durationScore = durationRange > 0 && flight.totalDurationMinutes > 0
      ? Math.round(100 - ((flight.totalDurationMinutes - minDuration) / durationRange) * 100)
      : 80; // Unknown duration → decent default

    // 3. Stops Score (0-100)
    const stopsScore = flight.stops === 0 ? 100 : flight.stops === 1 ? 65 : flight.stops === 2 ? 35 : 10;

    // 4. Time Score — prefer departures between 7-11 AM, penalize red-eyes
    const hour = new Date(flight.outboundDate).getHours();
    let timeScore: number;
    if (hour >= 7 && hour <= 11) timeScore = 100;       // Golden window
    else if (hour >= 6 && hour <= 14) timeScore = 80;    // Good  
    else if (hour >= 14 && hour <= 20) timeScore = 60;   // Acceptable
    else timeScore = 30;                                   // Red-eye / very early

    // Weighted average
    const valueScore = Math.round(
      priceScore * 0.50 +
      durationScore * 0.25 +
      stopsScore * 0.15 +
      timeScore * 0.10
    );

    // Label
    let valueLabel: ScoredFlight['valueLabel'];
    if (valueScore >= 85) valueLabel = 'Hervorragend';
    else if (valueScore >= 70) valueLabel = 'Sehr gut';
    else if (valueScore >= 55) valueLabel = 'Gut';
    else if (valueScore >= 40) valueLabel = 'Akzeptabel';
    else valueLabel = 'Teuer';

    scores.set(index, {
      valueScore,
      valueLabel,
      scoreBreakdown: { priceScore, durationScore, stopsScore, timeScore },
    });
  });

  return scores;
}


// ─── PRICE TREND ANALYSIS ────────────────────────────────────

export interface PriceTrend {
  /** Current best price */
  currentBest: number;
  /** Average price over history */
  averagePrice: number;
  /** Price 7 days ago (null if no data) */
  price7dAgo: number | null;
  /** Price change percentage in last 7 days */
  changePercent7d: number | null;
  /** Trend direction */
  trend: 'falling' | 'stable' | 'rising';
  /** AI recommendation */
  recommendation: 'buy_now' | 'wait' | 'neutral';
  /** Human-readable recommendation text */
  recommendationText: string;
  /** Confidence 0-100 */
  confidence: number;
}

/**
 * Analyze price trends for a tracker using historical flight results.
 * Works like Hopper's "prices are X% lower than usual" feature.
 */
export async function analyzePriceTrend(trackerId: string): Promise<PriceTrend | null> {
  // Get all historical flight results, grouped by check date
  const results = await prisma.flightResult.findMany({
    where: { trackerId },
    orderBy: { checkedAt: 'asc' },
    select: {
      priceEuro: true,
      checkedAt: true,
    },
  });

  if (results.length === 0) return null;

  // Group by check day and find daily minimums
  const dailyMins = new Map<string, number>();
  for (const r of results) {
    const dayKey = new Date(r.checkedAt).toISOString().split('T')[0];
    const price = Number(r.priceEuro);
    const current = dailyMins.get(dayKey);
    if (!current || price < current) {
      dailyMins.set(dayKey, price);
    }
  }

  const sortedDays = [...dailyMins.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (sortedDays.length === 0) return null;

  const currentBest = sortedDays[sortedDays.length - 1][1];
  const allPrices = sortedDays.map(d => d[1]);
  const averagePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

  // Price 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDayKey = sevenDaysAgo.toISOString().split('T')[0];
  
  // Find the closest price to 7 days ago
  let price7dAgo: number | null = null;
  for (const [day, price] of sortedDays) {
    if (day <= sevenDayKey) {
      price7dAgo = price;
    }
  }

  const changePercent7d = price7dAgo !== null
    ? ((currentBest - price7dAgo) / price7dAgo) * 100
    : null;

  // Determine trend
  let trend: PriceTrend['trend'] = 'stable';
  if (changePercent7d !== null) {
    if (changePercent7d < -3) trend = 'falling';
    else if (changePercent7d > 3) trend = 'rising';
  }

  // Calculate how current price compares to historical average
  const priceVsAverage = ((currentBest - averagePrice) / averagePrice) * 100;

  // AI Recommendation logic (inspired by Hopper's algorithm)
  let recommendation: PriceTrend['recommendation'] = 'neutral';
  let recommendationText: string;
  let confidence: number;

  if (sortedDays.length < 3) {
    // Not enough data
    recommendation = 'neutral';
    recommendationText = 'Noch nicht genug Daten für eine Empfehlung. Wir sammeln weiter Preise.';
    confidence = 20;
  } else if (priceVsAverage < -10 && trend !== 'rising') {
    // Price is significantly below average and not rising
    recommendation = 'buy_now';
    recommendationText = `Der Preis liegt ${Math.abs(Math.round(priceVsAverage))}% unter dem Durchschnitt — ein guter Zeitpunkt zum Buchen!`;
    confidence = Math.min(90, 50 + sortedDays.length * 5);
  } else if (priceVsAverage < -5) {
    recommendation = 'buy_now';
    recommendationText = `Der aktuelle Preis ist ${Math.abs(Math.round(priceVsAverage))}% günstiger als üblich.`;
    confidence = Math.min(75, 40 + sortedDays.length * 4);
  } else if (trend === 'falling' && priceVsAverage > 5) {
    recommendation = 'wait';
    recommendationText = 'Die Preise fallen gerade — es könnte sich lohnen, noch etwas zu warten.';
    confidence = Math.min(70, 35 + sortedDays.length * 3);
  } else if (trend === 'rising' && priceVsAverage > 10) {
    recommendation = 'buy_now';
    recommendationText = `Die Preise steigen! Aktuell ${Math.round(priceVsAverage)}% über dem Schnitt und weiter steigend.`;
    confidence = Math.min(80, 45 + sortedDays.length * 4);
  } else {
    recommendation = 'neutral';
    recommendationText = 'Die Preise sind aktuell im normalen Bereich. Wir beobachten weiter.';
    confidence = Math.min(60, 30 + sortedDays.length * 3);
  }

  return {
    currentBest,
    averagePrice: Math.round(averagePrice),
    price7dAgo,
    changePercent7d: changePercent7d !== null ? Math.round(changePercent7d * 10) / 10 : null,
    trend,
    recommendation,
    recommendationText,
    confidence: Math.min(confidence, 95), // Never 100% confident
  };
}


// ─── SMART DATE SAMPLING ─────────────────────────────────────

/**
 * Generate strategic date samples across a date range.
 * Instead of searching every single day (expensive), we sample intelligently:
 * - ≤7 days range: every day
 * - 7-21 days: every 2-3 days  
 * - 21-60 days: every 4-5 days
 * - 60+ days: every week
 * 
 * This is how Skyscanner's "cheapest month" works behind the scenes.
 */
export function generateSmartDateSamples(
  rangeStart: Date,
  rangeEnd: Date,
  tripDurationDays: number,
  flexibility: 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2'
): Array<{ outbound: Date; return: Date }> {
  const samples: Array<{ outbound: Date; return: Date }> = [];
  
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  const rangeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Determine sampling interval
  let interval: number;
  if (rangeDays <= 7) interval = 1;
  else if (rangeDays <= 21) interval = 3;
  else if (rangeDays <= 60) interval = 5;
  else interval = 7;

  // Calculate flexibility offset
  const flexDays = flexibility === 'EXACT' ? 0 : flexibility === 'PLUS_MINUS_1' ? 1 : 2;

  // Cap total API calls to prevent excessive costs
  const MAX_SAMPLES = 8;

  const current = new Date(start);
  while (current <= end && samples.length < MAX_SAMPLES) {
    // Skip past dates
    if (current >= new Date()) {
      // For each sampled outbound date, consider flexibility
      const durations = [tripDurationDays];
      if (flexDays >= 1) {
        durations.push(tripDurationDays - 1, tripDurationDays + 1);
      }
      if (flexDays >= 2) {
        durations.push(tripDurationDays - 2, tripDurationDays + 2);
      }

      // Only use the base duration in the sample (Google Flights shows all nearby options anyway)
      const returnDate = new Date(current);
      returnDate.setDate(returnDate.getDate() + tripDurationDays);

      samples.push({
        outbound: new Date(current),
        return: returnDate,
      });
    }

    current.setDate(current.getDate() + interval);
  }

  return samples;
}


// ─── BEST DATE FINDER ────────────────────────────────────────

export interface DatePrice {
  outbound: string; // ISO date
  return: string;
  bestPrice: number;
  flightCount: number;
}

/**
 * Find the cheapest dates from stored flight results.
 * Returns a sorted list of dates with their best prices.
 */
export async function findBestDates(trackerId: string): Promise<DatePrice[]> {
  const results = await prisma.flightResult.findMany({
    where: { trackerId },
    orderBy: { priceEuro: 'asc' },
    select: {
      outboundDate: true,
      returnDate: true,
      priceEuro: true,
    },
  });

  // Group by outbound date
  const dateMap = new Map<string, { prices: number[]; returnDate: string }>();
  
  for (const r of results) {
    const outKey = new Date(r.outboundDate).toISOString().split('T')[0];
    const retKey = new Date(r.returnDate).toISOString().split('T')[0];
    
    if (!dateMap.has(outKey)) {
      dateMap.set(outKey, { prices: [], returnDate: retKey });
    }
    dateMap.get(outKey)!.prices.push(Number(r.priceEuro));
  }

  const datePrices: DatePrice[] = [];
  for (const [outbound, data] of dateMap) {
    datePrices.push({
      outbound,
      return: data.returnDate,
      bestPrice: Math.min(...data.prices),
      flightCount: data.prices.length,
    });
  }

  // Sort by price
  return datePrices.sort((a, b) => a.bestPrice - b.bestPrice);
}
