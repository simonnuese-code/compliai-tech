import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/lib/flugtracker/scraper-service';
import { prisma } from '@/lib/prisma';

// This endpoint triggers scraping.
// In production, this should be secured with a CRON_SECRET header to prevent abuse.
export async function POST(request: NextRequest) {
  try {
    // 1. Security Check (Optional but recommended for Cron)
    const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // 2. Determine target
    const { searchParams } = new URL(request.url);
    const specificTrackerId = searchParams.get('trackerId');

    const service = new ScraperService();

    if (specificTrackerId) {
      // Manual trigger for one tracker
      await service.scrapeTracker(specificTrackerId);
      return NextResponse.json({ success: true, message: `Scraped tracker ${specificTrackerId}` });
    } else {
      // Cron mode: Find trackers due for check
      // Logic: Active trackers checked > 12h ago
      const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago

      const trackersToScrape = await prisma.flightTracker.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { lastCheckedAt: null },
            { lastCheckedAt: { lt: cutoffTime } }
          ]
        },
        take: 5 // Process in batches to avoid timeout
      });

      console.log(`Cron: Found ${trackersToScrape.length} trackers to scrape.`);

      // Scrape in sequence or limited parallel to avoid rate limits
      for (const tracker of trackersToScrape) {
        await service.scrapeTracker(tracker.id);
      }

      return NextResponse.json({ 
        success: true, 
        processed: trackersToScrape.length 
      });
    }

  } catch (error) {
    console.error('Scrape Cron Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
