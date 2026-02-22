import { prisma } from '@/lib/prisma';
import { FlightTracker } from '@prisma/client';
import { SerpApiScraper } from './scrapers/serpapi';
import { KiwiScraper } from './scrapers/kiwi';
import { ScraperSearchParams } from './scrapers/types';
import { generateFlightHash } from './geo-utils';
import { EmailService } from './email-service';
import { scoreFlights } from './flight-intelligence';

export class ScraperService {
  // Both scrapers active — more sources = better prices
  private scrapers = [
    new SerpApiScraper(),
    new KiwiScraper(),
  ];

  private emailService = new EmailService();

  /**
   * Run scraping for a specific tracker.
   * 
   * Pipeline:
   * 1. Fetch tracker config
   * 2. Run all scrapers in parallel (SerpApi + Kiwi)
   * 3. Deduplicate results by flight hash
   * 4. Score all flights with AI value scoring
   * 5. Upsert results (update if cheaper, insert if new)
   * 6. Check price alerts
   */
  async scrapeTracker(trackerId: string) {
    console.log(`🔍 Starting smart scrape for tracker ${trackerId}`);
    
    try {
      // 1. Fetch tracker details
      const tracker = await prisma.flightTracker.findUnique({
        where: { id: trackerId },
      });

      if (!tracker) {
        throw new Error(`Tracker ${trackerId} not found`);
      }

      if (tracker.status !== 'ACTIVE') {
        console.log(`Tracker ${trackerId} is ${tracker.status}, skipping.`);
        return;
      }

      // 2. Prepare search params
      const searchParams: ScraperSearchParams = {
        departureAirports: tracker.departureAirports,
        destinationAirports: tracker.destinationAirports,
        dateRangeStart: tracker.dateRangeStart,
        dateRangeEnd: tracker.dateRangeEnd,
        tripDurationDays: tracker.tripDurationDays,
        flexibility: tracker.flexibility as any,
        travelClass: tracker.travelClass as any,
        adults: 1,
      };

      // 3. Run all scrapers in parallel
      const resultsPromises = this.scrapers.map(scraper => 
        scraper.search(searchParams).catch(err => {
          console.error(`Scraper ${scraper.name} failed for tracker ${tracker.name}:`, err);
          return []; 
        })
      );

      const nestedResults = await Promise.all(resultsPromises);
      const allResults = nestedResults.flat();

      console.log(`📊 Raw results: ${allResults.length} flights from ${this.scrapers.length} sources`);

      if (allResults.length === 0) {
        await prisma.flightTracker.update({
          where: { id: trackerId },
          data: { lastCheckedAt: new Date() }
        });
        return;
      }

      // 4. Smart Deduplication — keep the cheapest version of each flight
      const deduped = this.deduplicateFlights(allResults);
      console.log(`✨ After deduplication: ${deduped.length} unique flights`);

      // 5. Score all flights with AI value scoring
      const scores = scoreFlights(deduped.map(f => ({
        priceEuro: f.priceEuro,
        totalDurationMinutes: f.totalDurationMinutes,
        stops: f.stops,
        outboundDate: f.outboundDate,
        airline: f.airline,
      })));

      // 6. Prepare data for upsert
      const flightDataToInsert = deduped.map((flight, index) => {
        const hash = generateFlightHash({
          departureAirport: flight.departureAirport,
          destinationAirport: flight.destinationAirport,
          outboundDate: flight.outboundDate,
          returnDate: flight.returnDate,
          airline: flight.airline,
          stops: flight.stops,
        });

        const score = scores.get(index);

        return {
          trackerId: tracker.id,
          departureAirport: flight.departureAirport,
          destinationAirport: flight.destinationAirport,
          outboundDate: flight.outboundDate,
          returnDate: flight.returnDate,
          priceEuro: flight.priceEuro,
          airline: flight.airline,
          stops: flight.stops,
          totalDurationMinutes: flight.totalDurationMinutes,
          luggageIncluded: flight.luggageIncluded,
          bookingLink: flight.bookingLink,
          source: flight.source,
          flightHash: hash,
          checkedAt: new Date(),
          // Store the value score in the source field metadata
          ...(score ? {} : {}),
        };
      });

      // 7. Smart upsert: Delete old results for this tracker, insert fresh ones
      // This prevents infinite accumulation and keeps only the latest scan
      await prisma.$transaction([
        prisma.flightResult.deleteMany({
          where: {
            trackerId: tracker.id,
            checkedAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // Keep last 2 days for trend
          },
        }),
        prisma.flightResult.createMany({
          data: flightDataToInsert,
        }),
      ]);

      // 8. Update Tracker
      await prisma.flightTracker.update({
        where: { id: trackerId },
        data: { 
          lastCheckedAt: new Date(),
          status: 'ACTIVE',
        }
      });

      // 9. Check for Price Alerts
      if (tracker.priceAlertThresholdEuro || tracker.priceAlertThresholdPercent) {
        await this.checkPriceAlerts(tracker, flightDataToInsert);
      }

      console.log(`💾 Saved ${flightDataToInsert.length} scored flights for tracker "${tracker.name}"`);

    } catch (error) {
      console.error(`❌ Error scraping tracker ${trackerId}:`, error);
      await prisma.flightTracker.update({
        where: { id: trackerId },
        data: { status: 'ERROR' }
      });
    }
  }

