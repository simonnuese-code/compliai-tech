import { redirect } from 'next/navigation'

// Redirect to central register - one account for all services
export default function FlugTrackerRegisterRedirect() {
    redirect('/register')
}
