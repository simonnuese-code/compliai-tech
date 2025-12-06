# CompliAI – CLAUDE Project Spec

Hinweis: Die bestehenden Sektionen "Development Commands" und "Architecture" am Ende dieses Dokuments bleiben unverändert. Die folgenden Sektionen definieren das Produkt- und UX-Verhalten sowie technische Details für das CompliAI-MVP.

---

## 1. Product Overview & Business Context

CompliAI ist eine B2B SaaS-Plattform für EU AI Act Compliance für kleine und mittlere Unternehmen (KMU) in der EU.

Kernproblem:
- Der EU AI Act bringt extrem hohe Bußgelder (bis zu 35 Mio. EUR oder 7% Umsatz)
- Viele KMU setzen bereits KI ein, haben aber keine Zeit, kein Know-how und kein Budget für klassische Kanzleiberatung

Kernlösung (MVP-Fokus):
- Ein kostenloser, in <5 Minuten ausfüllbarer First Check (Fragebogen)
- Ein Compliance Score + Risiko-Level, visualisiert in einem Dashboard
- Ohne Login: Nutzer bekommt eine erste Einschätzung (Score, grobes Risiko)
- Mit Login: Vollständiges Dashboard mit detaillierten Ergebnissen und Visualisierungen

Langfristig (nicht Teil des MVP):
- SaaS-Abos mit Dokumenten-Center, automatisierten Updates, Marktplatz für spezialisierte Kanzleien

---

## 2. MVP Scope

### In Scope (muss implementiert werden)

Routes:
- `/` – Landing Page
- `/questionnaire` – Öffentlicher 7-Fragen-First-Check
- `/preview` – Preview-Dashboard mit Score + Risiko-Level (Details geblurred)
- `/signup` – Registrierung (Supabase Auth)
- `/login` – Login (Supabase Auth)
- `/dashboard` – Vollständiges Dashboard (nur für eingeloggte User)

Funktionale Anforderungen:
- Fragebogen-Daten werden vor Login in localStorage gespeichert
- Nach Login werden diese Daten in Supabase gespeichert/verknüpft
- Score-Berechnung nach definierter Logik (siehe Abschnitt 7)
- Preview zeigt: Score (0-100), Risiko-Level, geblurrte Detail-Cards
- Vollständiges Dashboard zeigt: Ungeblurrte Details, Recharts-Visualisierungen, Next Steps

### Out of Scope (nicht implementieren)

- Dokumenten-Center mit Upload/Versionierung
- Automatisierte Legal-Updates
- Marktplatz für Anwaltsvermittlung
- Pricing/Billing-Logik
- Multi-Tenant mit Rollenverwaltung
- Mehrsprachigkeit (MVP ist Deutsch)

---

## 3. Target Users

Primäre Zielgruppe:
- Geschäftsführer/CEOs von KMU (10-249 Mitarbeitende)
- Datenschutzbeauftragte / IT-Leitung in KMU

Typische Situation:
- KI wird bereits in HR, Kundenservice oder Produktentwicklung genutzt
- EU AI Act ist bekannt, aber unklar wie stark betroffen
- Zeit für tiefes Einlesen fehlt, aber Bußgeld-Risiko ist präsent

---

## 4. Core User Flows

### Flow: Gast → Preview → Sign-up → Dashboard

1. User landet auf `/` (Landing Page)
2. Klick "Kostenlose Analyse starten" → `/questionnaire`
3. User beantwortet 7 Fragen (Daten in localStorage)
4. Klick "Analyse anzeigen" → `/preview`
5. Preview zeigt Score + Risiko-Level, aber Details geblurred
6. CTA: "Kostenlose Registrierung für vollständiges Dashboard"
7. Klick CTA → `/signup`
8. Registrierung via Supabase (E-Mail + Passwort)
9. Nach Sign-up: localStorage-Daten → Supabase, dann Redirect `/dashboard`
10. Dashboard zeigt vollständige Analyse mit Details und Visualisierungen

