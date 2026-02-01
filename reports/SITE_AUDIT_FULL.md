Site Audit EviDive - Rapport complet

Base
- Site audité : https://evidive.whytcard.ai
- Périmètre : routes App Router existantes dans le projet
- Locales testées : fr, en, es, it
- Méthode : contrôle HTTP des pages détectées + bilan des routes dynamiques non échantillonnées

Résumé exécutif
- Statut global : aucune erreur HTTP détectée sur les routes statiques testées
- Couverture : 31 pages détectées, 108 checks effectués
- Routes dynamiques non testées : 16 (manque d’échantillons)

Résultats détaillés
- Pages détectées : 31
- Checks effectués : 108
- Échecs HTTP : 0
- Ignorés (dynamiques sans échantillon) : 16

Routes dynamiques non testées
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

Écarts fonctionnels entre plan et site
- Pages du plan absentes du site : Mes Réservations (Plongeur), Mes Avis (Plongeur), Gestion des Services / Plongées (Centre), Calendrier & Disponibilités (Centre), Gestion Réservations (Centre), Avis Reçus (Centre), Statistiques Centre, Paramètres Centre, Réservation (Booking), Paiement, Commissions, Coupons & Réductions, Configuration Emails, Templates Emails, Paramétrage SMS, Google Calendar, Google Maps, Catégories de plongée, Équipe Centre, Admin Dashboard complet, Avis & Notes global, Notifications In-App, Annulation & Remboursement, Sécurité & Logs, Mot de passe oublié dédié
- Pages du site absentes de la fiche : about, careers, explorer, contact, legal/privacy, legal/terms, privacy, centers, center/[slug], login, verify-email, dashboard/seller, onboard/seller, sitemap
- Points à clarifier : coexistence de privacy et legal/privacy, périmètre “seller”, pages de documentation (Base de données, Planning projet, Multilingue)

Recommandations prioritaires
- Fournir des échantillons pour routes dynamiques afin de valider le rendu réel et les erreurs potentielles
- Valider les pages manquantes du plan et confirmer celles qui ne doivent pas être implémentées
- Aligner les pages présentes mais non documentées dans le plan

Prochaines étapes proposées
- Lancer un audit visuel et accessibilité complet si souhaité
- Étendre le contrôle aux liens internes et formulaires
- Produire une matrice plan-vers-routes avec statut par page
