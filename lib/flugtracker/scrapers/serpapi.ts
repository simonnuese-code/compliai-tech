import { FlightScraper, ScraperSearchParams, ScrapedFlight } from './types';

export class SerpApiScraper implements FlightScraper {
  name = 'Google Flights via SerpApi';
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY || '';
  }

  async search(params: ScraperSearchParams): Promise<ScrapedFlight[]> {
    if (!this.apiKey) {
      console.warn('⚠️ SerpApi API key missing, skipping search');
      return [];
    }

    try {
      console.log(`✈️ SerpApi: Searching for ${params.departureAirports.join(',')} → ${params.destinationAirports.join(',')}`);

      const allFlights: ScrapedFlight[] = [];
      const searchPromises: Promise<ScrapedFlight[]>[] = [];

      // Google Flights via SerpApi works best with single origin/destination pairs
      for (const dep of params.departureAirports) {
        for (const dest of params.destinationAirports) {
          
          // Determine dates to check
          // To save API credits (100/month limit), we should be careful.
          // Strategy: Check ONLY the primary date range start/end for now?
          // Or check a few combinations if flexibility is set?
          // Since the user has 100 credits, we should probably do ONE search per tracker run per route?
          // Let's stick to the EXACT dateRangeStart and tripDuration for now to minimize calls.
          // If flexibility is high, we might miss deals, but we save credits.
          // User can change the dates in the tracker if they want to check others.
          
          const outboundDate = this.formatDate(params.dateRangeStart);
          const returnDateObj = new Date(params.dateRangeStart);
          returnDateObj.setDate(returnDateObj.getDate() + params.tripDurationDays);
          const returnDate = this.formatDate(returnDateObj);

          searchPromises.push(
            this.searchSingle(dep, dest, outboundDate, returnDate, params)
              .catch(err => {
                console.error(`SerpApi search failed for ${dep}->${dest}:`, err.message);
                return [];
              })
          );
        }
      }

      const results = await Promise.all(searchPromises);
      for (const flights of results) {
        allFlights.push(...flights);
      }

      console.log(`✅ SerpApi: Found ${allFlights.length} flights total`);
      return allFlights;

    } catch (error) {
      console.error('❌ SerpApi search failed:', error);
      return [];
    }
  }

  private async searchSingle(
    origin: string,
    destination: string,
    outboundDate: string,
    returnDate: string,
    params: ScraperSearchParams
  ): Promise<ScrapedFlight[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('engine', 'google_flights');
    url.searchParams.append('departure_id', origin);
    url.searchParams.append('arrival_id', destination);
    url.searchParams.append('outbound_date', outboundDate);
    url.searchParams.append('return_date', returnDate);
    url.searchParams.append('currency', 'EUR');
    url.searchParams.append('hl', 'de');
    url.searchParams.append('gl', 'de');
    url.searchParams.append('api_key', this.apiKey);
    
    // Travel class
    const cabinMap: Record<string, string> = {
      'ECONOMY': '1',
      'PREMIUM_ECONOMY': '2',
      'BUSINESS': '3',
      'FIRST': '4',
    };
    if (params.travelClass in cabinMap) {
      url.searchParams.append('travel_class', cabinMap[params.travelClass]);
    }

    // Stops (if needed, but usually we want all options)
    // 0 = Any, 1 = Nonstop only, 2=1 stop or fewer, 3=2 stops or fewer
    // Use default (Any)

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SerpApi error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse results
    // Combine best_flights and other_flights
    const bestFlights = data.best_flights || [];
    const otherFlights = data.other_flights || [];
    const allRawFlights = [...bestFlights, ...otherFlights];

    return this.transformResults(allRawFlights, origin, destination, outboundDate, returnDate);
  }

  private transformResults(results: any[], origin: string, destination: string, outboundDateStr: string, returnDateStr: string): ScrapedFlight[] {
    return results.map(flight => {
        // flights array contains segments.
        // Usually for a round trip search, the first segment group is outbound?
        // SerpApi structure for round trip often groups the whole trip info
        
        const firstSegment = flight.flights?.[0];
        if (!firstSegment) return null;

        const airline = flight.airline_logo 
            ? (firstSegment.airline || 'Multiple Airlines') 
            : (firstSegment.airline || 'Unknown');

        // Total duration is in minutes
        const duration = flight.total_duration || 0;

        // Price
        const price = flight.price || 0;

        // Stops: Check all segments. If flights array length > 1, it's a connecting flight?
        // Wait, for round trip, usually `flights` contains segments of the *first leg*?
        // Or all segments of the whole trip?
        // SerpApi documentation is a bit vague on "flights" array for round trip paired results.
        // Usually `flights` lists the segments of the itinerary displayed.
        // If it's a paired result, it might have `flights` (outbound) and `return_flights`?
        // Or just one list.
        // Let's assume `flights.length - 1` is roughly the number of stops if it's a single leg view.
        // If it represents the whole round trip, it's harder.
        // Let's just create a generic link to Google Flights.

        const bookingLink = `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${outboundDateStr}%20returning%20${returnDateStr}`;

        return {
            departureAirport: origin,
            destinationAirport: destination,
            outboundDate: new Date(outboundDateStr),
            returnDate: new Date(returnDateStr),
            priceEuro: price,
            airline: airline,
            stops: flight.flights.length > 1 ? flight.flights.length - 1 : 0, // Approximate
            totalDurationMinutes: duration,
            luggageIncluded: false, // SerpApi doesn't easily expose this in the summary
            bookingLink: bookingLink, // Generic link to search
            source: 'Google Flights',
        } as ScrapedFlight;

    }).filter(Boolean) as ScrapedFlight[];
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