### Flow: Bestehender User (Login)

1. User geht auf `/login`
2. Login via Supabase
3. Redirect zu `/dashboard`
4. Optional: Button "Neue Analyse starten" → `/questionnaire`

---

## 5. Pages & Routes Specification

### `/` – Landing Page

Ziel: Vertrauen aufbauen, Problem darstellen, First Check positionieren

Inhalt:
- Hero Section:
  - Logo (compliai-logo-full.png) in Navigation
  - Headline: "In 5 Minuten wissen, wie EU-AI-Act-fit Ihr Unternehmen ist"
  - Subheadline: Kurzbeschreibung First Check (kostenlos, ohne Login)
  - Primärer Button: "Kostenlose Analyse starten" → `/questionnaire`
- Trust-Elemente:
  - "Fokus auf KMU", "Kein Verkauf von Daten", "EU-zentrierte Lösung"
- 3-Steps-Erklärung (Glassmorphism Cards):
  - Step 1: 7 Fragen beantworten
  - Step 2: Score und Risiko-Level sehen
  - Step 3: Bei Bedarf registrieren und Details freischalten
- Footer (Impressum/Datenschutz als Stubs)

Design: Apple-ähnlich, Glassmorphism, Framer Motion Scroll-Animationen

### `/questionnaire` – Fragebogen

Ziel: Unter 5 Minuten ausfüllbar, keine Registrierung

Anforderungen:
- React Hook Form + Zod Validation
- Progress Bar: "Frage X von 7"
- Speicherung in localStorage bei jeder Antwort
- Eine Frage pro Card
- Navigation: "Zurück" / "Weiter"
- Am Ende: "Analyse anzeigen" → `/preview`

### `/preview` – Preview Dashboard

Ziel: Value zeigen, aber blocken für Sign-up

Inhalt:
- Große Anzeige: Score (z.B. "62/100"), Risiko-Level
- Kurze verbale Zusammenfassung
- Grid mit 3-4 geblurrten Cards (backdrop-filter: blur(8px))
- CTA-Card: "Kostenlose Registrierung" → `/signup`

Technik: Score aus localStorage, keine Supabase

### `/signup` – Registrierung

- Formular: E-Mail, Passwort
- Supabase Auth
- Nach Sign-up: localStorage → Supabase, Redirect `/dashboard`

### `/login` – Login

- Formular: E-Mail, Passwort
- Supabase Auth
- Nach Login: Redirect `/dashboard`

### `/dashboard` – Vollständiges Dashboard

Ziel: Klarer Mehrwert gegenüber Preview

Inhalt:
- Header: Score + Risiko-Level + Timestamp
- Section 1: "Ihre Antworten im Überblick" (Tabelle/Cards)
- Section 2: "Risikoprofil" (Recharts Balkendiagramm)
- Section 3: "Empfohlene nächste Schritte" (basierend auf Antworten)
- Section 4: Button "Neue Analyse starten"

Technik: Protected Route, Daten aus Supabase

---

## 6. Questionnaire Specification (7 Fragen)

React Hook Form + Zod Schema:

1. Branche (select, required)
   - Feldname: `industry`
   - Optionen: "Industrie/Produktion", "Dienstleistungen", "Finanzdienstleistungen", "Gesundheitswesen", "IT/Software", "Öffentlicher Sektor", "Sonstiges"

2. Mitarbeiteranzahl (radio, required)
   - Feldname: `employees`
   - Optionen: "<10", "10-50", "50-250", "250+"

3. KI-Systeme im Einsatz? (radio, required)
   - Feldname: `ai_in_use`
   - Optionen: "ja", "nein"

4. Art der KI (checkbox-group, optional)
   - Feldname: `ai_types`
   - Optionen: "Chatbots", "Prädiktive Analytik", "Bilderkennung", "Textanalyse", "Sonstige"
   - Nur relevant wenn ai_in_use = ja

