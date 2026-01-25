/**
 * Airport Data Import Script
 * 
 * This script imports airport data from the OpenFlights database.
 * Run with: npx tsx scripts/import-airports.ts
 * 
 * Data source: https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OpenFlightsAirport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: string;
  longitude: string;
  altitude: string;
  timezone: string;
  dst: string;
  tz: string;
  type: string;
  source: string;
}

// Major international airports - curated list for better UX
// This includes all major German airports and important international hubs
const PRIORITY_AIRPORTS = new Set([
  // Germany
  'FRA', 'MUC', 'DUS', 'TXL', 'BER', 'HAM', 'STR', 'CGN', 'HAJ', 'NUE', 
  'LEJ', 'DRS', 'FMO', 'DTM', 'PAD', 'BRE', 'SCN', 'FDH', 'NRN', 'FKB',
  // Europe Major
  'LHR', 'LGW', 'STN', 'CDG', 'ORY', 'AMS', 'BCN', 'MAD', 'FCO', 'MXP',
  'VIE', 'ZRH', 'GVA', 'BRU', 'CPH', 'OSL', 'ARN', 'HEL', 'WAW', 'PRG',
  'BUD', 'ATH', 'IST', 'LIS', 'DUB',
  // Asia Major
  'PVG', 'SHA', 'PEK', 'PKX', 'CAN', 'SZX', 'HKG', 'NRT', 'HND', 'KIX',
  'ICN', 'GMP', 'SIN', 'BKK', 'KUL', 'CGK', 'MNL', 'DEL', 'BOM', 'DXB',
  'DOH', 'AUH', 'TLV',
  // Americas
  'JFK', 'LAX', 'ORD', 'DFW', 'MIA', 'SFO', 'BOS', 'ATL', 'IAD', 'EWR',
  'YYZ', 'YVR', 'MEX', 'GRU', 'EZE', 'SCL', 'BOG', 'LIM',
  // Oceania
  'SYD', 'MEL', 'BNE', 'AKL',
  // Africa
  'JNB', 'CPT', 'CAI', 'CMN', 'NBO',
]);

async function fetchAirportData(): Promise<OpenFlightsAirport[]> {
  const response = await fetch(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'
  );
  const text = await response.text();
  
  const airports: OpenFlightsAirport[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Parse CSV - handle quoted strings
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 14) {
      const iata = values[4].replace(/"/g, '');
      
      // Skip airports without IATA code or with invalid codes
      if (!iata || iata === '\\N' || iata.length !== 3) continue;
      
      airports.push({
        id: values[0],
        name: values[1].replace(/"/g, ''),
        city: values[2].replace(/"/g, ''),
        country: values[3].replace(/"/g, ''),
        iata: iata,
        icao: values[5].replace(/"/g, ''),
        latitude: values[6],
        longitude: values[7],
        altitude: values[8],
        timezone: values[9],
        dst: values[10],
        tz: values[11].replace(/"/g, ''),
        type: values[12].replace(/"/g, ''),
        source: values[13].replace(/"/g, ''),
      });
    }
  }
  
  return airports;
}

async function importAirports() {
  console.log('🛫 Starting airport data import...');
  
  try {
    // Fetch airport data
    console.log('📡 Fetching data from OpenFlights...');
    const airports = await fetchAirportData();
    console.log(`📊 Found ${airports.length} airports with valid IATA codes`);
    
    // Filter and prioritize
    // Include all priority airports plus large airports from each country
    const filteredAirports = airports.filter(airport => {
      // Always include priority airports
      if (PRIORITY_AIRPORTS.has(airport.iata)) return true;
      
      // Include airports marked as large/medium
      if (airport.type === 'large_airport' || airport.type === 'medium_airport') return true;
      
      // Skip very small airports
      return false;
    });
    
    console.log(`✂️ Filtered to ${filteredAirports.length} relevant airports`);
    
    // Clear existing airports
    console.log('🗑️ Clearing existing airport data...');
    await prisma.$executeRaw`TRUNCATE TABLE airports CASCADE`;
    
    // Insert in batches
    console.log('💾 Importing airports...');
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < filteredAirports.length; i += batchSize) {
      const batch = filteredAirports.slice(i, i + batchSize);
      
      await prisma.airport.createMany({
        data: batch.map(airport => ({
          iataCode: airport.iata,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          latitude: parseFloat(airport.latitude),
          longitude: parseFloat(airport.longitude),
          timezone: airport.tz || null,
        })),
        skipDuplicates: true,
      });
      
      imported += batch.length;
      console.log(`  Imported ${imported}/${filteredAirports.length} airports...`);
    }
    
    // Log some stats
    const stats = await prisma.airport.groupBy({
      by: ['country'],
      _count: true,
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 10
    });
    
    console.log('\n📈 Top 10 countries by airport count:');
    for (const stat of stats) {
      console.log(`  ${stat.country}: ${stat._count} airports`);
    }
    
    const total = await prisma.airport.count();
    console.log(`\n✅ Successfully imported ${total} airports!`);
    
  } catch (error) {
    console.error('❌ Error importing airports:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAirports().catch(console.error);
