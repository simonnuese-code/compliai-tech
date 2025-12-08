import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to Gmail if not set
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sender = process.env.SMTP_FROM || '"CompliAI" <noreply@compliai.tech>';

export async function sendVerificationEmail(email: string, code: string, name: string) {
  try {
    console.log(`📧 Attempting to send verification email to ${email} via SMTP...`);
    
    await transporter.sendMail({
      from: sender,
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
    console.log(`✅ Email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string, name: string, baseUrl: string) {
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  try {
    console.log(`📧 Attempting to send password reset email to ${email} via SMTP...`);

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Passwort zurücksetzen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hallo ${name},</h2>
          <p>Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
          <p>Klicke auf den folgenden Button, um ein neues Passwort zu erstellen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Passwort zurücksetzen</a>
          </div>
          <p>Oder kopiere diesen Link in deinen Browser:</p>
          <p style="font-size: 12px; color: #666;">${resetLink}</p>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls du diese Anfrage nicht gestellt hast, kannst du diese Email ignorieren.</p>
        </div>
      `,
    });
    console.log(`✅ Password reset email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error };
  }
}
