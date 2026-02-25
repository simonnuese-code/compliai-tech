import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendVerificationEmail(email: string, code: string, name: string) {
  try {
    await resend.emails.send({
      from: 'CompliAI <noreply@compliai.tech>',
      to: email,
      subject: 'Bestätige deine Email-Adresse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Willkommen bei CompliAI, ${escapeHtml(name)}!</h2>
          <p>Vielen Dank für deine Registrierung. Bitte bestätige deine Email-Adresse mit folgendem Code:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${escapeHtml(code)}
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

export async function sendPasswordResetEmail(email: string, token: string, name: string, baseUrl: string) {
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  try {
    await resend.emails.send({
      from: 'CompliAI <noreply@compliai.tech>',
      to: email,
      subject: 'Passwort zurücksetzen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hallo ${escapeHtml(name)},</h2>
          <p>Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
          <p>Klicke auf den folgenden Button, um ein neues Passwort zu erstellen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${escapeHtml(resetLink)}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Passwort zurücksetzen</a>
          </div>
          <p>Oder kopiere diesen Link in deinen Browser:</p>
          <p style="font-size: 12px; color: #666;">${escapeHtml(resetLink)}</p>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls du diese Anfrage nicht gestellt hast, kannst du diese Email ignorieren.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendGenericEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await resend.emails.send({
      from: 'CompliAI <noreply@compliai.tech>',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendBirthdayEmail(email: string, name: string) {
  const safeName = escapeHtml(name);
  
  try {
    await resend.emails.send({
      from: 'CompliAI <noreply@compliai.tech>',
      to: email,
      subject: `🎂 Alles Gute zum Geburtstag, ${safeName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); border-radius: 16px 16px 0 0; padding: 50px 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">🎂🎉🥳</div>
                      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                        Alles Gute zum Geburtstag!
                      </h1>
                      <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin: 0;">
                        Dein besonderer Tag ist heute 🎈
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="background-color: #1e293b; padding: 40px; border-left: 1px solid #334155; border-right: 1px solid #334155;">
                      <p style="color: #e2e8f0; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                        Liebe/r <strong style="color: #a78bfa;">${safeName}</strong>,
                      </p>
                      <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                        das gesamte Team von <strong style="color: #06b6d4;">CompliAI</strong> wünscht dir einen wundervollen Geburtstag! 🎊
                      </p>
                      <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
                        Wir hoffen, du hast einen fantastischen Tag voller Freude, Lachen und natürlich einer Menge Kuchen! 🍰
                      </p>
                      
                      <!-- Decorative divider -->
                      <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background: linear-gradient(90deg, #6366f1, #d946ef, #06b6d4); height: 3px; width: 120px; border-radius: 2px;"></div>
                      </div>
                      
                      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                        „Ein weiteres Jahr voller Möglichkeiten liegt vor dir – mach das Beste daraus!" ✨
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f172a; border: 1px solid #334155; border-top: none; border-radius: 0 0 16px 16px; padding: 24px 40px; text-align: center;">
                      <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                        Mit den besten Wünschen,
                      </p>
                      <p style="color: #94a3b8; font-size: 15px; font-weight: 600; margin: 0;">
                        Dein CompliAI Team 💜
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Birthday email send error:', error);
    return { success: false, error };
  }
}
