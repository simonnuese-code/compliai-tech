import { FlightScraper, ScraperSearchParams, ScrapedFlight } from './types';
import { generateSmartDateSamples } from '../flight-intelligence';

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
      // Generate smart date samples across the entire date range
      // This is the key improvement: instead of searching only 1 date,
      // we sample strategically across the range (like Skyscanner's "cheapest month")
      const dateSamples = generateSmartDateSamples(
        params.dateRangeStart,
        params.dateRangeEnd,
        params.tripDurationDays,
        params.flexibility
      );

      console.log(`✈️ SerpApi: Scanning ${dateSamples.length} date samples across ${params.departureAirports.length} origins → ${params.destinationAirports.length} destinations`);

      const allFlights: ScrapedFlight[] = [];

      // Google Flights via SerpApi allows comma-separated airport codes
      const BATCH_SIZE = 5;
      const depBatches = this.chunkArray(params.departureAirports, BATCH_SIZE);
      const destBatches = this.chunkArray(params.destinationAirports, BATCH_SIZE);

      // For each date sample, search all airport combinations
      for (const dateSample of dateSamples) {
        const outboundDate = this.formatDate(dateSample.outbound);
        const returnDate = this.formatDate(dateSample.return);

        const searchPromises: Promise<ScrapedFlight[]>[] = [];

        for (const depBatch of depBatches) {
          for (const destBatch of destBatches) {
            const depString = depBatch.join(',');
            const destString = destBatch.join(',');

            searchPromises.push(
              this.searchSingle(depString, destString, outboundDate, returnDate, params)
                .catch(err => {
                  console.error(`SerpApi search failed for ${depString}->${destString} on ${outboundDate}:`, err.message);
                  return [];
                })
            );

            // Rate limit delay between requests
            if (depBatches.length * destBatches.length > 1) {
              await new Promise(r => setTimeout(r, 300));
            }
          }
        }

        const results = await Promise.all(searchPromises);
        for (const flights of results) {
          allFlights.push(...flights);
        }

        // Small delay between date samples to respect API rate limits
        if (dateSamples.length > 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      console.log(`✅ SerpApi: Found ${allFlights.length} flights across ${dateSamples.length} dates`);
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

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SerpApi error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Combine best_flights and other_flights
    const bestFlights = data.best_flights || [];
    const otherFlights = data.other_flights || [];
    
    let allRawFlights = [...bestFlights];
    
    // Sort other flights by price
    const sortedOther = otherFlights.sort((a: any, b: any) => (a.price || 99999) - (b.price || 99999));
    allRawFlights = [...allRawFlights, ...sortedOther];
    
    // Take top 10 per date/route combination
    const limitedFlights = allRawFlights.slice(0, 10);

    return this.transformResults(limitedFlights, origin, destination, outboundDate, returnDate);
  }

  private transformResults(results: any[], originParam: string, destinationParam: string, outboundDateStr: string, returnDateStr: string): ScrapedFlight[] {
    return results.map(flight => {
        const firstSegment = flight.flights?.[0];
        const lastSegment = flight.flights?.[flight.flights.length - 1];

        if (!firstSegment) return null;

        const actualDeparture = firstSegment.departure_airport?.id || originParam.split(',')[0];
        const actualDestination = lastSegment?.arrival_airport?.id || destinationParam.split(',')[0];

        const airline = flight.airline_logo 
            ? (firstSegment.airline || 'Multiple Airlines') 
            : (firstSegment.airline || 'Unknown');

        const duration = flight.total_duration || 0;
        const price = flight.price || 0;

        // Build a proper Google Flights deep link
        const bookingLink = this.buildGoogleFlightsUrl(actualDeparture, actualDestination, outboundDateStr, returnDateStr);

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

  /**
   * Build a Google Flights deep link URL using protobuf-encoded `tfs` parameter.
   */
  private buildGoogleFlightsUrl(origin: string, destination: string, outboundDate: string, returnDate: string): string {
    const encodeVarint = (value: number): number[] => {
      const bytes: number[] = [];
      while (value > 0x7f) {
        bytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
      }
      bytes.push(value & 0x7f);
      return bytes;
    };

    const tag = (fieldNumber: number, wireType: number): number[] =>
      encodeVarint((fieldNumber << 3) | wireType);

    const varintField = (fieldNumber: number, value: number): number[] =>
      [...tag(fieldNumber, 0), ...encodeVarint(value)];

    const stringField = (fieldNumber: number, value: string): number[] => {
      const encoded = new TextEncoder().encode(value);
      return [...tag(fieldNumber, 2), ...encodeVarint(encoded.length), ...Array.from(encoded)];
    };

    const messageField = (fieldNumber: number, content: number[]): number[] =>
      [...tag(fieldNumber, 2), ...encodeVarint(content.length), ...content];

    const airport = (code: string): number[] =>
      [...varintField(1, 1), ...stringField(2, code)];

    const leg = (date: string, from: string, to: string): number[] =>
      [...stringField(2, date), ...messageField(13, airport(from)), ...messageField(14, airport(to))];

    const tfs = new Uint8Array([
      ...varintField(1, 28),
      ...varintField(2, 2),
      ...messageField(3, leg(outboundDate, origin, destination)),
      ...messageField(3, leg(returnDate, destination, origin)),
    ]);

    const base64 = Buffer.from(tfs).toString('base64url');
    return `https://www.google.com/travel/flights/search?tfs=${base64}&curr=EUR&hl=de`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
