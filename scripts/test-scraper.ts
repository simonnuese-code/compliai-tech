import { SerpApiScraper } from '../lib/flugtracker/scrapers/serpapi';
import { ScraperSearchParams } from '../lib/flugtracker/scrapers/types';

async function main() {
  const scraper = new SerpApiScraper();
  
  // Example Params based on your screenshot (FMO/DTM... -> PVG/SHA)
  // Date: 31.07.2026
  const params: ScraperSearchParams = {
    departureAirports: ['FRA'], // Try simpler first
    destinationAirports: ['JFK'],
    dateRangeStart: new Date('2026-07-31'),
    dateRangeEnd: new Date('2026-08-10'), // irrelevant for single check logic
    tripDurationDays: 14,
    flexibility: 'EXACT',
    travelClass: 'ECONOMY',
    adults: 1,
  };

  console.log('Running SerpApi Test...');
  try {
    const results = await scraper.search(params);
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
