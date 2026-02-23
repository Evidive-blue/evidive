# Contre-audit frontend evidive.blue — Conformité stack

**Date**: 2026-02-13  
**Périmètre**: `evidive.blue/frontend/src` (et `vercel.json`, `messages`, `globals.css`, `components.json`)  
**Mission**: Vérifier chaque point d’un audit précédent avec preuves (rg / lecture de fichiers).

---

## 1. Occurrences `style={{}}`

**Résultat**: ✅ **CONFIRMÉ** (nombre différent de l’audit précédent)

- **Commande**: `rg "style=\{\{" --glob "*.tsx" frontend/src/`
- **Total**: **93 occurrences** (audit précédent: 73)
- **Par fichier**:
  - `src/components/ocean-background.tsx`: **86**
  - `src/components/admin/admin-plannings-client.tsx`: **5**
  - `src/components/centers/centers-globe.tsx`: **1**
  - `src/components/admin/admin-reports-client.tsx`: **1**

**Sévérité**: CRITIQUE (règle: pas d’inline styles sauf CSS custom properties dynamiques).  
**Exception possible**: `ocean-background.tsx` utilise des positions/delays dynamiques (left, top, animationDelay) pour bulles/particules/poissons/étoiles — conforme à l’exception “CSS custom properties pour valeurs dynamiques” si on considère que ces valeurs sont dynamiques. Les autres fichiers (admin-plannings, centers-globe, admin-reports) contiennent des `style={{}}` (hauteur/min-height, position popup, width %) à traiter.

---

## 2. URLs hardcodées dans `vercel.json`

**Résultat**: ✅ **CONFIRMÉ**

- **Fichier**: `frontend/vercel.json`
- **Extrait**:  
  `"env":{"NEXT_PUBLIC_BASE_URL":"https://evidive.whytcard.ai","NEXT_PUBLIC_API_URL":"https://api.evidive.blue"}`

**Sévérité**: WARNING (config déploiement; les URLs sont intentionnelles pour ce projet mais “hardcodées” dans le fichier).

---

## 3. `outline-none` sans `focus-visible:ring-*`

**Résultat**: ✅ **CONFIRMÉ** (40+ concernées)

- **Commande**: `rg "outline-none" --glob "*.tsx" frontend/src/`
- **Total lignes avec `outline-none`**: **44** (réparties dans 27 fichiers)
- **Avec `focus-visible:ring` sur la même ligne (conformes)**:  
  `switch.tsx`, `textarea.tsx`, `select.tsx`, `button.tsx`, `input.tsx` (via `cn()`), `centers-globe.tsx` (1 ligne)
- **Sans `focus-visible:ring` ou avec `focus:ring` seulement**: toutes les autres (~38), notamment:
  - `admin-table.tsx` (3), `dashboard-services-client.tsx` (2), `admin-coupons-client.tsx` (1), `center-detail-client.tsx` (1), `dashboard-holidays-client.tsx` (1), `admin-plannings-client.tsx` (3), `dashboard-working-hours-client.tsx` (1), `booking-form-client.tsx` (5), `admin-locations-client.tsx` (3), `dashboard-settings-client.tsx` (8), `admin-center-detail-client.tsx` (1), `admin-extras-client.tsx` (7), `dashboard-team-client.tsx` (1), `admin-payments-client.tsx` (1), `dive-guide-chat.tsx` (1), `admin-reports-client.tsx` (2), `admin-tags-client.tsx` (1), `admin-categories-client.tsx` (4), `admin-refunds-client.tsx` (1), `admin-bookings-client.tsx` (1), `centers-filters.tsx` (1)
- **Composants UI**: `tabs.tsx` (TabsContent: `outline-none` seul), `dialog.tsx` (content: `outline-none` seul)

**Sévérité**: WARNING (accessibilité WCAG 2.4.7 — indicateur de focus visible). Remplacer `focus:outline-none` (+ `focus:ring-*` éventuel) par `focus-visible:outline-none` + `focus-visible:ring-*`.

---

## 4. Fichiers avec `key={index}`

**Résultat**: ❌ **INFIRMÉ** (pattern exact)

- **Commande**: `rg "key=\{.*index\}" --glob "*.tsx" frontend/src/`
- **Résultat**: **0** occurrence du pattern littéral `key={...index...}`

