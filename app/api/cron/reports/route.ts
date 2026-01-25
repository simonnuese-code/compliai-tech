import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/flugtracker/email-service';
import { FlightReportType } from '@/lib/flugtracker/types';

// Cron endpoint to generate and send reports
export async function POST(request: NextRequest) {
  try {
     // 1. Security (Optional)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const emailService = new EmailService();

    // 2. Find trackers that need reporting
    // Logic: Active trackers where last report was sent > Frequency
    // simplified for MVP: Check all active trackers, find if report due based on frequency
    
    const activeTrackers = await prisma.flightTracker.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: true,
        reports: {
          orderBy: { sentAt: 'desc' },
          take: 1
        },
        flightResults: {
          orderBy: { priceEuro: 'asc' },
          take: 5
        }
      }
    });

    let sentCount = 0;
    const now = new Date();

    for (const tracker of activeTrackers) {
      if (tracker.flightResults.length === 0) continue;

      const lastReportDate = tracker.reports[0]?.sentAt || new Date(0);
      let due = false;

      // Check frequency
      const daysSinceLastReport = (now.getTime() - lastReportDate.getTime()) / (1000 * 3600 * 24);
      
      if (tracker.reportFrequency === 'DAILY' && daysSinceLastReport >= 1) due = true;
      if (tracker.reportFrequency === 'WEEKLY' && daysSinceLastReport >= 7) due = true;
      if (tracker.reportFrequency === 'MONTHLY' && daysSinceLastReport >= 30) due = true;

      if (due) {
        console.log(`Sending report for tracker ${tracker.name} to ${tracker.user.email}`);
        
        // Prepare data
        // Find previous price from a historical result (simplified: assume we have history in DB)
        // For real history, we'd query flightResults from > 1 week ago. 
        // Here we just use current best vs nothing for MVP simplicty or maybe prev report content if stored?
        // Let's just track current best.
        
        await emailService.sendFlightReport(tracker.user.email, {
          tracker,
          topFlights: tracker.flightResults,
          previousBestPrice: undefined // Can implement proper history lookup later
        });

        // Log report
         await prisma.flightReport.create({
          data: {
            trackerId: tracker.id,
            reportType: 'SCHEDULED' as any, // Cast enum
            contentJson: {
               bestPrice: tracker.flightResults[0].priceEuro,
               flightCount: tracker.flightResults.length
            }
          }
        });
        
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error('Report Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
