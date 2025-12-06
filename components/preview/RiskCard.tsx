import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreResult } from "@/lib/types";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface RiskCardProps {
    result: ScoreResult;
}

export function RiskCard({ result }: RiskCardProps) {
    const getRiskDetails = (level: string) => {
        switch (level) {
            case "Dringend":
                return {
                    icon: XCircle,
                    color: "text-red-500",
                    bg: "bg-red-50",
                    description: "Es besteht dringender Handlungsbedarf. Ihr Unternehmen ist wahrscheinlich nicht konform mit dem EU AI Act.",
                };
            case "Handlungsbedarf":
                return {
                    icon: AlertTriangle,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    description: "Es gibt einige Lücken in Ihrer Compliance-Strategie. Wir empfehlen eine Überprüfung.",
                };
            case "Gut vorbereitet":
                return {
                    icon: CheckCircle,
                    color: "text-green-500",
                    bg: "bg-green-50",
                    description: "Ihr Unternehmen ist gut aufgestellt. Es sind nur minimale Anpassungen nötig.",
                };
            default:
                return {
                    icon: AlertTriangle,
                    color: "text-gray-500",
                    bg: "bg-gray-50",
                    description: "Unbekannter Status.",
                };
        }
    };

    const details = getRiskDetails(result.riskLevel);
    const Icon = details.icon;

    return (
        <Card className="bg-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-muted-foreground">Risiko-Level</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
                <div className={`p-4 rounded-full ${details.bg} mb-4`}>
                    <Icon className={`w-12 h-12 ${details.color}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${details.color}`}>{result.riskLevel}</h3>
                <p className="text-center text-muted-foreground px-4">
                    {details.description}
                </p>
            </CardContent>
        </Card>
    );
}
