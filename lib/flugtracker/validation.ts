import { z } from 'zod';

// Step 1: Departure validation
export const departureSchema = z.object({
  departureCity: z.string().min(1, 'Bitte geben Sie eine Stadt ein'),
  departureRadius: z.number().min(50).max(300).default(200),
  departureAirports: z.array(z.string().length(3)).min(1, 'Bitte wählen Sie mindestens einen Flughafen'),
});

// Step 2: Destination validation
export const destinationSchema = z.object({
  destinationCity: z.string().min(1, 'Bitte geben Sie eine Zielstadt ein'),
  destinationAirports: z.array(z.string().length(3)).min(1, 'Bitte wählen Sie mindestens einen Flughafen'),
});

// Step 3: Date range validation
export const dateRangeSchema = z.object({
  dateRangeStart: z.date().refine(
    (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Das Startdatum muss heute oder in der Zukunft liegen'
  ),
  dateRangeEnd: z.date(),
}).refine(
  (data) => data.dateRangeEnd > data.dateRangeStart,
  {
    message: 'Das Enddatum muss nach dem Startdatum liegen',
    path: ['dateRangeEnd'],
  }
);

// Step 4: Duration validation
export const durationSchema = z.object({
  tripDurationDays: z.number().min(1, 'Mindestens 1 Tag').max(90, 'Maximal 90 Tage'),
  flexibility: z.enum(['EXACT', 'PLUS_MINUS_1', 'PLUS_MINUS_2']),
});

// Step 5: Flight options validation  
export const flightOptionsSchema = z.object({
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  luggageOption: z.enum(['INCLUDED', 'HAND_ONLY', 'BOTH']),
});

// Step 6: Notifications validation
export const notificationsSchema = z.object({
  name: z.string().min(1, 'Bitte geben Sie einen Namen für den Tracker ein').max(100, 'Name darf maximal 100 Zeichen haben'),
  reportFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  priceAlertEnabled: z.boolean(),
  priceAlertType: z.enum(['percent', 'euro']).optional(),
  priceAlertValue: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.priceAlertEnabled) {
      return data.priceAlertType && data.priceAlertValue && data.priceAlertValue > 0;
    }
    return true;
  },
  {
    message: 'Bitte geben Sie einen Schwellenwert für den Preis-Alert ein',
    path: ['priceAlertValue'],
  }
);

// Combined full tracker schema
export const trackerFormSchema = z.object({
  // Step 1
  departureCity: z.string().min(1, 'Bitte geben Sie eine Stadt ein'),
  departureRadius: z.number().min(50).max(300).default(200),
  departureAirports: z.array(z.string().length(3)).min(1, 'Bitte wählen Sie mindestens einen Flughafen'),
  
  // Step 2
  destinationCity: z.string().min(1, 'Bitte geben Sie eine Zielstadt ein'),
  destinationAirports: z.array(z.string().length(3)).min(1, 'Bitte wählen Sie mindestens einen Flughafen'),
  
  // Step 3
  dateRangeStart: z.date(),
  dateRangeEnd: z.date(),
  
  // Step 4
  tripDurationDays: z.number().min(1).max(90),
  flexibility: z.enum(['EXACT', 'PLUS_MINUS_1', 'PLUS_MINUS_2']),
  
  // Step 5
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  luggageOption: z.enum(['INCLUDED', 'HAND_ONLY', 'BOTH']),
  
  // Step 6
  name: z.string().min(1).max(100),
  reportFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  priceAlertEnabled: z.boolean(),
  priceAlertType: z.enum(['percent', 'euro']).optional(),
  priceAlertValue: z.number().positive().optional(),
});

export type TrackerFormSchema = z.infer<typeof trackerFormSchema>;

// API request validation
export const createTrackerApiSchema = z.object({
  name: z.string().min(1).max(100),
  departureAirports: z.array(z.string().length(3)).min(1),
  departureRadiusKm: z.number().min(50).max(300),
  destinationAirports: z.array(z.string().length(3)).min(1),
  dateRangeStart: z.string().datetime(),
  dateRangeEnd: z.string().datetime(),
  tripDurationDays: z.number().min(1).max(90),
  flexibility: z.enum(['EXACT', 'PLUS_MINUS_1', 'PLUS_MINUS_2']),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  luggageOption: z.enum(['INCLUDED', 'HAND_ONLY', 'BOTH']),
  reportFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  priceAlertThresholdPercent: z.number().positive().optional(),
  priceAlertThresholdEuro: z.number().positive().optional(),
});

export type CreateTrackerApiPayload = z.infer<typeof createTrackerApiSchema>;

// Airport search validation
export const airportSearchSchema = z.object({
  query: z.string().min(2, 'Mindestens 2 Zeichen'),
});

export const airportNearbySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(50).max(500).default(200),
});
