# Accessibility research backing the UI preference design (color & font)

This document exists to answer the advisor's note:

> "Preference za UI izgled trebaju biti u skladu sa nekim preporukama... Sama činjenica da je neka paleta boja visokog kontrasta, ne mora značiti da je adekvatna za osobe sa Down sindromom."

It collects the actual peer-reviewed research behind the color-scheme and font choices implemented in `FE/lib/preferences.ts`, so the design decisions can be defended to the thesis committee rather than presented as arbitrary. Citations are full and verifiable (DOI/PubMed links included).

## 1. Color palette — primary source

**Alonso-Virgós, L., Rodríguez Baena, L., Pascual Espada, J., & González Crespo, R. (2018). Web page design recommendations for people with Down syndrome based on users' experiences.** *Sensors*, 18(11), 4047. https://doi.org/10.3390/s18114047 — open access on PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC6264006/

**Method**: eye-tracking study with 25 participants with Down syndrome (ages 11–25, average IQ 50–70), measuring sustained attention/engagement across different foreground/background color pairs and layout choices on real web pages.

**Key data points** (color pair → contrast ratio → mean engagement time):

| Foreground / background | Contrast ratio | Engagement time |
|---|---|---|
| Black `#000000` on yellow `#FFFF00` | 19.56:1 | **7246 s** (longest) |
| Cyan `#00FFFF` on white `#FFFFFF` | 1.25:1 | 6533 s |
| Cyan `#00FFFF` on black `#000000` | 16.75:1 | 4270 s |
| White `#FFFFFF` on blue `#3B29FA` | 7.28:1 | 2925 s |
| Blue `#3B29FA` on white `#FFFFFF` | 7.28:1 | 1891 s |

**Why this matters for the thesis argument**: the cyan-on-white pair, with a contrast ratio of only 1.25:1 (barely distinguishable by WCAG standards), outperformed two pairs with far higher mathematical contrast (16.75:1 and 7.28:1). This is direct empirical evidence that *contrast ratio alone does not predict suitability for users with Down syndrome* — exactly the point the advisor raised. The best-performing pair (black-on-yellow) was chosen for the app's "High contrast" option specifically because it is the one combination this study validated, not because it is conventionally "high contrast."

**Additional findings from the same study, also applied in the app:**
- Monochromatic/solid backgrounds outperformed textured ones by ~65% engagement time → the app's mobile preview and color schemes use flat, solid background colors, no gradients/textures, for the "high contrast" scheme.
- Color used to signal meaning (not just decoration) improved task time by ~71%, but only ~27% of users relied on color alone for navigation → color is paired with icons/text labels throughout the app, never used as the sole signal (e.g. status badges, app category chips).

**Implementation mapping**:
- `FE/lib/preferences.ts` — `COLOR_SCHEMES` entry for `'high-contrast'` uses `#000000` / `#FFFF00` (yellow), not an arbitrary black/white inversion.
- `FE/components/preferences/preference-preview.tsx` and the inline preview in `FE/app/(dashboard)/dashboard/settings/preferences/page.tsx` render this scheme as black text on a solid yellow background.
- Citation text shown to the end user (parent) in the preferences UI itself: `settings.colorSchemeWhy` key in `FE/lib/i18n/bs.json` / `en.json`.

## 2. Color palette — supporting source (symbol/AAC context)

**Wilkinson, K. M., Carlin, M., & Thistle, J. (2008). The role of color cues in facilitating accurate and rapid location of aided symbols by children with and without Down syndrome.** *American Journal of Speech-Language Pathology*, 17(2), 179–193. https://pubmed.ncbi.nlm.nih.gov/18448605/

**Method**: 10 children with Down syndrome and 16 typically developing children searched for target symbols among 12-symbol arrays (food/clothing/activity categories), with symbols either color-clustered by category or randomly arranged.

**Finding**: clustering symbols that share a color together (rather than scattering them) measurably improved both speed and accuracy of symbol location for children with Down syndrome specifically (not just the general population).

**Implementation mapping**: this motivates keeping each application category in the catalog visually tied to one consistent accent color (`Application.color` field, used consistently across the applications grid, statistics charts, and category badges) rather than assigning arbitrary or rotating colors per app.

## 3. Font choice — supporting source

The "high legibility" font option (`Atkinson Hyperlegible`) is produced by the **Braille Institute of America**, in partnership with Applied Design Works, specifically engineered for readers with low vision through deliberate differentiation of commonly-confused letterforms (e.g. distinguishing `I`/`l`/`1`, rounder counters). Source: https://www.brailleinstitute.org/freefont/

This is a credible, named-institution source rather than a peer-reviewed study, which is worth stating plainly to the committee: there is less Down-syndrome-specific peer-reviewed literature on font choice than on color, so the font option is framed in the UI copy (`settings.fontFamilyWhy`) as following general "easy-to-read" cognitive-accessibility design principles (simple rounded glyphs, generous spacing, avoiding decorative/condensed faces) rather than over-claiming a specific study result.

## 4. Suggested citation text for the thesis (Bosnian)

> Pri odabiru palete boja za korisnički interfejs, izbjegnuta je pretpostavka da "visok kontrast" automatski podrazumijeva pristupačnost za osobe sa Down sindromom. Studija Alonso-Virgós i sar. (2018), sprovedena metodom eye-trackinga na 25 ispitanika sa Down sindromom, pokazala je da kombinacija crne boje teksta na žutoj podlozi (kontrast 19,56:1) proizvodi najduže zadržavanje pažnje, dok je kombinacija cijan na bijeloj podlozi (kontrast samo 1,25:1) nadmašila nekoliko shema sa znatno većim kontrastom. Ovaj nalaz direktno potvrđuje da matematički kontrast sam po sebi nije pouzdan prediktor pogodnosti sheme za ovu populaciju, te je upravo zbog toga opcija "Visoki kontrast" u aplikaciji implementirana kao specifična, empirijski potvrđena kombinacija (crno na žutom), a ne proizvoljna inverzija boja.

## Summary table for quick reference

| Decision | Source | Type |
|---|---|---|
| "High contrast" = black on yellow (#000000/#FFFF00) | Alonso-Virgós et al. (2018), *Sensors* | Peer-reviewed, DS-specific, eye-tracking |
| Solid/flat backgrounds, no textures | Alonso-Virgós et al. (2018), *Sensors* | Peer-reviewed, DS-specific |
| Color paired with text/icon, never color-only signaling | Alonso-Virgós et al. (2018), *Sensors* | Peer-reviewed, DS-specific |
| Consistent per-category accent color | Wilkinson, Carlin & Thistle (2008), *AJSLP* | Peer-reviewed, DS-specific |
| "High legibility" font option | Braille Institute of America (Atkinson Hyperlegible) | Named institution, low-vision focus, general cognitive-accessibility principles |
