import { Airport, FlightResult } from '../types';

export interface ScraperSearchParams {
  departureAirports: string[];
  destinationAirports: string[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
  tripDurationDays: number;
  flexibility: 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2';
  travelClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  adults: number;
}

export interface ScrapedFlight {
  departureAirport: string;
  destinationAirport: string;
  outboundDate: Date;
  returnDate: Date;
  priceEuro: number;
  airline: string;
  stops: number;
  totalDurationMinutes: number;
  luggageIncluded: boolean;
  bookingLink: string;
  source: string;
}

export interface FlightScraper {
  name: string;
  search(params: ScraperSearchParams): Promise<ScrapedFlight[]>;
}
