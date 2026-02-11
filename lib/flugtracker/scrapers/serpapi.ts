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
      console.log(`✈️ SerpApi: Searching for ${params.departureAirports.length} origins → ${params.destinationAirports.length} destinations`);

      const allFlights: ScrapedFlight[] = [];
      const searchPromises: Promise<ScrapedFlight[]>[] = [];

      // Google Flights via SerpApi allows comma-separated airport codes
      // But let's batch them to avoid hitting URL length limits or Google limits (usually ~5-7)
      const BATCH_SIZE = 5;

      const depBatches = this.chunkArray(params.departureAirports, BATCH_SIZE);
      const destBatches = this.chunkArray(params.destinationAirports, BATCH_SIZE);

      const outboundDate = this.formatDate(params.dateRangeStart);
      const returnDateObj = new Date(params.dateRangeStart);
      returnDateObj.setDate(returnDateObj.getDate() + params.tripDurationDays);
      const returnDate = this.formatDate(returnDateObj);

      for (const depBatch of depBatches) {
        for (const destBatch of destBatches) {
            const depString = depBatch.join(',');
            const destString = destBatch.join(',');

            searchPromises.push(
                this.searchSingle(depString, destString, outboundDate, returnDate, params)
                  .catch(err => {
                    console.error(`SerpApi search failed for ${depString}->${destString}:`, err.message);
                    return [];
                  })
            );
            
            // Add a small delay to prevent immediate rate limit if multiple batches
            if (depBatches.length * destBatches.length > 1) {
                await new Promise(r => setTimeout(r, 500));
            }
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

  private chunkArray(array: string[], size: number): string[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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

  private transformResults(results: any[], originParam: string, destinationParam: string, outboundDateStr: string, returnDateStr: string): ScrapedFlight[] {
    return results.map(flight => {
        const firstSegment = flight.flights?.[0];
        const lastSegment = flight.flights?.[flight.flights.length - 1]; // Last segment of outbound leg?

        if (!firstSegment) return null;

        // Extract actual airport codes from the result
        const actualDeparture = firstSegment.departure_airport?.id || originParam.split(',')[0]; // Fallback to first requested
        const actualDestination = lastSegment?.arrival_airport?.id || destinationParam.split(',')[0];

        const airline = flight.airline_logo 
            ? (firstSegment.airline || 'Multiple Airlines') 
            : (firstSegment.airline || 'Unknown');

        // Total duration is in minutes
        const duration = flight.total_duration || 0;

        const price = flight.price || 0;

        // Use the actual found airports for the deep link to be specific
        const bookingLink = `https://www.google.com/travel/flights?q=Flights%20to%20${actualDestination}%20from%20${actualDeparture}%20on%20${outboundDateStr}%20returning%20${returnDateStr}`;

        return {
            departureAirport: actualDeparture,
            destinationAirport: actualDestination,
            outboundDate: new Date(outboundDateStr),
            returnDate: new Date(returnDateStr),
            priceEuro: price,
            airline: airline,
            stops: flight.flights.length > 1 ? flight.flights.length - 1 : 0, 
            totalDurationMinutes: duration,
            luggageIncluded: false, 
            bookingLink: bookingLink, 
            source: 'Google Flights',
        } as ScrapedFlight;

    }).filter(Boolean) as ScrapedFlight[];
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
