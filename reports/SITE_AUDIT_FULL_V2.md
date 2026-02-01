SITE AUDIT COMPLET - EVIVIVE

Contexte
- Site : https://evidive.whytcard.ai
- Base documentaire utilisée : onboard/PLAN_ONBOARD_COMPLET.md, onboard/LISTE_MANQUANTS.md, onboard/PROMPTS_AGENTS_PARALLELES.md, onboard/pointarevoir.md
- Périmètre : routes App Router existantes + écarts plan vs implémentation
- Locales : fr, en, es, it

Résumé exécutif
- Contrôle HTTP des pages détectées : OK (0 erreur sur routes statiques)
- 16 routes dynamiques non auditées (échantillons manquants)
- Écarts importants entre le plan d’onboarding et le site actuel
- Plusieurs éléments “restent à faire” déjà listés dans LISTE_MANQUANTS

Couverture réelle du site (contrôle HTTP)
- Pages détectées : 31
- Checks effectués : 108
- Échecs HTTP : 0
- Ignorés (routes dynamiques sans échantillon) : 16

Routes dynamiques non auditées
- /fr/center/[slug]
- /fr/onboard/center/[step]
- /fr/onboard/diver/[step]
- /fr/onboard/seller/[step]
- /en/center/[slug]
- /en/onboard/center/[step]
- /en/onboard/diver/[step]
- /en/onboard/seller/[step]
- /es/center/[slug]
- /es/onboard/center/[step]
- /es/onboard/diver/[step]
- /es/onboard/seller/[step]
- /it/center/[slug]
- /it/onboard/center/[step]
- /it/onboard/diver/[step]
- /it/onboard/seller/[step]

Écarts PLAN_ONBOARD_COMPLET.md vs site actuel
- Pages prévues mais absentes côté site : Mes Réservations (Plongeur), Mes Avis (Plongeur), Gestion des Services / Plongées (Centre), Calendrier & Disponibilités (Centre), Gestion Réservations (Centre), Avis Reçus (Centre), Statistiques Centre, Paramètres Centre, Réservation (Booking), Paiement, Commissions, Coupons & Réductions, Configuration Emails, Templates Emails, Paramétrage SMS, Google Calendar, Google Maps, Catégories de plongée, Équipe Centre, Admin Dashboard complet, Avis & Notes global, Notifications In-App, Annulation & Remboursement, Sécurité & Logs, Mot de passe oublié dédié
- Pages présentes sur le site mais non listées dans le plan : about, careers, explorer, contact, legal/privacy, legal/terms, privacy, centers, center/[slug], login, verify-email, dashboard/seller, onboard/seller, sitemap
- Clarifications nécessaires : coexistence de privacy + legal/privacy, périmètre “seller”, pages “documentation” (Base de données, Planning projet, Multilingue)

Synthèse LISTE_MANQUANTS.md (mise à jour 30 janvier 2026)
- Paiement : acompte/dépôt, timeout 15min, rappels paiement
- Google Calendar : OAuth complet, sync bidirectionnel, suppression événement sur annulation
- Auth : OAuth Facebook, blacklist emails système, inscription centre multi-étapes
- Admin : export CSV réservations, actions en masse, gestion blacklist utilisateurs

Synthèse PROMPTS_AGENTS_PARALLELES.md
- Stack cible : Next.js 16, React 19, Tailwind v4, Prisma, Auth.js, Nodemailer
- Exigences techniques : await params, setRequestLocale, useTranslations, Zod partout, cn(), pas de styles inline
- Pages à implémenter et contrôles UX stricts par page

Points à revoir / incohérences
- La liste de pages “à construire” reste plus large que les routes réellement en place
- Plusieurs parcours mentionnent des pages dédiées non créées (forgot-password, booking, coupons, commissions, notifications in-app)
- Incohérence de stack dans PROMPTS_AGENTS_PARALLELES (Prisma/Auth.js/Nodemailer) versus implémentation actuelle si différentes

Recommandations prioritaires
- Fournir des échantillons pour routes dynamiques afin d’auditer l’existant réel
- Geler la liste officielle des pages (plan vs site) et statuer sur les pages hors périmètre
- Valider la stack de référence unique (éviter conflits Prisma/Auth.js vs autres implémentations)
- Mettre à jour PLAN_ONBOARD_COMPLET avec les pages réellement présentes ou à supprimer

Limitations actuelles
- Les audits “deep-workspace-analyzer” et “comprehensive-site-tester” n’ont pas pu être exécutés à cause d’une limite de ressources du moteur. Dès que c’est réactivé, je relance ces deux analyses pour compléter ce rapport.

Prochaines étapes proposées
- Lancer l’audit E2E complet (links, formulaires, images, SEO, a11y, responsive)
- Générer un tableau page-par-page avec statut : existant / manquant / à supprimer
- Produire un plan d’action priorisé avec estimation
