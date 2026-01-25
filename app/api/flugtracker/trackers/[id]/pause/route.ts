import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST pause tracker
export async function POST(
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

    const tracker = await prisma.flightTracker.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    return NextResponse.json({ success: true, tracker });
  } catch (error) {
    console.error('Pause tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Pausieren des Trackers' },
      { status: 500 }
    );
  }
}
