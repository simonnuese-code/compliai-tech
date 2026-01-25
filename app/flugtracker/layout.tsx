import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FlugTracker - Flugpreise überwachen & sparen',
    description:
        'Überwachen Sie Flugpreise für Ihre geplanten Reisen. Erhalten Sie E-Mail-Benachrichtigungen bei Preisänderungen und finden Sie den besten Zeitpunkt zum Buchen.',
    keywords: [
        'Flugtracker',
        'Flugpreise',
        'Flug Preisalarm',
        'Günstige Flüge',
        'Flugpreise vergleichen',
        'Flug Benachrichtigung',
    ],
    openGraph: {
        title: 'FlugTracker - Flugpreise überwachen & sparen',
        description:
            'Überwachen Sie Flugpreise für Ihre geplanten Reisen. Erhalten Sie E-Mail-Benachrichtigungen bei Preisänderungen.',
        url: 'https://www.compliai.tech/flugtracker',
        siteName: 'CompliAI FlugTracker',
        locale: 'de_DE',
        type: 'website',
    },
};

export default function FlugTrackerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
