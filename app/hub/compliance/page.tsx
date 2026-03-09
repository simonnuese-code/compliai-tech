import { redirect } from 'next/navigation'

// Redirect /hub/compliance to the compliance dashboard main page
// This re-exports the existing dashboard page content
export { default } from '@/app/dashboard/page'
