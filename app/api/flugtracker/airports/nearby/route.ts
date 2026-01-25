import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/flugtracker/geo-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude und Longitude sind erforderlich' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseInt(radius, 10) : 200;

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Ungültige Koordinaten' },
        { status: 400 }
      );
    }

    // Get all airports (we'll filter in JS for accurate distance calculation)
    // For production, use PostGIS for better performance
    const allAirports = await prisma.airport.findMany();

    // Calculate distances and filter
    const nearbyAirports = allAirports
      .map((airport) => {
        const airportLat = parseFloat(airport.latitude.toString());
        const airportLng = parseFloat(airport.longitude.toString());
        const distance = calculateDistance(latitude, longitude, airportLat, airportLng);
        
        return {
          iataCode: airport.iataCode,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          latitude: airportLat,
          longitude: airportLng,
          distance: Math.round(distance),
        };
      })
      .filter((airport) => airport.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      airports: nearbyAirports,
      searchedCoordinates: { latitude, longitude },
      radiusKm,
    });
  } catch (error) {
    console.error('Nearby airports error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Flughafen-Suche' },
      { status: 500 }
    );
  }
}
