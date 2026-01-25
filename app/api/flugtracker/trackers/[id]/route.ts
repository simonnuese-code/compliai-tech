import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

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
    
    if (!session.userId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const tracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.userId,
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
    
    if (!session.userId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingTracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTracker) {
      return NextResponse.json(
        { error: 'Tracker nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const tracker = await prisma.flightTracker.update({
      where: { id },
      data: {
        name: body.name,
        departureAirports: body.departureAirports,
        departureRadiusKm: body.departureRadiusKm,
        destinationAirports: body.destinationAirports,
        dateRangeStart: body.dateRangeStart ? new Date(body.dateRangeStart) : undefined,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : undefined,
        tripDurationDays: body.tripDurationDays,
        flexibility: body.flexibility,
        travelClass: body.travelClass,
        luggageOption: body.luggageOption,
        reportFrequency: body.reportFrequency,
        priceAlertThresholdPercent: body.priceAlertThresholdPercent,
        priceAlertThresholdEuro: body.priceAlertThresholdEuro,
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
    
    if (!session.userId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingTracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.userId,
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
