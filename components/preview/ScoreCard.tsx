import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
    result: ScoreResult;
}

export function ScoreCard({ result }: ScoreCardProps) {
    const getColor = (score: number) => {
        if (score < 50) return "text-red-500";
        if (score < 80) return "text-orange-500";
        return "text-green-500";
    };

    return (
        <Card className="bg-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-muted-foreground">Ihr Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
                <div className={cn("text-6xl font-bold mb-2", getColor(result.score))}>
                    {result.score}/100
                </div>
                <p className="text-center text-muted-foreground">
                    Basierend auf Ihren Antworten
                </p>
            </CardContent>
        </Card>
    );
}
