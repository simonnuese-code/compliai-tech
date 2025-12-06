import { QuestionnaireAnswers } from './types';

const STORAGE_KEY = 'compliai_questionnaire_v1';

export const defaultAnswers: QuestionnaireAnswers = {
  industry: null,
  employees: null,
  ai_in_use: null,
  ai_types: [],
  automated_decisions: null,
  use_cases: [],
  documentation: null,
};

export function saveAnswers(answers: QuestionnaireAnswers) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }
}

export function loadAnswers(): QuestionnaireAnswers {
  if (typeof window === 'undefined') {
    return defaultAnswers;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultAnswers;
  }

  try {
    return JSON.parse(stored) as QuestionnaireAnswers;
  } catch (error) {
    console.error('Failed to parse stored answers:', error);
    return defaultAnswers;
  }
}

export function clearAnswers() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
