import { QuestionnaireFlow } from "@/components/questionnaire/QuestionnaireFlow";
import Navigation from "@/components/landing/Navigation";

export default function QuestionnairePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Navigation />
            <main className="pt-24 pb-12">
                <QuestionnaireFlow />
            </main>
        </div>
    );
}
