import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

interface StepCardProps {
    title: string;
    children: React.ReactNode;
    onNext: () => void;
    onBack?: () => void;
    isLastStep?: boolean;
    isValid?: boolean;
    currentStep: number;
    totalSteps: number;
}

export function StepCard({
    title,
    children,
    onNext,
    onBack,
    isLastStep = false,
    isValid = true,
    currentStep,
    totalSteps,
}: StepCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl mx-auto"
        >
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-lg">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Frage {currentStep} von {totalSteps}
                        </span>
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-navy-900">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {children}
                </CardContent>
                <CardFooter className="flex justify-between pt-6">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        disabled={!onBack}
                        className={!onBack ? "invisible" : ""}
                    >
                        Zurück
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!isValid}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                        {isLastStep ? "Analyse anzeigen" : "Weiter"}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
