
# Plan: Instellingen-tab toevoegen

## Wat wordt er gebouwd?
Een nieuw tabblad "Instellingen" rechts in de tabbalk (met een tandwiel-icoon), waar het marketingteam algemene voorkeuren kan beheren.

## Instellingen die we opnemen

### 1. Standaard seizoen
- Dropdown met beschikbare seizoenen (bijv. 24/25, 25/26, 26/27)
- De app opent voortaan met dit seizoen in plaats van het automatisch berekende seizoen
- Optie "Automatisch (huidig seizoen)" als default

### 2. AI-instellingen
- Keuze AI-model voor tekstoptimalisatie (momenteel hardcoded op `gemini-3-flash-preview`)
- Dropdown met beschikbare modellen (Gemini Flash, Gemini Pro, GPT-5 Mini, etc.)
- Standaard maximaal woordenaantal voor geoptimaliseerde teksten (nu hardcoded op 150)

### 3. Genrelijst beheren
- Overzicht van alle genres met mogelijkheid om genres toe te voegen of te verwijderen
- Zo kan het team zelf de genrelijst uitbreiden zonder code-aanpassingen

### 4. Standaard tijden
- Standaard begintijd (nu hardcoded 20:00)
- Standaard eindtijd (nu hardcoded 22:00)
- Worden als default ingevuld bij nieuwe voorstellingen

### 5. Export & info
- Weergave van het huidige aantal voorstellingen per seizoen
- Versie-informatie van de app

## Technische aanpak

### Database
- Nieuwe tabel `settings` met kolommen: `key` (text, primary key), `value` (jsonb), `updated_at` (timestamptz)
- Vooraf gevuld met standaardwaarden
- RLS: volledig open (geen auth in deze app)

### Nieuwe bestanden
- `src/components/SettingsTab.tsx` -- het volledige instellingenpaneel
- `src/hooks/useSettings.ts` -- TanStack Query hook voor laden/opslaan van instellingen

### Aanpassingen aan bestaande bestanden

| Bestand | Wijziging |
|---|---|
| `src/components/AppTabs.tsx` | Tab-type uitbreiden met `"instellingen"`, tab toevoegen met Settings-icoon, rechts uitgelijnd |
| `src/pages/Index.tsx` | `SettingsTab` renderen, standaard seizoen uit settings laden als initieel seizoen |
| `src/lib/season.ts` | Geen wijziging (blijft fallback) |
| `supabase/functions/optimize-text/index.ts` | Model en max woorden uit request body halen i.p.v. hardcoded |

### Layout van de Instellingen-tab
- Gecentreerde kolom (max-w-2xl), vergelijkbaar met een formulierpagina
- Secties als cards met zinc-800/50 achtergrond
- Elke instelling met label, beschrijving en invoerveld
- Auto-save met debounce (400ms), net als de Website-tab
- Toast-melding "Instellingen opgeslagen" bij succes

### Flow standaard seizoen
1. Bij app-load: query `settings` tabel voor key `default_season`
2. Als waarde ingesteld en niet "auto": gebruik die als initieel seizoen
3. Als "auto" of niet ingesteld: val terug op `getCurrentSeason()`
4. Gebruiker kan in Instellingen de waarde wijzigen, wordt direct opgeslagen
