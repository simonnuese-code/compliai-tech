import { Resend } from 'resend';
import { FlightResult, FlightTracker } from '@prisma/client';
import { formatPrice, formatDuration } from './geo-utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReportData {
  tracker: FlightTracker;
  topFlights: FlightResult[];
  previousBestPrice?: number;
}

export class EmailService {
  async sendFlightReport(to: string, data: ReportData) {
    if (!data.topFlights.length) return;

    const bestFlight = data.topFlights[0];
    const priceChange = data.previousBestPrice 
      ? bestFlight.priceEuro.toNumber() - data.previousBestPrice 
      : 0;
    
    const priceChangePercent = data.previousBestPrice 
      ? (priceChange / data.previousBestPrice) * 100 
      : 0;

    const subject = `[${data.tracker.name}] - Flug-Report KW ${format(new Date(), 'w')}`;
    const html = this.generateEmailHtml(data, bestFlight, priceChange, priceChangePercent);

    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
      console.log('📧 [MOCK EMAIL] would send to:', to);
      console.log('Subject:', subject);
      // console.log('HTML:', html);
      return;
    }

    try {
      await resend.emails.send({
        from: 'FlugTracker <noreply@compliai.tech>',
        to: to,
        subject: subject,
        html: html,
      });
      console.log(`📧 Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  private generateEmailHtml(
    data: ReportData, 
    best: FlightResult, 
    change: number, 
    changePercent: number
  ): string {
    const isCheaper = change < 0;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px; }
    .highlight-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
    .price-tag { font-size: 24px; font-weight: bold; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .flight-list-item { padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .btn { display: inline-block; background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">${data.tracker.name}</h1>
      <p style="margin:5px 0 0 0; opacity: 0.9;">Wöchentlicher Flug-Report</p>
    </div>
    
    <div class="content">
      <div class="section">
        <p>Hallo,</p>
        <p>hier ist dein aktueller Statusbericht für deine geplante Reise.</p>
        <ul style="list-style: none; padding: 0; color: #475569;">
          <li>📍 <strong>Route:</strong> ${data.tracker.departureAirports.join('/')} → ${data.tracker.destinationAirports.join('/')}</li>
          <li>📅 <strong>Zeitraum:</strong> ${format(new Date(data.tracker.dateRangeStart), 'dd.MM.yyyy')} - ${format(new Date(data.tracker.dateRangeEnd), 'dd.MM.yyyy')}</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title">🏆 Empfehlung</div>
        <div class="highlight-card">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <div class="price-tag">${formatPrice(best.priceEuro.toNumber())}</div>
              <div style="color: #64748b; font-size: 14px;">${best.airline}</div>
            </div>
            ${change !== 0 ? `
              <div class="badge ${isCheaper ? 'badge-green' : 'badge-red'}">
                ${isCheaper ? '▼' : '▲'} ${Math.abs(change).toFixed(0)}€ (${Math.abs(changePercent).toFixed(1)}%)
              </div>
            ` : ''}
          </div>
          
          <div style="margin-top: 15px; font-size: 14px;">
            <div>✈️ ${best.departureAirport} → ${best.destinationAirport}</div>
            <div>📅 ${format(new Date(best.outboundDate), 'dd.MM.')} - ${format(new Date(best.returnDate), 'dd.MM.yyyy')}</div>
            <div>⏱️ ${formatDuration(best.totalDurationMinutes)}, ${best.stops === 0 ? 'Direkt' : best.stops + ' Stopps'}</div>
          </div>
          
          <div style="margin-top: 15px;">
            ${best.bookingLink ? `<a href="${best.bookingLink}" class="btn">Zum Angebot</a>` : ''}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Top Optionen</div>
        ${data.topFlights.slice(0, 5).map(flight => `
          <div class="flight-list-item">
            <div>
              <div style="font-weight: bold;">${formatPrice(flight.priceEuro.toNumber())}</div>
              <div style="font-size: 12px; color: #64748b;">${flight.airline} • ${format(new Date(flight.outboundDate), 'dd.MM.')}</div>
            </div>
            <div>
               ${flight.bookingLink ? `<a href="${flight.bookingLink}" style="color: #0ea5e9; text-decoration: none; font-size: 14px;">Ansehen →</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section">
         <div class="section-title">💡 Einschätzung</div>
         <p style="font-size: 14px; color: #475569;">
           ${isCheaper 
             ? `Die Preise sind im Vergleich zum letzten Check um ${Math.abs(Math.round(change))}€ gefallen. Ein guter Zeitpunkt zum Buchen!` 
             : `Die Preise sind momentan stabil oder leicht gestiegen. Wir behalten sie weiter im Auge.`}
         </p>
      </div>
    
      <div class="footer">
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/flugtracker/dashboard">Dashboard öffnen</a> • 
          <a href="#">Einstellungen</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
