import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ScraperService } from '@/lib/flugtracker/scraper-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: manually trigger scraping for a specific tracker (user-facing)
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
    const tracker = await prisma.flightTracker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker nicht gefunden' },
        { status: 404 }
      );
    }

    if (tracker.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Tracker ist nicht aktiv' },
        { status: 400 }
      );
    }

    // Rate limit: don't allow manual scrape more than once per 5 minutes
    if (tracker.lastCheckedAt) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (tracker.lastCheckedAt > fiveMinutesAgo) {
        return NextResponse.json(
          { error: 'Bitte warten Sie 5 Minuten zwischen den Suchen' },
          { status: 429 }
        );
      }
    }

    const service = new ScraperService();
    await service.scrapeTracker(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Manual scrape error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Suche' },
      { status: 500 }
    );
  }
}