5. Automatisierte Entscheidungen über Personen? (radio, required)
   - Feldname: `automated_decisions`
   - Optionen: "ja", "nein", "unsicher"

6. Einsatzbereich (checkbox-group, optional)
   - Feldname: `use_cases`
   - Optionen: "HR", "Kundenservice", "Produktentwicklung", "Marketing/Vertrieb", "Finanzen", "Sonstige"

7. Dokumentation vorhanden? (radio, required)
   - Feldname: `documentation`
   - Optionen: "ja", "nein"

---

## 7. Scoring Logic

Basis: score = 50

Regeln:
- Wenn ai_in_use = true: score -= 10
- Wenn ai_in_use = false: score += 50
- Wenn automated_decisions = 'ja': score -= 20
- Wenn automated_decisions = 'unsicher': score -= 10
- Wenn use_cases enthält 'HR': score -= 15 (Hochrisiko)
- Wenn documentation = 'ja': score += 30

Score-Clamping: 0-100

Risikokategorien:
- 0-49: "Dringend" (rot)
- 50-79: "Handlungsbedarf" (gelb/orange)
- 80-100: "Gut vorbereitet" (grün)

---

## 8. State & Data Model

### localStorage (vor Login)

Key: `compliai_questionnaire_v1`

TypeScript Types:
```typescript
type QuestionnaireAnswers = {
  industry: string | null;
  employees: '<10' | '10-50' | '50-250' | '250+' | null;
  ai_in_use: 'ja' | 'nein' | null;
  ai_types: string[];
  automated_decisions: 'ja' | 'nein' | 'unsicher' | null;
  use_cases: string[];
  documentation: 'ja' | 'nein' | null;
};

type ScoreResult = {
  score: number;
  riskLevel: 'Dringend' | 'Handlungsbedarf' | 'Gut vorbereitet';
};
```

### Supabase (nach Login)

Tabelle: `questionnaire_results`
Columns:
- id (uuid, primary key)
- user_id (uuid, foreign key zu auth.users)
- answers (jsonb, QuestionnaireAnswers)
- score (integer)
- risk_level (text)
- created_at (timestamp)

---

## 9. Design System & Branding

### Logo & Assets
- Logo mit Text: `/public/compliai-logo-full.png` (Navigation, Header)
- Logo Icon: `/public/compliai-logo-icon.png` (Favicon, Mobile, compact)
- Verwendung:
  - Desktop Nav: Full Logo, h-8 (32px)
  - Mobile Nav: Icon only, h-6 (24px)
  - next/image für Optimierung
  - Alt-Text: "CompliAI - AI-Co-Pilot for EU Compliance"

### Farben (aus Logo)
Primär:
- Navy Blue: #1e3a8a (Dunkelblau Schild)
- Cyan: #06b6d4 (Türkis aus Logo, für CTAs)

Sekundär:
- Backgrounds: White #ffffff, Light Gray #f9fafb, Subtle Blue #eff6ff
- Text: Dark Gray #1f2937 (Body), Navy #1e3a8a (Headlines)
- Success: Green #10b981
- Warning: Orange #f59e0b
- Danger: Red #ef4444

### Komponenten-Stil
- shadcn/ui "new-york" Style
- Glassmorphism Cards: backdrop-blur-lg, bg-white/80, border border-white/20, shadow-xl
- Framer Motion: Scroll fade-ins, page transitions, button micro-interactions
- Mobile-First, Tailwind responsive breakpoints

### Typography
- Headlines: font-bold, text-4xl bis text-6xl, text-navy-900
- Subheadlines: font-semibold, text-xl bis text-2xl, text-gray-700
- Body: font-normal, text-base bis text-lg, text-gray-600
- Spacing: py-12, py-16, py-20 zwischen Sections

### Button Styles
- Primary: bg-cyan-500 hover:bg-cyan-600, text-white, rounded-lg, px-6 py-3
- Secondary: bg-white hover:bg-gray-50, text-navy-900, border
- Ghost: text-navy-900 hover:bg-gray-100

