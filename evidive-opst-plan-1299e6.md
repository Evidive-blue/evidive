# Plan de stabilisation EviDive (bugs + Lighthouse)

Ce plan décrit les correctifs minimaux pour stabiliser les routes critiques, l’i18n et les performances afin d’atteindre Lighthouse >90 sans régression.

## Constat & périmètre
- S’appuyer sur PLAN_ONBOARD_COMPLET.md et SITE_AUDIT_FULL_V2.md pour les écarts plan/site et les priorités P0/P1.
- Notes projet manquantes : créer/mettre à jour NOTES_PROJET.md dès le début de l’implémentation.
- Périmètre principal : register + register/center + careers + dashboard/profile/settings + homepage hero/search + onboard.

## Phase 1 — Diagnostic ciblé (read-only)
- Vérifier routes/CTA vers /register/center (i18n Link + locale) et cohérence avec l’onboarding.
- Identifier la cause du crash SSR /careers (baseUrl, i18n, setRequestLocale, metadata).
- Contrôler le blocage d’inscription /register (checkbox terms + validations + états disabled).
- Comprendre les pages vides (dashboard/profile/settings) : auth, data fetch, empty states, redirections.
- Audit i18n : clés manquantes/dupliquées (hero.scroll, search.*) sur toutes locales.
- Parcourir layout/app/root pour fonts, metadata, images et scripts bloquants.

## Phase 2 — Correctifs P0/P1 (sans création de nouvelles pages)
- /register/center : corriger les liens/CTA, valider le flux wizard, ajouter feedback i18n clair.
- /careers : sécuriser metadataBase + fallback, garantir setRequestLocale et traductions complètes.
- /register : rendre la validation explicite (messages d’erreurs) et débloquer l’action si conditions remplies.
- /settings : gérer l’absence de settings (création par défaut ou empty state) au lieu de rediriger à tort.
- /profile : charger les données réelles ou afficher un état “profil incomplet” avec actions claires.
- /dashboard : s’assurer que les requêtes Prisma ne cassent pas si données manquantes.
- Homepage search : éliminer “undefined” + brancher le CTA vers /centers ou /explorer avec query params.

## Phase 3 — Performance & qualité
- Retirer typescript.ignoreBuildErrors après correction des erreurs TS.
- Vérifier images via next/image + remotePatterns et corriger les tailles pour éviter CLS.
- Vérifier fonts via next/font (self-host) et éviter chargements externes.
- Lazy-load les composants lourds (globe, animations) hors viewport.
- Repasser ESLint/TypeScript et éliminer warnings.

## Phase 4 — Validation
- Lint + build + logs Vercel propres.
- Test fonctionnel des pages clés + formulaires.
- Lighthouse (mobile + desktop) > 90 (perf, a11y, best practices, SEO).

## Questions à valider
- Confirmer la route cible pour le CTA “Join EviDive” (onboard vs register/center).
- Autoriser la création automatique d’un profil/settings par défaut si absent ?
- Priorité des locales (FR/EN/ES/IT seulement ou toutes) pour l’i18n ?
