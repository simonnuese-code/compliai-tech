import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string, name: string) {
  try {
    await resend.emails.send({
      from: 'CompliAI <onboarding@resend.dev>',
      to: email,
      subject: 'Bestätige deine Email-Adresse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Willkommen bei CompliAI, ${name}!</h2>
          <p>Vielen Dank für deine Registrierung. Bitte bestätige deine Email-Adresse mit folgendem Code:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>Dieser Code ist 15 Minuten gültig.</p>
          <p>Falls du dich nicht bei CompliAI registriert hast, ignoriere diese Email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
