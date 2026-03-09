import { redirect } from 'next/navigation'

// Redirect /hub/flugtracker to the existing flugtracker dashboard
export default function HubFlugtrackerPage() {
    redirect('/flugtracker/dashboard')
}
