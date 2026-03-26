

# Fix layout: centering en spacing na Tailwind v4 migratie + build errors

## Probleem

In Tailwind v4 werkt de `container` utility-class anders dan in v3. In v3 kon je `container` configureren met `center: true` en `padding` in de config. In v4 moet je dit expliciet instellen via `@utility` of `@theme` in CSS. Hierdoor zijn alle `container`-secties niet meer gecentreerd en missen ze padding.

Daarnaast zijn er build errors in twee edge functions door dubbele `data` variabelen.

---

## Stap 1: Container centreren en spacing fixen

In `src/index.css` de container utility configureren zodat deze automatisch gecentreerd wordt met goede padding:

```css
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;
  max-width: 80rem; /* 1280px, vergelijkbaar met de v3 default */
}
```

Dit herstelt het centering-gedrag voor alle pagina's die `container` gebruiken (Dashboard, Voorstellingen, Website, Instellingen, de header/tabs).

## Stap 2: Build errors fixen in edge functions

**`supabase/functions/generate-alt-text/index.ts`**: De variabele `data` wordt twee keer gedeclareerd (regel 29 en 105). Hernoem de tweede naar `result`:
```typescript
const result = await response.json();
const altText = result.choices?.[0]?.message?.content?.trim() || "";
```

**`supabase/functions/optimize-text/index.ts`**: Controleren op dezelfde dubbele declaratie en fixen indien nodig.

---

### Technische details

**Bestanden:**
- `src/index.css` — toevoegen `@utility container` blok
- `supabase/functions/generate-alt-text/index.ts` — hernoem dubbele `data` variabele
- `supabase/functions/optimize-text/index.ts` — controleren en fixen indien nodig

