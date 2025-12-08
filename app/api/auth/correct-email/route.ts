import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateEmailSchema = z.object({
  currentEmail: z.string().email(),
  newEmail: z.string().email(),
});

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    const { currentEmail, newEmail } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: currentEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Konto ist bereits verifiziert. Bitte Login nutzen." },
        { status: 400 }
      );
    }

    // Check if new email is taken
    const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
    });

    if (existingUser) {
        return NextResponse.json(
            { error: "Diese E-Mail-Adresse wird bereits verwendet." },
            { status: 400 }
        );
    }

    const verificationCode = generateVerificationCode();
    const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 Min

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        verificationToken: verificationCode,
        verificationTokenExpiry,
      },
    });

    const emailResult = await sendVerificationEmail(newEmail, verificationCode, user.name || "");

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "E-Mail konnte nicht gesendet werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "E-Mail aktualisiert und Code gesendet." });
  } catch (error) {
    console.error("Update email error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
