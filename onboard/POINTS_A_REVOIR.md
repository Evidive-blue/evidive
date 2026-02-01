# 📋 Points à Revoir — Tous les Agents

> **Généré le**: 31 janvier 2026  
> **Projet**: EviDive  
> **Agents exécutés**: 12/40

---

## 🔐 AUTHENTIFICATION

### Agent 01 — Création de compte Plongeur

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Page verify-email incomplète** : Affiche seulement "vérifiez votre boîte mail" mais NE GÈRE PAS la vérification du token. Implémenter : lire token en query param, vérifier en BDD, marquer `emailVerified=true` |
| 🔴 HIGH | **Migration Prisma requise** : Le modèle `EmailVerificationToken` ajouté au schema. Exécuter `npx prisma migrate dev --name add_email_verification_token` puis `npx prisma generate` |
| 🟠 MED | **Auto-login doublon** : Tenté à la fois dans `actions.ts` ET dans `RegisterForm.tsx`. Recommandation : supprimer le signIn dans actions.ts, garder uniquement côté client |
| 🟡 LOW | **OAuth Google toujours configuré** : Bien masqué mais provider Google reste dans `/src/lib/auth.ts`. Risque si exposé |
| 🟠 MED | **Resend email placeholder** : Le bouton "Renvoyer l'email" est un setTimeout, pas d'appel serveur réel. Créer `resendVerificationEmail(email)` |
| 🟡 LOW | **Redirection post-inscription** : Actuellement vers `/dashboard`, mais email non vérifié. Considérer `/verify-email?email=...` |
| 🟡 LOW | **Variables d'environnement** : Vérifier `NEXT_PUBLIC_BASE_URL`, `SMTP_*` sont configurées |
| ✅ OK | **PasswordStrengthIndicator** : Existe déjà dans `/src/components/ui/` |
| 🟡 LOW | **Lien mot de passe oublié** : Pointe vers `/forgot-password` dans RegisterForm mais fichier original pointait vers `/reset-password`. Vérifier quelle route est correcte |

---

### Agent 02 — Connexion Plongeur

| Priorité | Point |
|----------|-------|
| 🟠 MED | **"Se souvenir de moi" cosmétique** : Session toujours 30 jours. Implémenter passage dynamique du `maxAge` selon la checkbox |
| 🟡 LOW | **Page forgot-password inconsistante** : Utilise `useParams()` côté client. Peut être refactoré comme login pour cohérence |
| ✅ OK | **SELLER dans redirection** : Code gère déjà le cas SELLER → /seller |

---

### Agent 05 — Inscription Centre de plongée

| Priorité | Point |
|----------|-------|
| 🟠 MED | **Prisma Schema** : Vérifier si `companyName` et `siretOrVat` existent dans DiveCenter, sinon les ajouter |
| 🟡 LOW | **Certifications** : Stockées en array string, pas de validation DB-level des valeurs |
| 🟠 MED | **Geocoding automatique** : Lat/lng demandés manuellement. Intégrer API Google Maps/Nominatim pour améliorer UX |
| 🟡 LOW | **Upload documents** : Étape documents du wizard existant non utilisée (était prévu post-validation) |
| 🟡 LOW | **Email templates** : HTML inline basique. Créer templates dans dossier dédié |
| 🟠 MED | **Double inscription** : Un user peut s'inscrire plongeur puis centre avec même email. La logique bloque — confirmer si comportement souhaité ou permettre upgrade |
| 🟡 LOW | **Tests manquants** : Aucun test unitaire/intégration pour server actions et validations Zod |

---

## 👤 ESPACE PLONGEUR

### Agent 07 — Dashboard Plongeur

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Routes manquantes** : `/bookings`, `/bookings/{id}`, `/reviews`, `/reviews/new` n'existent pas encore |
| 🟠 MED | **Filtre `/bookings?filter=completed`** : À implémenter |
| 🟡 LOW | **Route `/search` vs `/explorer`** : La tâche mentionne `/search` mais `/explorer` existe. Clarifier |
| 🟠 MED | **Traductions manquantes** : `de.json`, `es.json`, `it.json` pas mises à jour pour dashboard |
| 🟡 LOW | **Dashboard existant** : `/dashboard/page.tsx` existe déjà. Clarifier si `/app/page.tsx` doit le remplacer ou coexister |
| 🟡 LOW | **RecentHistory** : Affiche centre mais pas nom du service (différent de UpcomingDives) |
| 🟡 LOW | **generateStaticParams manquant** : Pour SSG des locales |

