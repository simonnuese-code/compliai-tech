import { QuestionnaireAnswers, ScoreResult, RiskLevel } from './types';

export function calculateScore(answers: QuestionnaireAnswers): ScoreResult {
  let score = 50;

  // Rule 1: ai_in_use
  if (answers.ai_in_use === 'ja') {
    score -= 10;
  } else if (answers.ai_in_use === 'nein') {
    score += 50;
  }

  // Rule 2: automated_decisions
  if (answers.automated_decisions === 'ja') {
    score -= 20;
  } else if (answers.automated_decisions === 'unsicher') {
    score -= 10;
  }

  // Rule 3: HR use case (High Risk)
  if (answers.use_cases.includes('HR')) {
    score -= 15;
  }

  // Rule 4: Documentation
  if (answers.documentation === 'ja') {
    score += 30;
  }

  // Clamping 0-100
  score = Math.max(0, Math.min(100, score));

  // Risk Level Determination
  let riskLevel: RiskLevel;
  if (score < 50) {
    riskLevel = 'Dringend';
  } else if (score < 80) {
    riskLevel = 'Handlungsbedarf';
  } else {
    riskLevel = 'Gut vorbereitet';
  }

  return {
    score,
    riskLevel,
  };
}
