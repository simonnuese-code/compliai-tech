import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBirthdayEmail } from '@/lib/email';

/**
 * Verify cron authorization via CRON_SECRET.
 */
function verifyCronAuth(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not set');
    return false;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Find users whose birthday is today (matching month and day)
 * and send them a birthday email.
 */
async function runBirthdayEmails(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 0-indexed -> 1-indexed
  const currentDay = today.getDate();

  // Find all users who have a birthday set
  const usersWithBirthday = await prisma.user.findMany({
    where: {
      birthday: { not: null },
    },
    select: {
      id: true,
      email: true,
      name: true,
      birthday: true,
    },
  });

  // Filter users whose birthday month and day match today
  const birthdayUsers = usersWithBirthday.filter((user) => {
    if (!user.birthday) return false;
    const bday = new Date(user.birthday);
    return bday.getMonth() + 1 === currentMonth && bday.getDate() === currentDay;
  });

  let sentCount = 0;

  for (const user of birthdayUsers) {
    try {
      console.log(`🎂 Sending birthday email to ${user.email}`);
      await sendBirthdayEmail(user.email, user.name || 'Geburtstagskind');
      sentCount++;
    } catch (err) {
      console.error(`❌ Failed to send birthday email to ${user.email}:`, err);
    }
  }

  console.log(`🎉 Birthday cron completed: ${sentCount} emails sent out of ${birthdayUsers.length} birthdays today.`);

  return NextResponse.json({
    success: true,
    birthdaysToday: birthdayUsers.length,
    emailsSent: sentCount,
  });
}

// Vercel Cron sends GET requests
export async function GET(request: NextRequest) {
  try {
    return await runBirthdayEmails(request);
  } catch (error) {
    console.error('Birthday Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST for manual trigger / testing
export async function POST(request: NextRequest) {
  try {
    return await runBirthdayEmails(request);
  } catch (error) {
    console.error('Birthday Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
