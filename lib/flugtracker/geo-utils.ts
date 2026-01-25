// Geolocation utilities for airport distance calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format duration from minutes to human readable string
 * @param minutes Total duration in minutes
 * @returns Formatted string like "11h 30min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format price in Euro
 * @param price Price as number
 * @returns Formatted price string like "487€"
 */
export function formatPrice(price: number): string {
  return `${Math.round(price)}€`;
}

/**
 * Format date range for display
 * @param start Start date
 * @param end End date
 * @returns Formatted string like "01.08.2025 - 31.08.2025"
 */
export function formatDateRange(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Format route from airport arrays
 * @param departure Departure airport codes
 * @param destination Destination airport codes
 * @returns Formatted route like "DUS/FMO → PVG/SHA"
 */
export function formatRoute(departure: string[], destination: string[]): string {
  return `${departure.join('/')} → ${destination.join('/')}`;
}

/**
 * Get calendar week number for a date
 * @param date Date to get week number for
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if date is before today
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

/**
 * Get all dates in range with flexibility
 * @param start Start date
 * @param end End date
 * @param duration Trip duration in days
 * @param flexibility Flexibility setting
 * @returns Array of { outbound, return } date pairs
 */
export function getDateCombinations(
  start: Date,
  end: Date,
  duration: number,
  flexibility: 'EXACT' | 'PLUS_MINUS_1' | 'PLUS_MINUS_2'
): Array<{ outbound: Date; return: Date }> {
  const combinations: Array<{ outbound: Date; return: Date }> = [];
  const flexDays = flexibility === 'EXACT' ? 0 : flexibility === 'PLUS_MINUS_1' ? 1 : 2;
  
  const currentDate = new Date(start);
  const endDate = new Date(end);
  
  while (currentDate <= endDate) {
    // For each possible outbound date
    for (let flex = -flexDays; flex <= flexDays; flex++) {
      const returnDate = new Date(currentDate);
      returnDate.setDate(returnDate.getDate() + duration + flex);
      
      // Only add if return date is within the end range (with some buffer)
      const maxReturn = new Date(endDate);
      maxReturn.setDate(maxReturn.getDate() + duration + flexDays);
      
      if (returnDate <= maxReturn && !isPastDate(currentDate)) {
        combinations.push({
          outbound: new Date(currentDate),
          return: returnDate,
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return combinations;
}

/**
 * Generate a hash for flight deduplication
 * @param flight Flight details
 * @returns Hash string
 */
export function generateFlightHash(flight: {
  departureAirport: string;
  destinationAirport: string;
  outboundDate: Date;
  returnDate: Date;
  airline: string;
  stops: number;
}): string {
  const outbound = new Date(flight.outboundDate).toISOString().split('T')[0];
  const returnD = new Date(flight.returnDate).toISOString().split('T')[0];
  return `${flight.departureAirport}-${flight.destinationAirport}-${outbound}-${returnD}-${flight.airline}-${flight.stops}`;
}