### Card Styles
- Standard: bg-white, rounded-xl, shadow-lg, p-6
- Glass: backdrop-blur-lg bg-white/80, rounded-xl, border border-white/20
- Hover: hover:shadow-2xl, transition-all duration-300

---

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Playwright end-to-end tests

## Architecture

This is a Next.js 15 application using the App Router with:

- Framework: Next.js 15 with React 19
- Styling: Tailwind CSS 4 with custom CSS variables
- UI Components: shadcn/ui components in "new-york" style with Radix primitives
- Testing: Playwright for end-to-end testing
- Fonts: Geist Sans and Geist Mono from Google Fonts
- Charts: Recharts for data visualization
- Theme: next-themes for dark/light mode support
- Notifications: Sonner for toast notifications
- Backend: Supabase integration configured
- Forms: React Hook Form with Zod validation
- Additional Libraries: Embla Carousel, Command Menu (cmdk), Date handling
  (date-fns), motion (animations)

### Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/ui/` - Complete shadcn/ui component library including accordion,
  alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel,
  checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu,
  form, hover-card, input, input-otp, label, menubar, navigation-menu,
  pagination, popover, progress, radio-group, resizable, scroll-area, select,
  separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs,
  textarea, toggle, tooltip, and more
- `hooks/` - Custom React hooks (e.g., `use-mobile.ts` for responsive design)
- `lib/utils.ts` - Utility functions including Tailwind class merging
- `supabase/` - Supabase configuration and setup
- `tests/` - Playwright test files
- `public/` - Static assets

### shadcn/ui Configuration

Components are configured with:

- Style: "new-york"
- Base color: neutral
- CSS variables enabled
- Icon library: lucide-react
- Path aliases: `@/components`, `@/lib/utils`, etc.

### Playwright Configuration

- Tests run against all major browsers (Chrome, Firefox, Safari)
- Base URL: http://localhost:3000
- Auto-starts dev server if not running, reuses existing server if available
- 2-minute timeout for server startup

## Environment Variables

When working with environment variables in Next.js:

- **Server-side only**: Use standard naming (e.g., `DATABASE_URL`, `API_SECRET`)
- **Client-side access**: **MUST** prefix with `NEXT_PUBLIC_` (e.g.,
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`)
- Environment variables without the `NEXT_PUBLIC_` prefix are **NOT** available
  in the browser
- **NEVER** expose sensitive data (API keys, secrets) with `NEXT_PUBLIC_` prefix
- Store environment variables in `.env.local` for local development
- Use `.env.example` to document required environment variables

## Validation Strategy

**ALWAYS** work iteratively and validate your work after finishing each task by
following these steps in order:

### Quick Validation Steps (run for each task)

1. **Linting**: `npm run lint` - Check for syntax and style issues
2. **Type checking**: `npm run typecheck` - Ensure TypeScript correctness
3. **Specific tests**: Run only relevant Playwright tests for changed
   functionality. If you implemented new functionality, write tests for it and
   run them.

### Complete Validation (run only after all tasks are complete)

4. **Build**: `npm run build` - Full production build verification
5. **Complete test suite**: `npm run test` - All Playwright end-to-end tests

### Testing Guidelines

- **ALWAYS** write tests for new functionality - this is required for validation
- Write realistic e2e tests from a user perspective focusing on actual
  interactions
- **NEVER** write trivial tests that only assert component visibility
- Focus on meaningful user workflows and business logic
- If existing tests fail that are not part of the current task, **STOP** and ask
  for guidance
- Do NOT auto-fix unrelated test failures
- If tests fail without a clear reason, use playwright mcp to debug the test in
  a real browser

# General

- Don't add any components that are not part of the shadcn library to
  components/ui
- If you add images from the internet, make sure that the domain is allowed in
  remotePatterns in next.config.ts
