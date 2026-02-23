
# Drie aanpassingen

## 1. WebP-kwaliteit naar 90%
In `src/components/ImageCropSection.tsx` wordt de `canvas.toBlob` kwaliteit van `0.85` naar `0.90` gezet.

## 2. Genre "Theater" verwijderen
In `src/components/VoorstellingenTab.tsx` wordt "Theater" uit de `GENRES` array verwijderd.

## 3. Kopieer-knoppen verplaatsen naar het einde van elk tekstveld
In `src/components/WebsiteTab.tsx` worden de `CopyButton` componenten verplaatst van naast de labels naar na/onder het invoerveld, bij:
- **Focus zoekwoord**: CopyButton van naast het label naar na het Input-veld
- **SEO-titel**: CopyButton van naast het label naar na het Input-veld
- **URL-slug**: CopyButton van naast het label naar na de slug-invoer

---

### Technische details

**Bestand: `src/components/ImageCropSection.tsx`** (regel 76)
- `0.85` wordt `0.90`

**Bestand: `src/components/VoorstellingenTab.tsx`** (regel 54)
- `"Theater"` verwijderen uit de GENRES array

**Bestand: `src/components/WebsiteTab.tsx`**
- Per SEO-veld: de `CopyButton` verplaatsen van de `<div>` met het label naar een positie direct na het invoerveld, zodat het kopieer-icoon rechts aan het einde van het veld verschijnt (niet naast het label)
