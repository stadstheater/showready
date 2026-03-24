

# Upgrade naar shadcn/ui v4 + Tailwind CSS v4

## Belangrijk: risico's

Dit is een grote migratie. Tailwind v4 verandert fundamenteel hoe configuratie werkt (CSS-first in plaats van JS config). Er zijn 40+ UI-componenten die bijgewerkt moeten worden. Er is risico op visuele regressies en build-fouten. Ik raad aan dit stapsgewijs te doen.

---

## Stap 1: Tailwind CSS v3 naar v4

- **Package updates**: `tailwindcss` v3 → v4, verwijder `postcss`, `autoprefixer`, `tailwindcss-animate` (animaties zijn ingebouwd in v4)
- Voeg `@tailwindcss/vite` toe als Vite plugin (vervangt PostCSS-flow)
- **Verwijder**: `tailwind.config.ts`, `postcss.config.js`
- **Update `vite.config.ts`**: voeg `tailwindcss()` plugin toe

## Stap 2: CSS migratie

Verplaats alle configuratie van `tailwind.config.ts` naar `src/index.css`:
- Vervang `@tailwind base/components/utilities` door `@import "tailwindcss"`
- Zet alle kleuren, border-radius, fonts, en animaties om naar `@theme` blok in CSS
- CSS variabelen (`--background`, `--primary`, etc.) blijven behouden maar de `hsl()` wrapper verhuist naar het `@theme` blok

## Stap 3: UI-componenten bijwerken

Alle ~40 componenten in `src/components/ui/` moeten bijgewerkt worden naar de nieuwste shadcn v4 versies. De belangrijkste wijzigingen:
- `cn()` utility blijft hetzelfde
- Sommige componenten hebben nieuwe API's (bijv. Button, Card)
- `cva` patronen kunnen licht veranderen

## Stap 4: Opruimen

- Verwijder `components.json` of update naar v4 formaat
- Verwijder ongebruikte dependencies

---

### Technische details

**Package changes:**
```
Toevoegen: @tailwindcss/vite
Upgraden: tailwindcss ^4.x
Verwijderen: postcss, autoprefixer, tailwindcss-animate, postcss.config.js, tailwind.config.ts
```

**vite.config.ts** - Tailwind als Vite plugin:
```typescript
import tailwindcss from "@tailwindcss/vite";
// plugins: [tailwindcss(), react(), ...]
```

**src/index.css** - Nieuwe structuur:
```css
@import "tailwindcss";

@theme {
  --color-background: hsl(var(--background));
  --color-primary: hsl(var(--primary));
  /* alle kleuren uit tailwind.config.ts verhuizen hiernaartoe */
  --radius-lg: var(--radius);
  --font-sans: Lato, ui-sans-serif, ...;
  --animate-accordion-down: accordion-down 0.2s ease-out;
}

@layer base {
  :root { /* bestaande CSS variabelen blijven */ }
}
```

**Alle 40+ UI-componenten** worden herschreven naar de nieuwste shadcn v4 versies.

