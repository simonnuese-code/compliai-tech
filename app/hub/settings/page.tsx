import { redirect } from 'next/navigation'

// Settings will use the existing dashboard settings
// Redirect to the existing settings page for now
export default function HubSettingsPage() {
    redirect('/dashboard/einstellungen')
}