---

### Agent 08 — Réservations Plongeur

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Action annulation non implémentée** : Bouton présent mais pas de server action. Créer `/src/app/[locale]/bookings/[id]/actions.ts` |
| 🔴 HIGH | **Page "Laisser un avis" manquante** : Lien vers `/bookings/{id}/review` mais page inexistante |
| 🟠 MED | **Règles annulation simplifiées** : 48h codé en dur. Devrait provenir de `DiveCenter.cancellationPolicy` |
| 🟠 MED | **Remboursement Stripe** : Pas de gestion des refunds en cas d'annulation |
| 🟠 MED | **Pagination manquante** : Pour utilisateurs avec beaucoup de réservations |
| 🟡 LOW | **Renvoyer email confirmation** : Pas de système depuis page détails |
| 🟡 LOW | **Type Decimal Prisma** : Vérifier conversions `Number(booking.totalPrice)` avec grands montants |
| 🟡 LOW | **Tests manquants** : Aucun test unitaire/e2e |
| 🟡 LOW | **Accessibilité** : Ajouter `aria-label` sur boutons d'action, vérifier contraste badges |

---

### Agent 09 — Avis Plongeur

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Upload photos placeholder** : Utilise `prompt()` pour URLs. Implémenter vrai upload (Vercel Blob, Cloudinary) |
| 🟠 MED | **Champs diveDate/serviceUsed** : Vérifier qu'ils sont remplis lors création |
| 🟠 MED | **Mise à jour stats centre** : Quand avis approuvé, mettre à jour `rating` et `reviewCount` — à faire côté modération admin |
| 🟠 MED | **date-fns** : Vérifier que le package est installé |
| 🟠 MED | **remotePatterns** : Configurer dans `next.config.ts` pour images externes |
| 🟡 LOW | **Pagination** : Non implémentée si beaucoup d'avis |
| 🟡 LOW | **Réponse centre** : Champ `centerResponse` existe mais affichage non implémenté |

---

### Agent 10 — Paramètres Plongeur

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Migration Prisma** : Champ `profileVisibleToCenters` ajouté au schema. Exécuter `npx prisma migrate dev` |
| 🟠 MED | **Locale "de"** : Fichier `de.json` existe mais "de" pas dans `/src/i18n/config.ts`. Ajouter si activation allemand |
| 🟠 MED | **Erreurs TypeScript préexistantes** : Dans bookings, reviews, center... Non liées à cette implémentation |
| 🟡 LOW | **Toast notification** : Implémenté avec `framer-motion`. Pour robustesse, utiliser `sonner` ou `react-hot-toast` |
| 🟡 LOW | **Debounce** : Non explicite car `useTransition` gère. Si besoin de vrai debounce 500ms, l'ajouter |
| 🟡 LOW | **Sessions Auth.js** : Après suppression compte, JWT reste valide jusqu'à expiration mais middleware bloque car `isActive=false` |

---

## 🏢 ESPACE CENTRE