**Précision**: Il existe des usages de clé par indice avec d’autres noms de variable: `key={i}`, `key={idx}`, `key={j}` dans notamment:  
`center-detail-client.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `careers-client.tsx`, `dashboard-reviews-client.tsx`, `admin-reviews-client.tsx`, `admin-reports-client.tsx`, `loading-skeleton.tsx`, etc.  
Règle “pas de key={index}” respectée au sens strict; les `key={i}` sur listes non réordonnables sont tolérés mais à éviter sur listes dynamiques réordonnables.

**Sévérité**: OK pour le pattern exact; SUGGESTION pour préférer des clés stables (id, slug) où c’est possible.

---

## 5. i18n — namespaces manquants (MISSING_MESSAGE)

**Résultat**: ❌ **INFIRMÉ** (pas de namespace manquant fr vs en)

- **Méthode**: Comparaison des clés de premier niveau de `messages/fr.json` et `messages/en.json`.
- **fr.json** (premier niveau): common, navigation, nav, footer, hero, howItWorks, whyUs, homepage, about, images, social, contact, explorerPage, zen, explorer, centers, centersPage, careers, login, register, terms, privacy, onboard, sitemap, admin, dashboard, booking, reviews, blog, faq, partner.
- **en.json**: même ensemble de 33 clés (ordre différent: explorer / explorerPage / zen).

Aucun namespace de premier niveau manquant dans l’un ou l’autre. Pas de cause évidente de MISSING_MESSAGE au niveau des clés racine.

**Sévérité**: OK (pour la comparaison fr/en racine; des clés manquantes imbriquées restent possibles ailleurs).

---

## 6. Pas de `as any` / `: any`

**Résultat**: ✅ **CONFIRMÉ** (0)

- **Commande**: `rg "as any|: any" --glob "*.{ts,tsx}" frontend/src/`
- **Résultat**: **0** occurrence.

**Sévérité**: OK.

---

## 7. Pas de `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`

**Résultat**: ✅ **CONFIRMÉ** (0)

- **Commande**: `rg "@ts-ignore|@ts-expect-error|@ts-nocheck" --glob "*.{ts,tsx}" frontend/src/`
- **Résultat**: **0** occurrence.

**Sévérité**: OK.

---

## 8. Pas de non-null assertions `!.`

**Résultat**: ✅ **CONFIRMÉ** (0)

- **Commande**: `rg "\w+!\." --glob "*.{ts,tsx}" frontend/src/`
- **Résultat**: **0** occurrence.

**Sévérité**: OK.

---

## 9. Pas de `"use client"` sur `layout.tsx` ou `page.tsx`

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **Commandes**:  
  `rg "\"use client\"" --glob "layout.tsx" frontend/src/`  
  `rg "\"use client\"" --glob "page.tsx" frontend/src/`
- **Résultat**: **0** fichier `layout.tsx` ou `page.tsx` contenant `"use client"`.
- **Preuve**: `src/app/[locale]/layout.tsx` est un Server Component (async, getTranslations côté serveur, pas de directive `"use client"`).

**Sévérité**: OK.

---

## 10. Pas de `<img>` (utilisation de `next/image`)

**Résultat**: ✅ **CONFIRMÉ** (0)

- **Commande**: `rg "<img " --glob "*.tsx" frontend/src/`
- **Résultat**: **0** occurrence.

**Sévérité**: OK.

---

## 11. `console.log` / `console.error`

**Résultat**: ✅ **CONFIRMÉ** (3 occurrences)

- **Commande**: `rg "console\.(log|debug|warn|error)" --glob "*.{ts,tsx}" frontend/src/`
- **Fichiers**:
  - `src/lib/site-config.ts` (ligne 26): `console.error` (fallback production NEXT_PUBLIC_BASE_URL).
  - `src/app/api/explorer/chat/route.ts` (lignes 82 et 103): `console.error` (erreurs API Groq / Chat).

**Sévérité**: OK (usage raisonnable en config/API); à éviter en code UI.

---

## 12. Responsive breakpoints (grids)

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **Fichiers**: `hero-section.tsx`, `feature-cards.tsx`, `cta-section.tsx` (+ `stats-section.tsx`, `why-us-section.tsx`).
- **hero-section.tsx**: pas de grid (flex); typo responsive `text-2xl sm:text-3xl md:text-4xl`, `flex-col sm:flex-row`.
- **feature-cards.tsx**: `grid gap-6 sm:grid-cols-3 lg:gap-8` (ligne 46).
- **cta-section.tsx**: pas de grid (flex); `flex-col sm:flex-row`, `text-3xl sm:text-4xl`.
- **stats-section.tsx**: `grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8`.
- **why-us-section.tsx**: `grid gap-6 sm:grid-cols-2 lg:gap-8`.

**Sévérité**: OK.

---

## 13. Dark mode (variantes `dark:`)

**Résultat**: ⚠️ **PARTIEL** (manquant sur composants home principaux)

- **Vérification**: `rg "dark:"` dans `hero-section.tsx`, `feature-cards.tsx`, `cta-section.tsx`.
- **Résultat**: **0** occurrence de `dark:` dans ces trois fichiers.
- Les composants utilisent des couleurs fixes (white, slate-*, cyan-*, etc.) sans variante `dark:`.

**Sévérité**: WARNING (règle projet: tout élément visible doit avoir des variantes dark).

---

## 14. `globals.css` — `@import "tailwindcss"` et `@theme`, pas `@tailwind base`

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **Fichier**: `frontend/src/app/globals.css`
- **Ligne 1**: `@import "tailwindcss";`
- **Ligne 9**: `@theme inline { ... }`
- **Commande**: `rg "@tailwind base"` → **0** dans ce fichier.

**Sévérité**: OK.

---

## 15. `MotionConfig reducedMotion="user"` (motion-provider)

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **Fichier**: `src/components/motion-provider.tsx` — contient `MotionConfig reducedMotion="user">`.
- **Layout**: `src/app/[locale]/layout.tsx` importe `MotionProvider` et enveloppe l’arbre avec `<MotionProvider>` (lignes 10, 89, 98).

**Sévérité**: OK.

---

## 16. Metadata — pas de domaines hardcodés dans `robots.ts` / `sitemap.ts`

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **robots.ts**: utilise `getBaseUrl()` de `@/lib/site-config` pour construire l’URL du sitemap.
- **sitemap.ts**: utilise `getBaseUrl()` pour toutes les URLs.
- Aucune chaîne du type `https://evidive.blue` ou autre domaine en dur dans ces deux fichiers.

