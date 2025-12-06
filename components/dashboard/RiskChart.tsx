"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreResult } from "@/lib/types";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface RiskChartProps {
    result: ScoreResult;
}

export function RiskChart({ result }: RiskChartProps) {
    const data = [
        {
            name: "Ihr Score",
            score: result.score,
        },
        {
            name: "Maximal",
            score: 100,
        },
    ];

    const getColor = (score: number) => {
        if (score < 50) return "#ef4444"; // red-500
        if (score < 80) return "#f97316"; // orange-500
        return "#22c55e"; // green-500
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Risikoprofil</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? getColor(entry.score) : "#e5e7eb"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
