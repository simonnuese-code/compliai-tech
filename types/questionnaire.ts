export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'yes_no' | 'scale'

export interface QuestionOption {
  value: string
  label: string
  description?: string
  icon?: any // Lucide icon component
}

export interface Question {
  id: string
  question: string
  description?: string
  type: QuestionType
  required?: boolean
  options?: QuestionOption[]
  riskWeight?: number // Positive adds to score (good), negative subtracts (risk)
  condition?: {
    questionId: string
    value: any
  }
}

export interface QuestionnaireStep {
  id: string
  title: string
  description?: string
  icon?: any
  questions: Question[]
}

export interface QuestionnaireAnswers {
  [key: string]: any
}

export interface CheckResult {
  overallScore: number
  documentationScore: number
  technicalScore: number
  governanceScore: number
  riskLevel: 'MINIMAL' | 'LIMITED' | 'HIGH' | 'UNACCEPTABLE'
  recommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  resourceLink?: string
}
