# CompliAI Dashboard

Das Dashboard ist das Herzstück der CompliAI Anwendung. Es ermöglicht Nutzern, Compliance-Checks durchzuführen, Dokumentationen zu verwalten und Berichte zu generieren.

## Struktur

- `layout.tsx`: Definiert das grundlegende Layout mit Sidebar und Auth-Check.
- `page.tsx`: Die Hauptübersicht (Dashboard Home) mit Statistiken und Schnellzugriffen.
- `check/`: Bereich für Compliance Checks.
  - `page.tsx`: Liste aller Checks.
  - `new/page.tsx`: Fragebogen für neuen Check.
  - `[id]/page.tsx`: Detailansicht eines Checks (noch zu implementieren).
- `dokumentation/`, `risikoanalyse/`, etc.: Platzhalter für zukünftige Features.

## Komponenten

- `components/dashboard/sidebar.tsx`: Responsive Sidebar-Navigation.
- `components/dashboard/stat-card.tsx`: Kacheln für Statistiken.
- `components/dashboard/empty-state.tsx`: Anzeige, wenn keine Daten vorhanden sind.
- `components/ui/glass-card.tsx`: Wiederverwendbare Karte im Glassmorphism-Design.

## Design System

Das Dashboard nutzt das gleiche Design-System wie die Landing Page:
- **Glassmorphism**: `bg-white/5 backdrop-blur-xl border-white/10`
- **Farben**: 
  - Primary: Sky Blue (`text-sky-400`)
  - Background: Slate 900 (`bg-slate-900`)
  - Text: White (Headings), Gray-400 (Body)
- **Typografie**: Geist Sans

## API Routes

- `POST /api/checks`: Erstellt einen neuen Check.
- `GET /api/checks`: Listet alle Checks des Users.
- `GET /api/checks/[id]`: Holt Details eines Checks.
- `DELETE /api/checks/[id]`: Löscht einen Check.

## Nächste Features (TODO)

### Priorität HOCH:
- [ ] Detailansicht für Checks (`app/dashboard/check/[id]/page.tsx`)
- [ ] PDF Report Generator
- [ ] Echte Risiko-Berechnung (Algorithmus)

### Priorität MITTEL:
- [ ] Task Management System
- [ ] Dokumenten-Templates
- [ ] Profil-Einstellungen

### Priorität NIEDRIG:
- [ ] Dark/Light Mode Toggle (aktuell Dark Mode only)
- [ ] Team-Features
