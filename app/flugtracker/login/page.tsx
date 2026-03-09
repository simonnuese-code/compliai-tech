import { redirect } from 'next/navigation'

// Redirect to central login - one account for all services
export default function FlugTrackerLoginRedirect() {
    redirect('/login')
}
