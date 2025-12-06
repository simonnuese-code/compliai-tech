"use client";

import { useEffect, useState } from "react";
import { calculateScore } from "@/lib/scoring"; // Wait, calculateScore is in scoring.ts but loadAnswers is in storage.ts
import { loadAnswers } from "@/lib/storage";
import { ScoreResult, QuestionnaireAnswers } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { RiskCard } from "./RiskCard";
import { BlurredDetails } from "./BlurredDetails";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PreviewDashboard() {
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const answers = loadAnswers();
        const scoreResult = calculateScore(answers);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResult(scoreResult);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
    }

    if (!result) {
        return <div>Keine Daten gefunden.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-navy-900">Ihre Ersteinschätzung</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Basierend auf Ihren Angaben haben wir eine erste Risiko-Analyse erstellt.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ScoreCard result={result} />
                <RiskCard result={result} />
            </div>

            <BlurredDetails />
        </div>
    );
}
