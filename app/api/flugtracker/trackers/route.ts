import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { createTrackerApiSchema } from '@/lib/flugtracker/validation';

// GET all trackers for the current user
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const trackers = await prisma.flightTracker.findMany({
      where: { userId: session.user.id },
      include: {
        flightResults: {
          orderBy: { priceEuro: 'asc' },
          take: 1,
        },
        _count: {
          select: { flightResults: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format trackers with summary data
    const formattedTrackers = trackers.map((tracker) => ({
      ...tracker,
      cheapestPrice: tracker.flightResults[0]
        ? parseFloat(tracker.flightResults[0].priceEuro.toString())
        : null,
      flightsFound: tracker._count.flightResults,
      dateRangeStart: tracker.dateRangeStart.toISOString(),
      dateRangeEnd: tracker.dateRangeEnd.toISOString(),
      createdAt: tracker.createdAt.toISOString(),
      updatedAt: tracker.updatedAt.toISOString(),
      lastCheckedAt: tracker.lastCheckedAt?.toISOString() || null,
    }));

    return NextResponse.json({ trackers: formattedTrackers });
  } catch (error) {
    console.error('Get trackers error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Tracker' },
      { status: 500 }
    );
  }
}

// POST create a new tracker
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTrackerApiSchema.parse(body);

    // Create tracker
    const tracker = await prisma.flightTracker.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        departureAirports: validatedData.departureAirports,
        departureRadiusKm: validatedData.departureRadiusKm,
        destinationAirports: validatedData.destinationAirports,
        dateRangeStart: new Date(validatedData.dateRangeStart),
        dateRangeEnd: new Date(validatedData.dateRangeEnd),
        tripDurationDays: validatedData.tripDurationDays,
        flexibility: validatedData.flexibility,
        travelClass: validatedData.travelClass,
        luggageOption: validatedData.luggageOption,
        reportFrequency: validatedData.reportFrequency,
        priceAlertThresholdPercent: validatedData.priceAlertThresholdPercent,
        priceAlertThresholdEuro: validatedData.priceAlertThresholdEuro,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      tracker: {
        ...tracker,
        dateRangeStart: tracker.dateRangeStart.toISOString(),
        dateRangeEnd: tracker.dateRangeEnd.toISOString(),
        createdAt: tracker.createdAt.toISOString(),
        updatedAt: tracker.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Trackers' },
      { status: 500 }
    );
  }
}
