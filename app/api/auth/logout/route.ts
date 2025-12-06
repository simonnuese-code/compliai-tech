import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Fehler beim Abmelden" },
      { status: 500 }
    );
  }
}
