import { FlightScraper, ScraperSearchParams, ScrapedFlight } from './types';
import { getDateCombinations } from '../geo-utils';

export class KiwiScraper implements FlightScraper {
  name = 'Kiwi.com';
  private apiKey: string;
  private baseUrl = 'https://api.tequila.kiwi.com/v2';

  constructor() {
    this.apiKey = process.env.KIWI_API_KEY || '';
  }

  async search(params: ScraperSearchParams): Promise<ScrapedFlight[]> {
    if (!this.apiKey) {
      console.warn('Kiwi API key missing, using mock data');
      return this.getMockData(params);
    }

    try {
      // Kiwi allows range search, so we don't need to generate all combinations manually per request
      // We can use date_from and date_to parameters
      
      const departureIds = params.departureAirports.join(',');
      const destinationIds = params.destinationAirports.join(',');
      
      const dateFrom = this.formatDate(params.dateRangeStart);
      const dateTo = this.formatDate(params.dateRangeEnd);
      
      // Calculate nights in devstination
      // Kiwi uses 'nights_in_dest_from' and 'nights_in_dest_to'
      const flexDays = params.flexibility === 'EXACT' ? 0 : params.flexibility === 'PLUS_MINUS_1' ? 1 : 2;
      const nightsFrom = Math.max(1, params.tripDurationDays - flexDays);
      const nightsTo = params.tripDurationDays + flexDays;

      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.append('fly_from', departureIds);
      url.searchParams.append('fly_to', destinationIds);
      url.searchParams.append('date_from', dateFrom);
      url.searchParams.append('date_to', dateTo);
      url.searchParams.append('nights_in_dst_from', nightsFrom.toString());
      url.searchParams.append('nights_in_dst_to', nightsTo.toString());
      url.searchParams.append('adults', params.adults.toString());
      url.searchParams.append('curr', 'EUR');
      url.searchParams.append('locale', 'de');
      url.searchParams.append('limit', '50'); // Limit results
      
      if (params.travelClass !== 'ECONOMY') {
        const cabinMap = {
          'PREMIUM_ECONOMY': 'W', // Kiwi doesn't strictly have standard W code in public docs sometimes, usually uses 'W' or specific cabin param
          'BUSINESS': 'C',
          'FIRST': 'F'
        };
        if (params.travelClass in cabinMap) {
           url.searchParams.append('selected_cabins', cabinMap[params.travelClass as keyof typeof cabinMap]);
        }
      }

      console.log(`Kiwi requesting: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Kiwi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResults(data.data);

    } catch (error) {
      console.error('Kiwi search failed:', error);
      return [];
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  private transformResults(kiwiResults: any[]): ScrapedFlight[] {
    return kiwiResults.map(res => ({
      departureAirport: res.flyFrom,
      destinationAirport: res.flyTo,
      outboundDate: new Date(res.route[0].local_departure), // Simplified, usually first segment
      returnDate: new Date(res.route[res.route.length - 1].local_arrival), // Need to find return leg properly in real generic impl
      // Better Date Logic for return: local_arrival of the last segment of the return trip
      // Or simplify using 'local_arrival' of entire itinerary if roundtrip?
      // Kiwi response 'local_arrival' is landing back at origin.
      
      priceEuro: res.price,
      airline: res.airlines[0], // Primary airline
      stops: res.route.length > 2 ? res.route.length - 2 : 0, // Very rough approximation for roundtrip direct = 2 segments
      totalDurationMinutes: Math.floor(res.duration.total / 60),
      luggageIncluded: res.baglimit && res.baglimit.hold_weight > 0,
      bookingLink: res.deep_link,
      source: 'Kiwi.com',
    }));
  }

  private async getMockData(params: ScraperSearchParams): Promise<ScrapedFlight[]> {
    // Generate some realistic looking fake data based on request
    const mockFlights: ScrapedFlight[] = [];
    const airlines = ['Lufthansa', 'Eurowings', 'Ryanair', 'British Airways', 'Air France', 'KLM'];
    const airports = ['FRA', 'MUC', 'LHR', 'CDG', 'AMS'];
    
    // Create 3-5 random results
    const count = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
        const outbound = new Date(params.dateRangeStart);
        outbound.setDate(outbound.getDate() + Math.floor(Math.random() * 10));
        
        const returns = new Date(outbound);
        returns.setDate(returns.getDate() + params.tripDurationDays);
        
        const priceBase = 150 + Math.random() * 400; // 150 - 550
        
        mockFlights.push({
            departureAirport: params.departureAirports[0] || 'DUS',
            destinationAirport: params.destinationAirports[0] || 'LHR',
            outboundDate: outbound,
            returnDate: returns,
            priceEuro: Math.round(priceBase),
            airline: airlines[Math.floor(Math.random() * airlines.length)],
            stops: Math.random() > 0.7 ? 1 : 0,
            totalDurationMinutes: 60 + Math.floor(Math.random() * 300), // 1h - 6h
            luggageIncluded: Math.random() > 0.5,
            bookingLink: 'https://www.kiwi.com/deep/link/mock',
            source: 'MockData'
        });
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return mockFlights.sort((a, b) => a.priceEuro - b.priceEuro);
  }
}
