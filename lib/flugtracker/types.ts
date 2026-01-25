// Flugtracker TypeScript Types

// Enums matching Prisma schema
export type FlexibilityType = 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2';
export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type LuggageOption = 'INCLUDED' | 'HAND_ONLY' | 'BOTH';
export type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type TrackerStatus = 'ACTIVE' | 'PAUSED' | 'ERROR' | 'EXPIRED';
export type FlightReportType = 'SCHEDULED' | 'PRICE_ALERT';

// Airport
export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  distance?: number; // Calculated distance from search point
}

// Flight Tracker
export interface FlightTracker {
  id: string;
  userId: string;
  name: string;
  departureAirports: string[];
  departureRadiusKm: number;
  destinationAirports: string[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
  tripDurationDays: number;
  flexibility: FlexibilityType;
  travelClass: TravelClass;
  luggageOption: LuggageOption;
  reportFrequency: ReportFrequency;
  priceAlertThresholdPercent?: number | null;
  priceAlertThresholdEuro?: number | null;
  status: TrackerStatus;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date | null;
}

// Flight Result
export interface FlightResult {
  id: string;
  trackerId: string;
  checkedAt: Date;
  departureAirport: string;
  destinationAirport: string;
  outboundDate: Date;
  returnDate: Date;
  priceEuro: number;
  airline: string;
  stops: number;
  totalDurationMinutes: number;
  luggageIncluded: boolean;
  bookingLink?: string | null;
  source: string;
}

// Flight Report
export interface FlightReport {
  id: string;
  trackerId: string;
  sentAt: Date;
  reportType: FlightReportType;
  contentJson: ReportContent;
}

// Report Content Structure
export interface ReportContent {
  summary: {
    cheapestPrice: number;
    previousCheapestPrice?: number;
    priceChange?: number;
    priceChangePercent?: number;
  };
  recommendation?: FlightResult;
  topFlights: FlightResult[];
  trackerDetails: {
    name: string;
    route: string;
    dateRange: string;
    duration: string;
  };
}

// Tracker Creation Form Data
export interface TrackerFormData {
  // Step 1: Departure
  departureCity: string;
  departureRadius: number;
  departureAirports: string[];
  
  // Step 2: Destination
  destinationCity: string;
  destinationAirports: string[];
  
  // Step 3: Date Range
  dateRangeStart: Date;
  dateRangeEnd: Date;
  
  // Step 4: Duration
  tripDurationDays: number;
  flexibility: FlexibilityType;
  
  // Step 5: Flight Options
  travelClass: TravelClass;
  luggageOption: LuggageOption;
  
  // Step 6: Notifications
  name: string;
  reportFrequency: ReportFrequency;
  priceAlertEnabled: boolean;
  priceAlertType?: 'percent' | 'euro';
  priceAlertValue?: number;
}

// API Response Types
export interface AirportSearchResult {
  airports: Airport[];
  searchedCity?: string;
  searchedCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TrackerTestResult {
  success: boolean;
  flightsFound: number;
  sampleFlights?: FlightResult[];
  error?: string;
}

// Dashboard Types
export interface TrackerSummary extends FlightTracker {
  cheapestPrice?: number;
  flightsFound?: number;
  lastReport?: Date;
}

export interface PriceHistoryPoint {
  date: Date;
  price: number;
  route: string;
}

// Display Helpers
export const FLEXIBILITY_LABELS: Record<FlexibilityType, string> = {
  EXACT: 'Genau',
  PLUS_MINUS_1: '± 1 Tag',
  PLUS_MINUS_2: '± 2 Tage',
};

export const TRAVEL_CLASS_LABELS: Record<TravelClass, string> = {
  ECONOMY: 'Economy',
  PREMIUM_ECONOMY: 'Premium Economy',
  BUSINESS: 'Business',
  FIRST: 'First Class',
};

export const LUGGAGE_OPTION_LABELS: Record<LuggageOption, string> = {
  INCLUDED: 'Mit aufgegebenem Gepäck',
  HAND_ONLY: 'Nur Handgepäck',
  BOTH: 'Beides anzeigen',
};

export const REPORT_FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  DAILY: 'Täglich',
  WEEKLY: 'Wöchentlich',
  MONTHLY: 'Monatlich',
};

export const TRACKER_STATUS_LABELS: Record<TrackerStatus, string> = {
  ACTIVE: 'Aktiv',
  PAUSED: 'Pausiert',
  ERROR: 'Fehler',
  EXPIRED: 'Abgelaufen',
};
