import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/lib/flugtracker/scraper-service';
import { prisma } from '@/lib/prisma';

/**
 * Verify cron authorization.
 * Vercel sends an Authorization header with the CRON_SECRET.
 * For manual triggers from the frontend, we verify the user session instead.
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

/**
 * Core scraping logic used by both GET (Vercel cron) and POST (manual trigger).
 */
async function runScrape(request: NextRequest) {
  // Check for manual single-tracker trigger (from frontend detail page)
  const { searchParams } = new URL(request.url);
  const specificTrackerId = searchParams.get('trackerId');

  const service = new ScraperService();

  if (specificTrackerId) {
    // For single-tracker triggers, verify cron secret
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await service.scrapeTracker(specificTrackerId);
    return NextResponse.json({ success: true, message: `Scraped tracker ${specificTrackerId}` });
  }

  // Cron mode: Must be authenticated
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Mark expired trackers (dateRangeEnd is in the past)
  const expiredCount = await prisma.flightTracker.updateMany({
    where: {
      status: 'ACTIVE',
      dateRangeEnd: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  if (expiredCount.count > 0) {
    console.log(`📅 Marked ${expiredCount.count} trackers as EXPIRED`);
  }

  // 2. Find active trackers due for scraping (checked > 12h ago or never checked)
  const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const trackersToScrape = await prisma.flightTracker.findMany({
    where: {
      status: 'ACTIVE',
      dateRangeEnd: { gte: new Date() },
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: cutoffTime } },
      ],
    },
    take: 5, // Process in batches to avoid timeout
  });

  console.log(`🔍 Cron: Found ${trackersToScrape.length} trackers to scrape.`);

  for (const tracker of trackersToScrape) {
    await service.scrapeTracker(tracker.id);
  }

  // 3. Cleanup old flight results (keep only last 30 days)
  const cleanupCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deletedResults = await prisma.flightResult.deleteMany({
    where: {
      checkedAt: { lt: cleanupCutoff },
    },
  });

  if (deletedResults.count > 0) {
    console.log(`🧹 Cleaned up ${deletedResults.count} old flight results`);
  }

  return NextResponse.json({
    success: true,
    processed: trackersToScrape.length,
    expired: expiredCount.count,
    cleanedUp: deletedResults.count,
  });
}

// Vercel Cron sends GET requests
export async function GET(request: NextRequest) {
  try {
    return await runScrape(request);
  } catch (error) {
    console.error('Scrape Cron Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST for backwards compatibility / manual triggers
export async function POST(request: NextRequest) {
  try {
    return await runScrape(request);
  } catch (error) {
    console.error('Scrape Cron Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
