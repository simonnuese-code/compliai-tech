import { PreviewDashboard } from "@/components/preview/PreviewDashboard";
import Navigation from "@/components/landing/Navigation";

export default function PreviewPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Navigation />
            <main className="pt-24 pb-12">
                <PreviewDashboard />
            </main>
        </div>
    );
}
