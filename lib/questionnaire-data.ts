import { QuestionnaireStep } from '@/types/questionnaire'
import { 
  Shield, 
  Database, 
  FileText, 
  Scale, 
  Eye, 
  Server 
} from 'lucide-react'

export const questionnaireData: QuestionnaireStep[] = [
  {
    id: 'general',
    title: 'Allgemeine Informationen',
    description: 'Grundlegende Details zu Ihrem KI-System',
    icon: Shield,
    questions: [
      {
        id: 'system_name',
        question: 'Wie heißt Ihr KI-System?',
        type: 'text',
        required: true,
        riskWeight: 0
      },
      {
        id: 'deployment_status',
        question: 'In welchem Stadium befindet sich das System?',
        type: 'select',
        required: true,
        options: [
          { value: 'concept', label: 'Konzeptphase' },
          { value: 'development', label: 'In Entwicklung' },
          { value: 'testing', label: 'Testphase / Pilot' },
          { value: 'production', label: 'Live / In Produktion' }
        ],
        riskWeight: 0
      }
    ]
  },
  {
    id: 'purpose',
    title: 'Zweck & Risiko',
    description: 'Einstufung des Risikopotenzials',
    icon: Scale,
    questions: [
      {
        id: 'intended_purpose',
        question: 'Was ist der Hauptzweck des Systems?',
        type: 'textarea',
        required: true,
        riskWeight: 0
      },
      {
        id: 'high_risk_area',
        question: 'Fällt das System in einen dieser kritischen Bereiche?',
        description: 'Gemäß Anhang III des EU AI Act',
        type: 'select',
        required: true,
        riskWeight: -50, // High risk indicator
        options: [
          { value: 'none', label: 'Keiner dieser Bereiche' },
          { value: 'biometrics', label: 'Biometrische Identifizierung' },
          { value: 'critical_infra', label: 'Kritische Infrastruktur (Wasser, Energie, etc.)' },
          { value: 'education', label: 'Bildung & Berufsbildung' },
          { value: 'employment', label: 'Beschäftigung & Personalmanagement' },
          { value: 'public_services', label: 'Zugang zu wesentlichen Dienstleistungen' },
          { value: 'law_enforcement', label: 'Strafverfolgung' },
          { value: 'migration', label: 'Migration & Grenzkontrolle' },
          { value: 'justice', label: 'Rechtspflege & Demokratische Prozesse' }
        ]
      },
      {
        id: 'human_oversight',
        question: 'Gibt es eine menschliche Aufsicht (Human-in-the-loop)?',
        type: 'yes_no',
        required: true,
        riskWeight: 20
      }
    ]
  },
  {
    id: 'data',
    title: 'Daten & Training',
    description: 'Herkunft und Qualität der Daten',
    icon: Database,
    questions: [
      {
        id: 'personal_data',
        question: 'Verarbeitet das System personenbezogene Daten?',
        type: 'select',
        required: true,
        riskWeight: -10,
        options: [
          { value: 'no', label: 'Nein, keine personenbezogenen Daten' },
          { value: 'yes_anonymized', label: 'Ja, aber anonymisiert/pseudonymisiert' },
          { value: 'yes_personal', label: 'Ja, personenbezogene Daten' },
          { value: 'yes_sensitive', label: 'Ja, besondere Kategorien (Gesundheit, etc.)' }
        ]
      },
      {
        id: 'data_governance',
        question: 'Haben Sie Maßnahmen zur Daten-Governance implementiert?',
        description: 'z.B. Bias-Prüfung, Qualitätskontrolle',
        type: 'scale', // 1-5
        required: true,
        riskWeight: 15
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technische Robustheit',
    description: 'Sicherheit und Zuverlässigkeit',
    icon: Server,
    questions: [
      {
        id: 'cybersecurity',
        question: 'Wie bewerten Sie die Cybersicherheit des Systems?',
        type: 'scale',
        required: true,
        riskWeight: 15
      },
      {
        id: 'logging',
        question: 'Werden Systemaktivitäten automatisch protokolliert (Logging)?',
        type: 'yes_no',
        required: true,
        riskWeight: 10
      }
    ]
  },
  {
    id: 'transparency',
    title: 'Transparenz',
    description: 'Erklärbarkeit und Information',
    icon: Eye,
    questions: [
      {
        id: 'user_info',
        question: 'Werden Nutzer darüber informiert, dass sie mit einer KI interagieren?',
        type: 'yes_no',
        required: true,
        riskWeight: 10
      },
      {
        id: 'explainability',
        question: 'Sind die Entscheidungen des Systems erklärbar/nachvollziehbar?',
        type: 'scale',
        required: true,
        riskWeight: 15
      }
    ]
  },
  {
    id: 'documentation',
    title: 'Dokumentation',
    description: 'Technische Dokumentation und Aufzeichnungen',
    icon: FileText,
    questions: [
      {
        id: 'tech_docs',
        question: 'Existiert eine technische Dokumentation gemäß Anhang IV?',
        type: 'select',
        required: true,
        riskWeight: 20,
        options: [
          { value: 'none', label: 'Nein, noch nicht vorhanden' },
          { value: 'partial', label: 'Teilweise vorhanden' },
          { value: 'complete', label: 'Vollständig vorhanden' }
        ]
      },
      {
        id: 'risk_management',
        question: 'Gibt es ein Risikomanagement-System?',
        type: 'yes_no',
        required: true,
        riskWeight: 20
      }
    ]
  }
]
