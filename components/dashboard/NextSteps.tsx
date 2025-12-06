import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionnaireAnswers, ScoreResult } from "@/lib/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface NextStepsProps {
    answers: QuestionnaireAnswers;
    result: ScoreResult;
}

export function NextSteps({ answers, result }: NextStepsProps) {
    const getSteps = () => {
        const steps = [];

        if (answers.documentation !== "ja") {
            steps.push({
                title: "Technische Dokumentation erstellen",
                description: "Erstellen Sie eine umfassende Dokumentation für Ihre KI-Systeme gemäß Art. 11 EU AI Act.",
                priority: "high",
            });
        }

        if (answers.use_cases.includes("HR") || answers.automated_decisions === "ja") {
            steps.push({
                title: "Risikomanagement-System einführen",
                description: "Für Hochrisiko-KI-Systeme ist ein kontinuierliches Risikomanagement-System verpflichtend.",
                priority: "high",
            });
        }

        if (result.score < 80) {
            steps.push({
                title: "Mitarbeiterschulung",
                description: "Schulen Sie Ihre Mitarbeiter im Umgang mit KI-Systemen und den rechtlichen Anforderungen.",
                priority: "medium",
            });
        }

        steps.push({
            title: "Regelmäßige Überprüfung",
            description: "Überprüfen Sie Ihre Compliance-Strategie mindestens einmal jährlich.",
            priority: "low",
        });

        return steps;
    };

    const steps = getSteps();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Empfohlene nächste Schritte</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                            {step.priority === "high" ? (
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5" />
                            )}
                            <div>
                                <h4 className="font-semibold text-navy-900">{step.title}</h4>
                                <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
