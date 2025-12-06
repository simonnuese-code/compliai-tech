export type QuestionnaireAnswers = {
  industry: string | null;
  employees: '<10' | '10-50' | '50-250' | '250+' | null;
  ai_in_use: 'ja' | 'nein' | null;
  ai_types: string[];
  automated_decisions: 'ja' | 'nein' | 'unsicher' | null;
  use_cases: string[];
  documentation: 'ja' | 'nein' | null;
};

export type RiskLevel = 'Dringend' | 'Handlungsbedarf' | 'Gut vorbereitet';

export type ScoreResult = {
  score: number;
  riskLevel: RiskLevel;
};
