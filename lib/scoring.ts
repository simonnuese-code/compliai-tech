import { QuestionnaireAnswers, CheckResult, Recommendation } from '@/types/questionnaire'
import { questionnaireData } from '@/lib/questionnaire-data'

export function calculateOverallScore(answers: QuestionnaireAnswers): {
  overallScore: number
  documentationScore: number
  technicalScore: number
  governanceScore: number
} {
  let totalWeight = 0
  let earnedWeight = 0
  
  // Category scores
  let docWeight = 0, docEarned = 0
  let techWeight = 0, techEarned = 0
  let govWeight = 0, govEarned = 0

  // Iterate through all questions to calculate score
  questionnaireData.forEach(step => {
    step.questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && q.riskWeight !== undefined) {
        // Simple scoring logic: 
        // If riskWeight is positive, you get points for "good" answers
        // If riskWeight is negative, you lose points for "bad" answers (risk indicators)
        
        // This is a simplified model. In a real app, we'd map specific answers to scores.
        // Here we assume:
        // - Yes/No: Yes = full weight (if positive) or full penalty (if negative)
        // - Scale: 1-5 maps to 20-100% of weight
        // - Select: We'd need specific mapping, but for MVP we'll use a heuristic
        
        const weight = Math.abs(q.riskWeight)
        let score = 0

        if (q.type === 'yes_no') {
          if (q.riskWeight > 0) {
             score = answer === 'yes' ? weight : 0
          } else {
             score = answer === 'yes' ? -weight : 0 // Penalty
          }
        } else if (q.type === 'scale') {
          const val = typeof answer === 'number' ? answer : 3
          score = (val / 5) * weight
        } else {
          // Default for select/text: assume neutral/positive if answered
          score = weight 
          // Specific overrides for high risk answers
          if (q.id === 'high_risk_area' && answer !== 'none') {
            score = -50 // Heavy penalty
          }
          if (q.id === 'personal_data' && answer === 'yes_sensitive') {
            score = -20
          }
        }

        // Add to totals (normalizing to 0-100 scale later)
        // We treat "max possible score" as the sum of all positive weights
        if (q.riskWeight > 0) {
            totalWeight += weight
            earnedWeight += score
            
            if (step.id === 'documentation') { docWeight += weight; docEarned += score }
            if (step.id === 'technical') { techWeight += weight; techEarned += score }
            if (step.id === 'transparency' || step.id === 'purpose') { govWeight += weight; govEarned += score }
        } else {
            // Negative weights reduce the earned total directly
            earnedWeight += score
        }
      }
    })
  })

  // Normalize to 0-100
  const normalize = (earned: number, total: number) => {
    if (total === 0) return 100
    const pct = (earned / total) * 100
    return Math.max(0, Math.min(100, Math.round(pct)))
  }

  return {
    overallScore: normalize(earnedWeight, totalWeight),
    documentationScore: normalize(docEarned, docWeight),
    technicalScore: normalize(techEarned, techWeight),
    governanceScore: normalize(govEarned, govWeight)
  }
}

export function calculateRiskLevel(score: number, answers: QuestionnaireAnswers): 'MINIMAL' | 'LIMITED' | 'HIGH' | 'UNACCEPTABLE' {
  // 1. Check for Unacceptable Risk indicators (e.g. Social Scoring - not in MVP but good to have logic)
  
  // 2. Check for High Risk indicators
  const isHighRiskArea = answers['high_risk_area'] && answers['high_risk_area'] !== 'none'
  const isSensitiveData = answers['personal_data'] === 'yes_sensitive'
  
  if (isHighRiskArea || isSensitiveData) {
    if (score < 40) return 'UNACCEPTABLE' // High risk + bad compliance
    return 'HIGH'
  }

  // 3. Score based classification
  if (score >= 80) return 'MINIMAL'
  if (score >= 60) return 'LIMITED'
  return 'HIGH'
}

export function generateRecommendations(answers: QuestionnaireAnswers, riskLevel: string): Recommendation[] {
  const recs: Recommendation[] = []

  if (riskLevel === 'HIGH' || riskLevel === 'UNACCEPTABLE') {
    recs.push({
      id: 'high_risk_audit',
      title: 'Konformitätsbewertung erforderlich',
      description: 'Ihr System fällt wahrscheinlich in den Hochrisiko-Bereich. Eine externe Konformitätsbewertung ist zwingend erforderlich.',
      priority: 'HIGH',
      category: 'Governance'
    })
  }

  if (answers['tech_docs'] !== 'complete') {
    recs.push({
      id: 'docs_missing',
      title: 'Technische Dokumentation vervollständigen',
      description: 'Erstellen Sie eine vollständige technische Dokumentation gemäß Anhang IV des AI Act.',
      priority: 'HIGH',
      category: 'Documentation'
    })
  }

  if (answers['human_oversight'] === 'no') {
    recs.push({
      id: 'human_oversight',
      title: 'Menschliche Aufsicht implementieren',
      description: 'Richten Sie Prozesse ein, die eine effektive menschliche Überwachung des Systems ermöglichen.',
      priority: 'MEDIUM',
      category: 'Governance'
    })
  }

  if (answers['cybersecurity'] && answers['cybersecurity'] < 3) {
    recs.push({
      id: 'cybersec_improve',
      title: 'Cybersicherheit stärken',
      description: 'Verbessern Sie die Robustheit gegen Angriffe (Data Poisoning, Adversarial Attacks).',
      priority: 'MEDIUM',
      category: 'Technical'
    })
  }

  return recs
}
