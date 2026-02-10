import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/flugtracker/email-service';

/**
 * Verify cron authorization via CRON_SECRET.
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Core report logic used by both GET (Vercel cron) and POST (manual).
 */
async function runReports(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const emailService = new EmailService();

  // Find active trackers that may need reporting
  const activeTrackers = await prisma.flightTracker.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: true,
      reports: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      flightResults: {
        orderBy: { priceEuro: 'asc' },
        take: 5,
      },
    },
  });

  let sentCount = 0;
  const now = new Date();

  for (const tracker of activeTrackers) {
    if (tracker.flightResults.length === 0) continue;

    const lastReportDate = tracker.reports[0]?.sentAt || new Date(0);
    let due = false;

    const daysSinceLastReport =
      (now.getTime() - lastReportDate.getTime()) / (1000 * 3600 * 24);

    if (tracker.reportFrequency === 'DAILY' && daysSinceLastReport >= 1) due = true;
    if (tracker.reportFrequency === 'WEEKLY' && daysSinceLastReport >= 7) due = true;
    if (tracker.reportFrequency === 'MONTHLY' && daysSinceLastReport >= 30) due = true;

    if (due) {
      console.log(`📧 Sending report for tracker "${tracker.name}" to ${tracker.user.email}`);

      try {
        await emailService.sendFlightReport(tracker.user.email, {
          tracker,
          topFlights: tracker.flightResults,
          previousBestPrice: undefined,
        });

        // Log report in DB
        await prisma.flightReport.create({
          data: {
            trackerId: tracker.id,
            reportType: 'SCHEDULED',
            contentJson: {
              bestPrice: tracker.flightResults[0].priceEuro.toString(),
              flightCount: tracker.flightResults.length,
            },
          },
        });

        sentCount++;
      } catch (err) {
        console.error(`❌ Failed to send report for tracker ${tracker.id}:`, err);
      }
    }
  }

  return NextResponse.json({ success: true, sent: sentCount });
}

// Vercel Cron sends GET requests
export async function GET(request: NextRequest) {
  try {
    return await runReports(request);
  } catch (error) {
    console.error('Report Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    return await runReports(request);
  } catch (error) {
    console.error('Report Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
