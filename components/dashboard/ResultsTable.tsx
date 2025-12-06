import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionnaireAnswers } from "@/lib/types";

interface ResultsTableProps {
    answers: QuestionnaireAnswers;
}

export function ResultsTable({ answers }: ResultsTableProps) {
    const rows = [
        { label: "Branche", value: answers.industry },
        { label: "Mitarbeiter", value: answers.employees },
        { label: "KI-Einsatz", value: answers.ai_in_use === "ja" ? "Ja" : "Nein" },
        { label: "KI-Typen", value: answers.ai_types.join(", ") || "-" },
        { label: "Automatisierte Entscheidungen", value: answers.automated_decisions },
        { label: "Einsatzbereiche", value: answers.use_cases.join(", ") || "-" },
        { label: "Dokumentation", value: answers.documentation === "ja" ? "Vorhanden" : "Fehlt/Unvollständig" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ihre Antworten im Überblick</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Frage</TableHead>
                            <TableHead>Ihre Antwort</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.label}>
                                <TableCell className="font-medium">{row.label}</TableCell>
                                <TableCell>{row.value || "Keine Angabe"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
