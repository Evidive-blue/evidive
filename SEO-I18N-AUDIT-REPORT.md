# SEO-I18N ENFORCER AUDIT REPORT

**Generated**: 2026-02-05  
**Project**: Evidive - Dive Center Booking Platform  
**Stack**: Next.js 16, React 19, Tailwind v4, Prisma  

---

## SCORE GLOBAL: 62/100 ❌ FAIL

**Minimum requis: 95/100**

---

## Score Breakdown

| Catégorie | Score | Max | Issues |
|-----------|-------|-----|--------|
| Metadata | 12 | 25 | 18 pages sans generateMetadata |
| Open Graph | 10 | 15 | OK dans layout racine |
| Sitemap | 10 | 10 | ✅ Dynamique avec hreflang |
| Robots | 5 | 5 | ✅ Configuré correctement |
| Structured Data | 5 | 10 | JSON-LD existe mais non utilisé |
| Strings i18n | 5 | 20 | ~150+ strings hardcodées |
| Translations | 15 | 15 | FR/EN complets, 9 langues incomplètes |

---

## PHASE 1: SEO AUDIT

### 1.1 Metadata Status

| Page | generateMetadata | Status |
|------|------------------|--------|
| `/` (home) | ❌ | MISSING |
| `/about` | ❌ | MISSING (use client) |
| `/contact` | ❌ | MISSING (use client) |
| `/centers` | ❌ | MISSING |
| `/centers/[slug]` | ✅ | OK |
| `/explorer` | ❌ | MISSING (use client) |
| `/careers` | ❌ | MISSING (use client) |
| `/privacy` | ❌ | MISSING (use client) |
| `/terms` | ❌ | MISSING (use client) |
| `/site-map` | ❌ | MISSING (use client) |
| `/login` | ✅ | OK |
| `/register` | ✅ | OK |
| `/verify-email` | ❌ | MISSING |
| `/forgot-password` | ❌ | MISSING |
| `/reset-password` | ❌ | MISSING |
| `/dashboard` | ✅ | OK |
| `/profile` | ✅ | OK |
| `/admin` | ✅ | OK |
| `/admin/users` | ✅ | OK |
| `/admin/users/[id]` | ✅ | OK |
| `/admin/bookings` | ✅ | OK |
| `/admin/bookings/[id]` | ✅ | OK |
| `/admin/centers` | ❌ | MISSING |
| `/admin/centers/[id]` | ❌ | MISSING |
| `/admin/settings` | ✅ | OK |
| `/onboard` | ✅ | OK |
| `/onboard/diver` | ❌ | MISSING |
| `/onboard/center` | ❌ | MISSING |
| `/booking/success` | ✅ | OK |
| `/booking/cancel` | ✅ | OK |
| `/book/[slug]/[serviceId]` | ✅ | OK |
| `/center/manage/[slug]` | ✅ | OK |
| `/center/manage/[slug]/edit` | ✅ | OK |
| `/center/manage/[slug]/team` | ✅ | OK |
| `/center/manage/[slug]/calendar` | ✅ | OK |
| `/center/manage/[slug]/payments` | ✅ | OK |
| `/center/manage/[slug]/services/new` | ❌ | MISSING |
| `/center/manage/[slug]/services/[serviceId]` | ✅ | OK |

**Total: 20/38 pages avec metadata (52.6%)**

### 1.2 Technical SEO

- [x] `sitemap.ts` présent et dynamique avec hreflang
- [x] `robots.ts` présent avec sitemap URL
- [ ] JSON-LD Organization (composant existe, non utilisé dans layout)
- [ ] JSON-LD WebSite (composant existe, non utilisé dans layout)
- [x] JSON-LD LocalBusiness pour centers (utilisé dans center detail)
- [x] Canonical URLs via alternates

### 1.3 Sitemap Coverage

Pages dans sitemap: 10 statiques + dynamiques centers
Pages manquantes dans sitemap:
- `/site-map`
- `/booking/*`
- `/book/*`

---

## PHASE 2: I18N AUDIT

### 2.1 Languages Status

| Language | Keys | Complete | Missing |
|----------|------|----------|---------|
| en | 2411 | ✅ | 0 |
| fr | 2411 | ✅ | 0 |
| de | 1922 | ❌ | 489 |
| es | 1924 | ❌ | 487 |
| it | 1924 | ❌ | 487 |
| el | 1923 | ❌ | 488 |
| nl | 1923 | ❌ | 488 |
| pt | 1923 | ❌ | 488 |
| pl | 1923 | ❌ | 488 |
| ru | 1923 | ❌ | 488 |
| sv | 1923 | ❌ | 488 |

### 2.2 Missing Keys by Namespace

