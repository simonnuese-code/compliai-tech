"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { calculateScore } from "@/lib/scoring";
import { loadAnswers as loadAnswersFromStorage } from "@/lib/storage";
import { calculateScore as calcScore } from "@/lib/scoring";
import { QuestionnaireAnswers, ScoreResult } from "@/lib/types";
import { ResultsTable } from "./ResultsTable";
import { RiskChart } from "./RiskChart";
import { NextSteps } from "./NextSteps";
import { Button } from "@/components/ui/button";
import { ScoreCard } from "../preview/ScoreCard";
import { RiskCard } from "../preview/RiskCard";
import Link from "next/link";

export function DashboardView() {
    const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // In a real app, we would fetch from Supabase DB here.
            // For MVP, we'll use localStorage if available, or mock/empty.
            // We should ideally sync localStorage to Supabase on first login.
            const localAnswers = loadAnswersFromStorage();
            setAnswers(localAnswers);
            setResult(calcScore(localAnswers));
            setLoading(false);
        };

        checkUser();
    }, [router, supabase.auth]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
    }

    if (!answers || !result) {
        return <div>Keine Daten verfügbar.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900">Compliance Dashboard</h1>
                    <p className="text-muted-foreground">
                        Status vom {new Date().toLocaleDateString("de-DE")}
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/questionnaire">Neue Analyse starten</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScoreCard result={result} />
                <RiskCard result={result} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ResultsTable answers={answers} />
                    <NextSteps answers={answers} result={result} />
                </div>
                <div>
                    <RiskChart result={result} />
                </div>
            </div>
        </div>
    );
}