### Agent 11 — Dashboard Centre

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Pages manquantes** : `/center/services/new`, `/center/calendar`, `/center/bookings`, `/center/settings`, `/center/reviews`, `/center/reviews/[id]/respond` |
| 🟠 MED | **Erreurs TypeScript préexistantes** : Dans actions/settings.ts, app/page.tsx, bookings, forgot-password... |
| 🟠 MED | **Envoi d'emails** : TODOs dans `center-bookings.ts` pour emails confirmation/refus non implémentés |
| 🟠 MED | **Types Prisma** : Relations `include` mal inférées, casts explicites nécessaires |
| 🟡 LOW | **Conflit routes** : `/dashboard/center/page.tsx` (liste centres) vs `/center/page.tsx` (dashboard d'un centre). Considérer `/center/[centerId]/dashboard` |

---

### Agent 12 — Profil Centre

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Google Maps API Key** : `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` requis. Sans clé, fallback avec coordonnées + lien |
| 🔴 HIGH | **Stripe Onboarding** : Route `/api/stripe/connect` n'existe pas. Créer pour onboarding Stripe Connect |
| 🟠 MED | **Modules UI manquants** : `textarea`, `badge`, `label`, `switch`, `alert-dialog`, `select`. Ajouter composants Shadcn/ui |
| 🟠 MED | **Validation shortDescription** : Limite 160 chars non implémentée dans schéma Zod |
| 🟡 LOW | **OpeningHoursEditor** : Inline dans le formulaire, pas composant séparé. Fonctionnel mais pourrait être extrait |
| 🟡 LOW | **Upload images** : Data URLs (base64) pour preview. Implémenter upload vers storage cloud en production |

---

### Agent 13 — Gestion Services Centre

| Priorité | Point |
|----------|-------|
| 🟠 MED | **Upload images** : `MultipleImageUploader` utilise Data URLs. Implémenter upload cloud |
| 🟠 MED | **Traductions manquantes** : `AvailabilityEditor` a textes en dur en français |
| 🟠 MED | **Validation côté client** : Pas d'erreurs avant soumission. Intégrer `react-hook-form` + `zod` |
| 🟠 MED | **Catégories vides** : Si aucune catégorie en base, sélecteur vide. Ajouter seed ou création par défaut |
| 🟠 MED | **Photos existantes** : Mélange URLs existantes et base64 nouvelles. Uniformiser |
| 🟡 LOW | **Permissions ADMIN** : Admin peut modifier n'importe quel centre. Vérifier si super admin ou modérateur |
| 🟡 LOW | **Suppression cascade** : Vérifier si `BookingExtra` référence un `ServiceExtra` avant suppression |

---

### Agent 14 — Calendrier Centre

| Priorité | Point |
|----------|-------|
| 🟠 MED | **Refresh après action** : `revalidatePath` utilisé mais UI ne rafraîchit pas auto. Ajouter `useRouter().refresh()` ou state optimiste |
| 🟠 MED | **Capacité dynamique** : Estimation moyenne pour jours sans réservation. Affiner selon horaires d'ouverture |
| 🟠 MED | **Pas de validation conflit** : Réservation manuelle sans vérification si slot bloqué ou capacité max atteinte |
| 🟡 LOW | **Google Calendar sync** : Champ `gcalEventId` existe mais intégration non implémentée |
| 🟡 LOW | **Notifications** : Actions ne créent pas de notifications in-app lors blocage/déblocage |

---

### Agent 15 — Réservations Centre

| Priorité | Point |
|----------|-------|
| 🔴 HIGH | **Envoi d'emails** : TODOs pour envoi emails confirmation/annulation non implémentés. Intégrer SendGrid/Resend |
| 🟠 MED | **Google Calendar sync** : Champs existent mais non utilisés dans actions |
| 🟠 MED | **Relation worker** : Assignation instructeur possible mais non exposée dans interface réservation manuelle |
| 🟠 MED | **Commission automatique** : Pas de création Commission lors réservation manuelle |
| 🟠 MED | **Page détails annulation** : `booking-details-actions.tsx` utilise action directe sans modal motif. Harmoniser avec `CenterBookingCard` |
| 🟠 MED | **Historique statuts** : Spec mentionne "Historique statuts" mais pas de table `BookingStatusHistory`. Timestamps limités |
| 🟡 LOW | **Export CSV** : Fonctionne mais pourrait inclure plus de colonnes (commission, extras) |
| 🟡 LOW | **Rate limiting** : `/src/lib/rate-limit.ts` existe mais non utilisé dans actions réservation |

---

## 📊 RÉCAPITULATIF GLOBAL

### Migrations Prisma requises
```bash
# À exécuter dans l'ordre
npx prisma migrate dev --name add_email_verification_token
npx prisma migrate dev --name add_profile_visible_to_centers
npx prisma generate
```

### Variables d'environnement à vérifier
```env
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Packages à installer/vérifier
```bash
npm install date-fns
# Composants Shadcn/ui manquants
npx shadcn@latest add textarea badge label switch alert-dialog select
```

### Pages manquantes à créer
- [ ] `/verify-email` - Logique de vérification token
- [ ] `/bookings/[id]/review` - Formulaire avis
- [ ] `/center/services/new` - Création service
- [ ] `/center/calendar` - Calendrier
- [ ] `/center/bookings` - Liste réservations
- [ ] `/center/settings` - Paramètres centre
- [ ] `/center/reviews` - Avis reçus
- [ ] `/center/reviews/[id]/respond` - Répondre à un avis
- [ ] `/api/stripe/connect` - Onboarding Stripe Connect

### Priorités
| Niveau | Count | Description |
|--------|-------|-------------|
| 🔴 HIGH | 12 | Bloquants ou fonctionnalités cassées |
| 🟠 MED | 35 | Améliorations importantes |
| 🟡 LOW | 25 | Nice-to-have, polish |
| ✅ OK | 3 | Déjà résolu |

---

## ⏳ AGENTS RESTANTS À LANCER

- [ ] Agent 16 — Avis Centre
- [ ] Agent 17 — Statistiques Centre
- [ ] Agent 18 — Paramètres Centre
- [ ] Agent 19 — Équipe Centre (Workers)
- [ ] Agent 20 — Flow Réservation (Booking)
- [ ] Agent 21 — Paiement Stripe
- [ ] Agent 22 — Commissions
- [ ] Agent 23 — Coupons
- [ ] Agent 24 — Annulation & Remboursement
- [ ] Agent 25 — Config Emails
- [ ] Agent 26 — Templates Emails
- [ ] Agent 27 — Config SMS
- [ ] Agent 28 — Google Calendar
- [ ] Agent 29 — Google Maps
- [ ] Agent 30 — Catégories
- [ ] Agent 31 — CGV
- [ ] Agent 32 — i18n
- [ ] Agent 33 — Admin Dashboard
- [ ] Agent 34 — Gestion Users Admin
- [ ] Agent 35 — Gestion Centres Admin
- [ ] Agent 36 — Modération Avis
- [ ] Agent 37 — Notifications In-App
- [ ] Agent 38 — Sécurité & Logs
- [ ] Agent 39 — Base de données
- [ ] Agent 40 — Planning

---

## 🧪 TESTS PLAYWRIGHT — 31 janvier 2026

### Bugs corrigés pendant les tests

| Fichier | Problème | Solution |
|---------|----------|----------|
| `CancelBookingModal.tsx` | Import Dialog de `drawer` au lieu de `dialog` | ✅ Corrigé |
| `ManualBookingForm.tsx` | Import Dialog de `drawer` au lieu de `dialog` | ✅ Corrigé |

### Composants Shadcn/ui installés

```bash
npx shadcn@latest add alert-dialog badge
```

### Dépendances installées

```bash
pnpm add react-hook-form @hookform/resolvers
```

### Bugs découverts non corrigés

| Priorité | Page | Problème |
|----------|------|----------|
| 🔴 HIGH | `/dashboard/center` | **Traductions i18n non chargées** — affiche clés brutes (ex: `dashboard.center.title`). Le namespace `dashboard.center.*` semble manquant dans les fichiers JSON |
| 🟠 MED | `/center/services` | **URL double locale** — Lien "Nouveau service" pointe vers `/fr/fr/center/services/new` au lieu de `/fr/center/services/new` |
| 🟡 LOW | Toutes pages | **Hydration warnings** — Attributs différents entre SSR et client (SVG transform) |

### Pages testées et fonctionnelles ✅

- [x] `/` — Page d'accueil
- [x] `/login` — Connexion
- [x] `/register` — Inscription plongeur
- [x] `/register/center` — Inscription centre (wizard 4 étapes)
- [x] `/center` — Dashboard centre
- [x] `/center/services` — Liste des services
- [x] `/center/calendar` — Calendrier
- [x] `/center/bookings` — Liste des réservations

### Pages avec erreurs ❌

- [ ] `/dashboard/center` — Traductions manquantes

### Screenshots sauvegardés

- `homepage.png` — Page d'accueil
- `login.png` — Connexion
- `register.png` — Inscription
- `register-center.png` — Wizard inscription centre
- `center-dashboard-ok.png` — Dashboard centre
- `dashboard-center-i18n-error.png` — Bug traductions
- `services-list.png` — Liste services
- `calendar.png` — Calendrier
- `bookings.png` — Réservations

---

*Document généré automatiquement - Mise à jour après chaque batch d'agents et tests Playwright*
