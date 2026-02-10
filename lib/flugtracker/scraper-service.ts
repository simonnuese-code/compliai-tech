import { prisma } from '@/lib/prisma';
import { FlightTracker } from '@prisma/client';
import { KiwiScraper } from './scrapers/kiwi';
import { ScraperSearchParams } from './scrapers/types';
import { generateFlightHash } from './geo-utils';
import { EmailService } from './email-service';

export class ScraperService {
  private scrapers = [
    new KiwiScraper(),
    // Add Skyscanner/Kayak scrapers here later
  ];

  private emailService = new EmailService();

  /**
   * Run scraping for a specific tracker
   */
  async scrapeTracker(trackerId: string) {
    console.log(`🔍 Starting scrape for tracker ${trackerId}`);
    
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
        adults: 1, // MVP limit
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

      console.log(`✅ Found ${allResults.length} raw results`);

      if (allResults.length === 0) {
        // Log checked even if no results
        await prisma.flightTracker.update({
          where: { id: trackerId },
          data: { lastCheckedAt: new Date() }
        });
        return;
      }

      // 4. Deduplicate and Process Results
      const flightDataToInsert = allResults.map(flight => {
        const hash = generateFlightHash({
            departureAirport: flight.departureAirport,
            destinationAirport: flight.destinationAirport,
            outboundDate: flight.outboundDate,
            returnDate: flight.returnDate,
            airline: flight.airline,
            stops: flight.stops
        });

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
        };
      });

      // Batch insert logic
      await prisma.flightResult.createMany({
        data: flightDataToInsert
      });

      // 5. Update Tracker
      await prisma.flightTracker.update({
        where: { id: trackerId },
        data: { 
          lastCheckedAt: new Date(),
          status: 'ACTIVE'
        }
      });

      // 6. Check for Price Alerts
      if (tracker.priceAlertThresholdEuro || tracker.priceAlertThresholdPercent) {
        await this.checkPriceAlerts(tracker, flightDataToInsert);
      }

      console.log(`💾 Saved ${flightDataToInsert.length} flights for tracker ${tracker.name}`);

    } catch (error) {
      console.error(`❌ Error scraping tracker ${trackerId}:`, error);
      await prisma.flightTracker.update({
        where: { id: trackerId },
        data: { status: 'ERROR' }
      });
    }
  }

  private async checkPriceAlerts(tracker: FlightTracker, newFlights: any[]) {
    const bestPrice = Math.min(...newFlights.map(f => f.priceEuro));
    
    let shouldAlert = false;
    
    if (tracker.priceAlertThresholdEuro && bestPrice <= tracker.priceAlertThresholdEuro) {
      shouldAlert = true;
    }
    
    if (!shouldAlert) return;

    // Prevent spam: check if we already sent a PRICE_ALERT report in the last 24h
    const recentAlert = await prisma.flightReport.findFirst({
      where: {
        trackerId: tracker.id,
        reportType: 'PRICE_ALERT',
        sentAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      console.log(`⏭️ Price alert already sent recently for tracker ${tracker.name}, skipping.`);
      return;
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: tracker.userId },
    });

    if (!user) return;

    console.log(`🚨 PRICE ALERT! Found flight for ${bestPrice}€ (Threshold: ${tracker.priceAlertThresholdEuro}€)`);

    try {
      // Get top 5 cheapest flights for the alert email
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

      // Log the alert
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
      console.error(`❌ Failed to send price alert for tracker ${tracker.name}:`, err);
    }
  }
}