**Sévérité**: OK.

---

## 17. shadcn — `components.json` (tailwind config vide)

**Résultat**: ✅ **CONFIRMÉ** (conforme)

- **Fichier**: `frontend/components.json`
- **Extrait**: `"tailwind":{"config":"","css":"src/app/globals.css", ...}`
- **Preuve**: `"config":""` — pas de fichier tailwind.config.

**Sévérité**: OK.

---

## Synthèse

| # | Point | Statut | Sévérité |
|---|--------|--------|----------|
| 1 | 93× `style={{}}` (4 fichiers) | CONFIRMÉ | CRITIQUE* |
| 2 | URLs hardcodées dans `vercel.json` | CONFIRMÉ | WARNING |
| 3 | 40+ `outline-none` sans `focus-visible:ring` | CONFIRMÉ | WARNING |
| 4 | 7 fichiers `key={index}` | INFIRMÉ (0 littéral) | OK |
| 5 | MISSING_MESSAGE i18n (namespaces) | INFIRMÉ (même set fr/en) | OK |
| 6 | Pas de `as any` / `: any` | CONFIRMÉ (0) | OK |
| 7 | Pas de @ts-ignore / @ts-expect-error | CONFIRMÉ (0) | OK |
| 8 | Pas de `!.` | CONFIRMÉ (0) | OK |
| 9 | Pas de "use client" sur layout/page | CONFIRMÉ | OK |
| 10 | Pas de `<img>` | CONFIRMÉ (0) | OK |
| 11 | console.log/error | CONFIRMÉ (3, raisonnables) | OK |
| 12 | Responsive breakpoints grids | CONFIRMÉ | OK |
| 13 | Dark mode (hero, feature, cta) | Manquant | WARNING |
| 14 | globals.css @import + @theme | CONFIRMÉ | OK |
| 15 | MotionConfig reducedMotion | CONFIRMÉ | OK |
| 16 | robots/sitemap sans domaine hardcodé | CONFIRMÉ | OK |
| 17 | components.json tailwind config "" | CONFIRMÉ | OK |

\* Pour le point 1, une partie des `style={{}}` dans `ocean-background.tsx` peut relever de l’exception “propriétés CSS dynamiques”; le reste (admin, globe, reports) est à corriger.

**Verdict**: **CONDITIONNEL** — conforme sur TypeScript, i18n racine, Next/Image, layout/page, globals.css, Motion, robots/sitemap, shadcn config. À traiter en priorité: `outline-none`/focus visible (accessibilité), variantes dark sur les composants home, et réduction des `style={{}}` hors exception (notamment admin-plannings, centers-globe, admin-reports).
