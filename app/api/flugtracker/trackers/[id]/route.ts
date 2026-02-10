import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { createTrackerApiSchema } from '@/lib/flugtracker/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single tracker with details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    const { id } = await params;
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const tracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        flightResults: {
          orderBy: { checkedAt: 'desc' },
          take: 100,
        },
        reports: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tracker });
  } catch (error) {
    console.error('Get tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Trackers' },
      { status: 500 }
    );
  }
}

// PUT update tracker
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    const { id } = await params;
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingTracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTracker) {
      return NextResponse.json(
        { error: 'Tracker nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate input with partial schema (all fields optional for update)
    const validationResult = createTrackerApiSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingaben', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const tracker = await prisma.flightTracker.update({
      where: { id },
      data: {
        name: validatedData.name,
        departureAirports: validatedData.departureAirports,
        departureRadiusKm: validatedData.departureRadiusKm,
        destinationAirports: validatedData.destinationAirports,
        dateRangeStart: validatedData.dateRangeStart ? new Date(validatedData.dateRangeStart) : undefined,
        dateRangeEnd: validatedData.dateRangeEnd ? new Date(validatedData.dateRangeEnd) : undefined,
        tripDurationDays: validatedData.tripDurationDays,
        flexibility: validatedData.flexibility,
        travelClass: validatedData.travelClass,
        luggageOption: validatedData.luggageOption,
        reportFrequency: validatedData.reportFrequency,
        priceAlertThresholdPercent: validatedData.priceAlertThresholdPercent,
        priceAlertThresholdEuro: validatedData.priceAlertThresholdEuro,
      },
    });

    return NextResponse.json({ success: true, tracker });
  } catch (error) {
    console.error('Update tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Trackers' },
      { status: 500 }
    );
  }
}

// DELETE tracker
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    const { id } = await params;
    
    if (!session.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingTracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTracker) {
      return NextResponse.json(
        { error: 'Tracker nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.flightTracker.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Trackers' },
      { status: 500 }
    );
  }
}