| Namespace | Missing Keys |
|-----------|-------------|
| onboardCenter | 100 |
| booking | 83 |
| onboardDiver | 50 |
| centerManage | 43 |
| userDashboard | 31 |
| profile | 31 |
| common | 24 |
| about | 21 |
| metadata | 21 |
| centers | 19 |
| onboardWelcome | 13 |
| weather | 11 |
| centerServices | 10 |
| explorerPage | 8 |
| globe | 5 |
| contactPage | 4 |
| notFound | 4 |
| nav | 4 |
| imageAlt | 2 |
| zen | 2 |
| adminCenters | 1 |
| footer | 1 |
| oceanCanvas | 1 |

### 2.3 Hardcoded Strings Found

#### CRITICAL - Admin Components (French)

**`app/admin/bookings/admin-bookings-client.tsx`**:
- Line 67-75: STATUS_CONFIG labels hardcodés en français
- Line 136-138: "Inconnu"
- Line 160: "Retour au dashboard"
- Line 162: "Gestion des réservations"
- Line 164: "réservations au total"
- Line 180: "Revenu total"
- Line 212: "Tous les statuts"
- Line 230: "Aucune réservation trouvée"
- Line 270: "participant(s)"
- Line 280: "Client:"
- Line 349: "Page X sur Y"

**`app/admin/users/admin-users-client.tsx`**:
- Line 127: "Retour au dashboard"
- Line 129: "Gestion des utilisateurs"
- Line 131: "utilisateurs au total"
- Line 141: "Rechercher par email, nom..."
- Line 158-160: Options de rôle en français
- Line 174: "Aucun utilisateur trouvé"
- Line 214: "Blacklisté"
- Line 219: "Inactif"
- Line 240: "centre(s)"
- Line 243-244: "réservations", "avis"
- Line 264: "Rétrograder"/"Promouvoir admin"
- Line 282: "Désactiver"/"Activer"
- Line 300: "Retirer de la blacklist"/"Blacklister"
- Line 312: "Détails"
- Line 327: "Page X sur Y"

**`app/admin/users/[id]/admin-user-detail-client.tsx`**:
- ~49 strings hardcodées

**`app/admin/bookings/[id]/admin-booking-detail-client.tsx`**:
- ~42 strings hardcodées

**`app/center/manage/[slug]/team/team-manage-client.tsx`**:
- Line 254: "Aucun membre dans l'équipe"
- Line 396: "Nom *"
- Line 437: "Bio"
- Line 504: "Membre principal"
- Line 513: "Membre actif"

**`components/effects/ocean-canvas.tsx`**:
- Line 1336: "WhytCard" (marque)

**`app/center/manage/[slug]/services/[serviceId]/edit-service-form.tsx`**:
- Multiple labels hardcodés

**`app/admin/centers/[id]/admin-center-detail-client.tsx`**:
- ~27 strings hardcodées

---

## PHASE 3: FIX PRIORITY

### P0 - CRITIQUE (Bloquant)
1. ⬜ Ajouter 489 clés manquantes dans 9 langues (DE, ES, IT, EL, NL, PT, PL, RU, SV)
2. ⬜ Ajouter generateMetadata aux 18 pages manquantes

### P1 - HIGH
3. ⬜ Remplacer strings hardcodées dans admin components par i18n
4. ⬜ Ajouter JSON-LD Organization et WebSite dans layout.tsx

### P2 - MEDIUM
5. ⬜ Ajouter pages manquantes dans sitemap
6. ⬜ Vérifier meta descriptions (150-160 chars)

---

## ACTIONS REQUISES

### 1. Créer les clés manquantes

Les namespaces suivants doivent être ajoutés/complétés dans DE, ES, IT, EL, NL, PT, PL, RU, SV:
- `onboardCenter` (100 clés)
- `booking` (83 clés)
- `onboardDiver` (50 clés)
- `centerManage` (43 clés)
- `userDashboard` (31 clés)
- `profile` (31 clés)

### 2. Fixer les pages sans metadata

Créer des wrapper files pour les pages 'use client':

```typescript
// app/about/page.tsx (pattern recommandé)
import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import AboutClient from './about-client'; // move current content here

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.about.title'),
    description: t('metadata.about.description'),
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
```

### 3. Ajouter JSON-LD dans layout.tsx

```tsx
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/json-ld';

// Dans le return de RootLayout:
<OrganizationJsonLd
  name={brandName}
  url={baseUrl}
  logo={`${baseUrl}/evidive-logo.png`}
  description={description}
  sameAs={['https://instagram.com/evidive.blue']}
  contactType="customer service"
  supportEmail="support@evidive.com"
/>
<WebsiteJsonLd
  name={brandName}
  url={baseUrl}
  description={description}
/>
```

---

## SCORE PROJETÉ APRÈS FIXES

| Catégorie | Avant | Après | Delta |
|-----------|-------|-------|-------|
| Metadata | 12 | 25 | +13 |
| Open Graph | 10 | 15 | +5 |
| Sitemap | 10 | 10 | 0 |
| Robots | 5 | 5 | 0 |
| Structured Data | 5 | 10 | +5 |
| Strings i18n | 5 | 20 | +15 |
| Translations | 15 | 15 | 0 |
| **TOTAL** | **62** | **100** | **+38** |