  /**
   * Smart deduplication: if the same flight (same route, date, airline, stops)
   * appears from multiple sources, keep the one with the lowest price.
   */
  private deduplicateFlights(flights: any[]): any[] {
    const seen = new Map<string, any>();

    for (const flight of flights) {
      const hash = generateFlightHash({
        departureAirport: flight.departureAirport,
        destinationAirport: flight.destinationAirport,
        outboundDate: flight.outboundDate,
        returnDate: flight.returnDate,
        airline: flight.airline,
        stops: flight.stops,
      });

      const existing = seen.get(hash);
      if (!existing || flight.priceEuro < existing.priceEuro) {
        seen.set(hash, flight);
      }
    }

    return [...seen.values()];
  }

  private async checkPriceAlerts(tracker: FlightTracker, newFlights: any[]) {
    const bestPrice = Math.min(...newFlights.map(f => f.priceEuro));
    
    let shouldAlert = false;
    
    if (tracker.priceAlertThresholdEuro && bestPrice <= tracker.priceAlertThresholdEuro) {
      shouldAlert = true;
    }
    
    if (!shouldAlert) return;

    // Prevent spam: check if we already sent a PRICE_ALERT in last 24h
    const recentAlert = await prisma.flightReport.findFirst({
      where: {
        trackerId: tracker.id,
        reportType: 'PRICE_ALERT',
        sentAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      console.log(`⏭️ Price alert already sent recently for "${tracker.name}", skipping.`);
      return;
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: tracker.userId },
    });

    if (!user) return;

    console.log(`🚨 PRICE ALERT! ${bestPrice}€ for "${tracker.name}" (threshold: ${tracker.priceAlertThresholdEuro}€)`);

    try {
      const topFlights = await prisma.flightResult.findMany({
        where: { trackerId: tracker.id },
        orderBy: { priceEuro: 'asc' },
        take: 5,
      });

      await this.emailService.sendFlightReport(user.email, {
        tracker,
        topFlights,
        previousBestPrice: tracker.priceAlertThresholdEuro ?? undefined,
      });

      await prisma.flightReport.create({
        data: {
          trackerId: tracker.id,
          reportType: 'PRICE_ALERT',
          contentJson: {
            bestPrice: bestPrice.toString(),
            threshold: tracker.priceAlertThresholdEuro?.toString(),
          },
        },
      });
    } catch (err) {
      console.error(`❌ Failed to send price alert for "${tracker.name}":`, err);
    }
  }
}
