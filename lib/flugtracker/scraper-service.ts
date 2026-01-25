import { prisma } from '@/lib/prisma';
import { FlightTracker } from '@prisma/client';
import { KiwiScraper } from './scrapers/kiwi';
import { ScraperSearchParams, ScrapedFlight } from './scrapers/types';
import { generateFlightHash } from './geo-utils';

export class ScraperService {
  private scrapers = [
    new KiwiScraper(),
    // Add Skyscanner/Kayak scrapers here later
  ];

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
      // We only want to keep the NEWEST best offers.
      // Strategy: Insert all new results. Dashboard shows latest ones.
      // Clean up old results periodically (separate job).
      
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
          status: 'ACTIVE' // Ensure active
        }
      });

      // 6. Check for Price Alerts (Basic Implementation)
      if (tracker.priceAlertThresholdEuro || tracker.priceAlertThresholdPercent) {
        this.checkPriceAlerts(tracker, flightDataToInsert);
      }

      console.log(`💾 Saved ${flightDataToInsert.length} flights for tracker ${tracker.name}`);

    } catch (error) {
      console.error(`❌ Error scraping tracker ${trackerId}:`, error);
      // Optional update status to ERROR if multiple failures
      await prisma.flightTracker.update({
        where: { id: trackerId },
        data: { status: 'ERROR' } // Or keep active but log error
      });
    }
  }

  private async checkPriceAlerts(tracker: FlightTracker, newFlights: any[]) {
      const bestPrice = Math.min(...newFlights.map(f => f.priceEuro));
      
      // Simple logic: If best price < threshold -> trigger alert
      // In real app: Check if we ALREADY alerted for this price recently to avoid spam.
      
      let shouldAlert = false;
      
      if (tracker.priceAlertThresholdEuro && bestPrice <= tracker.priceAlertThresholdEuro) {
          shouldAlert = true;
      }
      
      // TODO: Implement email sending trigger here
      if (shouldAlert) {
          console.log(`🚨 PRICE ALERT! Found flight for ${bestPrice}€ (Threshold met)`);
          // triggerEmailAlert(tracker, bestFlight);
      }
  }
}
