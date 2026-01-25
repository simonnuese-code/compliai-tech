import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ airports: [] });
    }

    // Search airports by city, name, or IATA code
    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { city: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { iataCode: { equals: query.toUpperCase() } },
          { country: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [
        // Prioritize exact IATA matches
        { iataCode: 'asc' },
        { city: 'asc' },
      ],
      take: 20,
    });

    // Format response
    const formattedAirports = airports.map((airport) => ({
      iataCode: airport.iataCode,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      latitude: parseFloat(airport.latitude.toString()),
      longitude: parseFloat(airport.longitude.toString()),
    }));

    return NextResponse.json({ airports: formattedAirports });
  } catch (error) {
    console.error('Airport search error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Flughafen-Suche' },
      { status: 500 }
    );
  }
}
