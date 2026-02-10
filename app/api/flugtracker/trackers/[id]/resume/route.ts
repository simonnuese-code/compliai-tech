import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST resume tracker
export async function POST(
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

    const tracker = await prisma.flightTracker.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json({ success: true, tracker });
  } catch (error) {
    console.error('Resume tracker error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Fortsetzen des Trackers' },
      { status: 500 }
    );
  }
}
