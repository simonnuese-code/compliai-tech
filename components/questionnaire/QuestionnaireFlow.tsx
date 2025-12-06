"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepCard } from "./StepCard";
import { QuestionnaireAnswers } from "@/lib/types";
import { saveAnswers, loadAnswers } from "@/lib/storage";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence } from "motion/react";

const INDUSTRIES = [
    "Industrie/Produktion",
    "Dienstleistungen",
    "Finanzdienstleistungen",
    "Gesundheitswesen",
    "IT/Software",
    "Öffentlicher Sektor",
    "Sonstiges",
];

const EMPLOYEES = ["<10", "10-50", "50-250", "250+"];

const AI_TYPES = [
    "Chatbots",
    "Prädiktive Analytik",
    "Bilderkennung",
    "Textanalyse",
    "Sonstige",
];

const USE_CASES = [
    "HR",
    "Kundenservice",
    "Produktentwicklung",
    "Marketing/Vertrieb",
    "Finanzen",
    "Sonstige",
];

export function QuestionnaireFlow() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<QuestionnaireAnswers>({
        industry: null,
        employees: null,
        ai_in_use: null,
        ai_types: [],
        automated_decisions: null,
        use_cases: [],
        documentation: null,
    });

    useEffect(() => {
        const loaded = loadAnswers();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(loaded);
    }, []);

    const updateAnswer = (key: keyof QuestionnaireAnswers, value: any) => {
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);
        saveAnswers(newAnswers);
    };

    const handleNext = () => {
        if (step < 7) {
            setStep(step + 1);
        } else {
            router.push("/preview");
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-12">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <StepCard
                        key="step1"
                        title="In welcher Branche ist Ihr Unternehmen tätig?"
                        currentStep={1}
                        totalSteps={7}
                        onNext={handleNext}
                        isValid={!!answers.industry}
                    >
                        <div className="space-y-4">
                            <Label>Branche wählen</Label>
                            <Select
                                value={answers.industry || ""}
                                onValueChange={(val) => updateAnswer("industry", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Bitte wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map((ind) => (
                                        <SelectItem key={ind} value={ind}>
                                            {ind}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </StepCard>
                )}

                {step === 2 && (
                    <StepCard
                        key="step2"
                        title="Wie viele Mitarbeiter beschäftigt Ihr Unternehmen?"
                        currentStep={2}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isValid={!!answers.employees}
                    >
                        <RadioGroup
                            value={answers.employees || ""}
                            onValueChange={(val) => updateAnswer("employees", val)}
                            className="space-y-3"
                        >
                            {EMPLOYEES.map((emp) => (
                                <div key={emp} className="flex items-center space-x-2">
                                    <RadioGroupItem value={emp} id={emp} />
                                    <Label htmlFor={emp}>{emp} Mitarbeiter</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </StepCard>
                )}

                {step === 3 && (
                    <StepCard
                        key="step3"
                        title="Setzen Sie bereits KI-Systeme ein?"
                        currentStep={3}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isValid={!!answers.ai_in_use}
                    >
                        <RadioGroup
                            value={answers.ai_in_use || ""}
                            onValueChange={(val) => updateAnswer("ai_in_use", val)}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ja" id="ai_ja" />
                                <Label htmlFor="ai_ja">Ja, wir nutzen bereits KI</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nein" id="ai_nein" />
                                <Label htmlFor="ai_nein">Nein, bisher nicht</Label>
                            </div>
                        </RadioGroup>
                    </StepCard>
                )}

                {step === 4 && (
                    <StepCard
                        key="step4"
                        title="Welche Art von KI nutzen Sie?"
                        currentStep={4}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isValid={answers.ai_in_use === 'nein' || answers.ai_types.length > 0}
                    >
                        {answers.ai_in_use === 'nein' ? (
                            <p className="text-muted-foreground">
                                Da Sie keine KI nutzen, können Sie diesen Schritt überspringen.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {AI_TYPES.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type}
                                            checked={answers.ai_types.includes(type)}
                                            onCheckedChange={(checked) => {
                                                const current = answers.ai_types;
                                                if (checked) {
                                                    updateAnswer("ai_types", [...current, type]);
                                                } else {
                                                    updateAnswer(
                                                        "ai_types",
                                                        current.filter((t) => t !== type)
                                                    );
                                                }
                                            }}
                                        />
                                        <Label htmlFor={type}>{type}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </StepCard>
                )}

                {step === 5 && (
                    <StepCard
                        key="step5"
                        title="Treffen Ihre Systeme automatisierte Entscheidungen über Personen?"
                        currentStep={5}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isValid={!!answers.automated_decisions}
                    >
                        <RadioGroup
                            value={answers.automated_decisions || ""}
                            onValueChange={(val) => updateAnswer("automated_decisions", val)}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ja" id="auto_ja" />
                                <Label htmlFor="auto_ja">Ja</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nein" id="auto_nein" />
                                <Label htmlFor="auto_nein">Nein</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unsicher" id="auto_unsicher" />
                                <Label htmlFor="auto_unsicher">Unsicher</Label>
                            </div>
                        </RadioGroup>
                    </StepCard>
                )}

                {step === 6 && (
                    <StepCard
                        key="step6"
                        title="In welchen Bereichen wird die KI eingesetzt?"
                        currentStep={6}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isValid={answers.use_cases.length > 0}
                    >
                        <div className="space-y-3">
                            {USE_CASES.map((useCase) => (
                                <div key={useCase} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={useCase}
                                        checked={answers.use_cases.includes(useCase)}
                                        onCheckedChange={(checked) => {
                                            const current = answers.use_cases;
                                            if (checked) {
                                                updateAnswer("use_cases", [...current, useCase]);
                                            } else {
                                                updateAnswer(
                                                    "use_cases",
                                                    current.filter((c) => c !== useCase)
                                                );
                                            }
                                        }}
                                    />
                                    <Label htmlFor={useCase}>{useCase}</Label>
                                </div>
                            ))}
                        </div>
                    </StepCard>
                )}

                {step === 7 && (
                    <StepCard
                        key="step7"
                        title="Ist eine Dokumentation für die KI-Systeme vorhanden?"
                        currentStep={7}
                        totalSteps={7}
                        onNext={handleNext}
                        onBack={handleBack}
                        isLastStep={true}
                        isValid={!!answers.documentation}
                    >
                        <RadioGroup
                            value={answers.documentation || ""}
                            onValueChange={(val) => updateAnswer("documentation", val)}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ja" id="doc_ja" />
                                <Label htmlFor="doc_ja">Ja, vollständig vorhanden</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nein" id="doc_nein" />
                                <Label htmlFor="doc_nein">Nein / Unvollständig</Label>
                            </div>
                        </RadioGroup>
                    </StepCard>
                )}
            </AnimatePresence>
        </div>
    );
}
