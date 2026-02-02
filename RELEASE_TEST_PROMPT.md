# EviDive - Prompt de Test Complet pour Release

## Contexte du Projet

Tu es un agent de test QA pour la plateforme **EviDive**, une marketplace de plongée sous-marine permettant aux plongeurs de réserver des activités auprès de centres de plongée.

**Stack technique:**
- Next.js 16.1.6 avec App Router et Turbopack
- React 19 avec React Compiler
- Prisma ORM avec PostgreSQL (via Prisma Accelerate)
- NextAuth 5.0 (Auth.js) pour l'authentification
- Tailwind CSS v4
- next-intl pour l'internationalisation (FR, EN, ES, IT)
- Stripe Connect pour les paiements

**URL de test:** http://localhost:3002 (dev) ou https://evidive.whytcard.ai (prod)

---

## Utilisateurs de Test Disponibles

| Email | Type | Mot de passe | Centre associé |
|-------|------|--------------|----------------|
| jerome.ethenoz@gmail.com | ADMIN | (à définir) | - |
| armando.romano@bluewin.ch | ADMIN | (à définir) | - |
| paul.center@test.com | CENTER_OWNER | (à définir) | centre-plong-e-test-cml0ga |
| marjorie.ferreira@outlook.com | CENTER_OWNER | (à définir) | marjo-diving-club-cml4cv |
| test@example.com | DIVER | (à définir) | - |
| mathieu.lespece@gmail.com | DIVER | (à définir) | - |

**Note:** Si les mots de passe ne fonctionnent pas, crée de nouveaux utilisateurs de test.

---

## PHASE 1: Tests d'Accès et Navigation (Sans Login)

### 1.1 Pages Publiques
Vérifie que ces pages sont accessibles SANS authentification:

| Page | URL | Éléments à vérifier |
|------|-----|---------------------|
| Accueil | `/fr` | Hero section, logo, CTA, search bar, footer |
| À propos | `/fr/about` | Contenu statique, navigation |
| Contact | `/fr/contact` | Formulaire de contact fonctionnel |
| Centres (liste) | `/fr/centers` | Liste des centres, carte, filtres |
| Centre (détail) | `/fr/center/centre-plong-e-test-cml0ga` | Infos centre, services, avis, bouton réservation |
| CGV | `/fr/conditions-generales` | Contenu légal |
| Confidentialité | `/fr/privacy` | Contenu légal |
| Connexion | `/fr/login` | Formulaire email/password, bouton Google |
| Inscription | `/fr/register` | Choix du type (plongeur, vendeur, centre) |
| Mot de passe oublié | `/fr/forgot-password` | Formulaire email |

### 1.2 Redirections Protégées
Vérifie que ces pages REDIRIGENT vers `/login` sans authentification:

- `/fr/dashboard`
- `/fr/profile`
- `/fr/settings`
- `/fr/bookings`
- `/fr/reviews`
- `/fr/center`
- `/fr/admin`

### 1.3 Navigation Multilingue
Teste le changement de langue:
1. Va sur `/fr`
2. Change en anglais → vérifie URL `/en` et contenu traduit
3. Change en espagnol → vérifie URL `/es`
4. Change en italien → vérifie URL `/it`

---

## PHASE 2: Tests d'Authentification

### 2.1 Inscription Plongeur
1. Va sur `/fr/register`
2. Clique "Plongeur"
3. Remplis le formulaire:
   - Prénom: "Test"
   - Nom: "Plongeur"
   - Email: `test.diver.{timestamp}@example.com`
   - Mot de passe: "Test123!@#" (doit passer la validation)
   - Confirme le mot de passe
4. Soumets
5. **Attendu:** Message de confirmation, email de vérification envoyé
6. **Vérifie:** L'utilisateur NE peut PAS se connecter avant vérification

### 2.2 Inscription Centre (6 étapes)
1. Va sur `/fr/register/center`
2. **Étape 1 - Infos personnelles:**
   - Nom complet: "Test Owner"
   - Email: `test.center.{timestamp}@example.com`
   - Téléphone: "+33612345678"
   - Mot de passe: "Test123!@#"
3. **Étape 2 - Infos centre:**
   - Nom (FR): "Centre Test {timestamp}"
   - Nom (EN): "Test Center {timestamp}"
   - Description (FR): "Centre de plongée de test pour validation" (min 20 chars)
   - Description (EN): "Test dive center for validation"
4. **Étape 3 - Localisation:**
   - Adresse: "123 Rue de la Mer"
   - Ville: "Nice"
   - Code postal: "06000"
   - Pays: "France"
   - Coordonnées: sélectionne sur la carte
5. **Étape 4 - Documents:**
   - Upload licence (ou skip si optionnel)
6. **Étape 5 - Paiements:**
   - Note la possibilité de connecter Stripe (peut être skipé en test)
7. **Étape 6 - Confirmation:**
   - Vérifie le récapitulatif
   - Accepte les conditions
   - Soumets
8. **Attendu:** Page de succès, centre en statut "PENDING"

### 2.3 Connexion Email/Password
1. Va sur `/fr/login`
2. Entre les identifiants d'un utilisateur existant
3. Coche "Se souvenir de moi"
4. Soumets
5. **Attendu:** Redirection vers dashboard approprié selon le type

### 2.4 Connexion Google OAuth
1. Va sur `/fr/login`
2. Clique "Connexion avec Google"
3. Complète le flow OAuth
4. **Attendu:** Compte créé (si nouveau) ou connexion (si existant)

### 2.5 Réinitialisation Mot de Passe
1. Va sur `/fr/forgot-password`
2. Entre un email existant
3. Soumets
4. **Attendu:** Message "Email envoyé"
5. Vérifie l'email (ou la base de données pour le token)
6. Accède à `/fr/reset-password?token={token}`
7. Entre un nouveau mot de passe
8. **Attendu:** Succès, redirection vers login

### 2.6 Déconnexion
1. Connecte-toi avec n'importe quel compte
2. Clique sur l'avatar → "Se déconnecter"
3. **Attendu:** Session supprimée, redirection vers accueil

---

## PHASE 3: Tests Utilisateur DIVER

Connecte-toi avec un compte DIVER.

### 3.1 Dashboard Plongeur
- URL: `/fr/dashboard`
- Vérifie: Stats, prochaines plongées, historique récent

### 3.2 Profil
- URL: `/fr/profile`
- **Tests:**
  - Modifier le prénom/nom
  - Modifier le niveau de certification
  - Modifier l'organisation (PADI, SSI, etc.)
  - Modifier le nombre de plongées
  - Upload avatar
  - Sauvegarder → message de succès

### 3.3 Explorer les Centres
- URL: `/fr/explorer` ou `/fr/centers`
- **Tests:**
  - Filtrer par localisation
  - Filtrer par type d'activité
  - Trier par prix/note
  - Vue carte vs liste
  - Cliquer sur un centre → page détail

### 3.4 Réservation (Flow Complet)
1. Va sur `/fr/center/centre-plong-e-test-cml0ga`
2. Sélectionne un service
3. Choisis une date (future)
4. Choisis un créneau horaire
5. Sélectionne le nombre de participants
6. Ajoute des extras (si disponibles)
7. Vérifie le prix total
8. Confirme la réservation
9. **Attendu:** Booking créé en statut "PENDING"
10. Vérifie sur `/fr/bookings` que la réservation apparaît

### 3.5 Gestion des Réservations
- URL: `/fr/bookings`
- **Tests:**
  - Filtrer par statut (En attente, Confirmé, Complété, Annulé)
  - Voir les détails d'une réservation
  - Annuler une réservation PENDING
  - **Attendu après annulation:** Statut "CANCELLED"

### 3.6 Avis
- URL: `/fr/reviews`
- **Tests avec une réservation COMPLETED:**
  1. Clique "Laisser un avis"
  2. Sélectionne une note (1-5 étoiles)
  3. Écris un commentaire (min 20 chars)
  4. Upload une photo (optionnel)
  5. Soumets
  6. **Attendu:** Avis créé en statut "PENDING" (modération)
- **Tests de modification:**
  - Modifier un avis existant
  - Supprimer un avis

### 3.7 Paramètres
- URL: `/fr/settings`
- **Tests:**
  - Activer/désactiver notifications email
  - Activer/désactiver notifications SMS
  - Modifier la langue préférée
  - Modifier les paramètres de confidentialité
  - Exporter mes données → télécharge JSON
  - Supprimer mon compte → modal de confirmation

---

## PHASE 4: Tests CENTER_OWNER

Connecte-toi avec un compte CENTER_OWNER ayant un centre APPROVED.

### 4.1 Dashboard Centre
- URL: `/fr/center` → redirige vers `/fr/center/manage/{slug}`
- **Vérifie:**
  - Stats du jour/semaine/mois
  - Réservations en attente (widget)
  - Avis récents (widget)
  - Aperçu calendrier
  - Actions rapides

### 4.2 Gestion des Réservations
- URL: `/fr/center/manage/{slug}/bookings`
- **Tests:**
  - Voir toutes les réservations
  - Filtrer par statut
  - Filtrer par date
  - Filtrer par service
  - Rechercher par nom/email client

#### 4.2.1 Confirmer une Réservation
1. Trouve une réservation PENDING
2. Clique "Confirmer"
3. **Attendu:** Statut passe à "CONFIRMED"

#### 4.2.2 Rejeter une Réservation
1. Trouve une réservation PENDING
2. Clique "Rejeter"
3. Entre une raison
4. **Attendu:** Statut passe à "CANCELLED", raison enregistrée

#### 4.2.3 Marquer comme Complétée
1. Trouve une réservation CONFIRMED avec date passée
2. Clique "Marquer comme complétée"
3. **Attendu:** Statut passe à "COMPLETED"

#### 4.2.4 Créer une Réservation Manuelle
1. Clique "Nouvelle réservation"
2. Sélectionne un service
3. Choisis date et heure
4. Entre les infos client (guest)
5. Soumets
6. **Attendu:** Réservation créée

#### 4.2.5 Export CSV
1. Applique des filtres
2. Clique "Exporter CSV"
3. **Attendu:** Fichier téléchargé avec les données filtrées

### 4.3 Gestion des Services
- URL: `/fr/center/manage/{slug}/services` ou `/fr/center/services`

#### 4.3.1 Créer un Service
1. Clique "Nouveau service"
2. Remplis:
   - Nom (FR): "Baptême de plongée"
   - Nom (EN): "Discovery dive"
   - Description (FR/EN)
   - Prix: 75 EUR
   - Durée: 120 minutes
   - Participants min/max: 1/6
   - Certification requise: Aucune
   - Équipement inclus: Oui
   - Jours disponibles: Lun-Sam
   - Créneaux: 09:00, 14:00
3. Ajoute un extra:
   - Nom: "Photos sous-marines"
   - Prix: 25 EUR
   - Par personne: Oui
4. Sauvegarde
5. **Attendu:** Service créé et visible dans la liste

#### 4.3.2 Modifier un Service
1. Clique sur "Modifier" d'un service
2. Change le prix
3. Sauvegarde
4. **Attendu:** Prix mis à jour

#### 4.3.3 Archiver/Réactiver
1. Archive un service
2. **Attendu:** Badge "Archivé", non visible côté client
3. Réactive le service
4. **Attendu:** Badge "Actif" restauré

#### 4.3.4 Dupliquer
1. Duplique un service
2. **Attendu:** Nouveau service créé avec "(copie)" dans le nom

#### 4.3.5 Supprimer
1. Supprime un service sans réservations
2. **Attendu:** Service supprimé définitivement

### 4.4 Gestion des Avis
- URL: `/fr/center/manage/{slug}/reviews` ou `/fr/center/reviews`
- **Tests:**
  - Voir tous les avis approuvés
  - Voir la distribution des notes
  - Répondre à un avis
  - Vérifier que la réponse s'affiche

### 4.5 Calendrier
- URL: `/fr/center/calendar`
- **Tests:**
  - Navigation semaine/mois
  - Bloquer une date (vacances)
  - Bloquer un créneau spécifique
  - Débloquer une date
  - Vérifier les slots affichés

### 4.6 Équipe
- URL: `/fr/center/team`
- **Tests:**
  - Ajouter un membre:
    - Nom, email, téléphone
    - Certifications
    - Langues parlées
    - Horaires de travail
  - Modifier un membre
  - Désactiver/Réactiver
  - Supprimer un membre

### 4.7 Profil du Centre
- URL: `/fr/center/profile`
- **Tests par section:**
  - **Identité:** Logo, bannière, photos galerie
  - **Description:** Bio, site web, réseaux sociaux
  - **Contact:** Email, téléphone, adresse
  - **Pratique:** Certifications, équipement, langues
  - **Engagement:** Éco-responsabilité
  - **Localisation:** Adresse, coordonnées GPS
  - **Paiements:** Méthodes acceptées, IBAN

### 4.8 Statistiques
- URL: `/fr/center/stats`
- **Tests:**
  - Sélectionner période (semaine, mois, année)
  - Vérifier graphiques de réservations
  - Vérifier graphiques de revenus
  - Vérifier top services
  - Vérifier évolution des avis

### 4.9 Paramètres Centre
- URL: `/fr/center/settings`
- **Tests:**
  - Modifier notifications (email/SMS sur réservation, avis)
  - Modifier politique d'annulation (Flexible/Modérée/Stricte)
  - Modifier IBAN pour les paiements
  - Désactiver temporairement le centre
  - Réactiver le centre
  - Supprimer le centre (avec confirmation)

---

## PHASE 5: Tests ADMIN

Connecte-toi avec un compte ADMIN.

### 5.1 Dashboard Admin
- URL: `/fr/admin`
- **Vérifie:**
  - Stats globales (utilisateurs, centres, réservations, revenus)
  - Alertes (centres en attente, avis à modérer)
  - Activité récente

### 5.2 Gestion des Utilisateurs
- URL: `/fr/admin/users`
- **Tests:**
  - Liste paginée des utilisateurs
  - Filtrer par type (DIVER, SELLER, CENTER_OWNER, ADMIN)
  - Rechercher par email/nom
  - Modifier le type d'un utilisateur
  - Désactiver un utilisateur (isActive = false)
  - Blacklister un utilisateur
  - Supprimer un utilisateur

### 5.3 Gestion des Centres
- URL: `/fr/admin/centers`
- **Tests:**
  - Liste des centres avec filtres (PENDING, APPROVED, REJECTED)
  - Voir les détails d'un centre
  - **Approuver un centre PENDING:**
    1. Trouve un centre en attente
    2. Clique "Approuver"
    3. **Attendu:** Statut → APPROVED, email envoyé au propriétaire
  - **Rejeter un centre:**
    1. Clique "Rejeter"
    2. Entre une raison
    3. **Attendu:** Statut → REJECTED, email envoyé

### 5.4 Gestion des Réservations (Global)
- URL: `/fr/admin/bookings`
- **Tests:**
  - Voir TOUTES les réservations de la plateforme
  - Filtrer par statut, centre, date
  - Modifier le statut d'une réservation
  - Voir les détails complets

### 5.5 Modération des Avis
- URL: `/fr/admin/reviews`
- **Tests:**
  - Voir les avis PENDING
  - Approuver un avis → statut APPROVED
  - Rejeter un avis → statut REJECTED
  - Marquer comme spam → statut SPAM
  - Voir l'historique des modérations

### 5.6 Commissions
- URL: `/fr/admin/commissions`
- **Tests:**
  - Voir les commissions par statut (PENDING, PAID)
  - Vérifier le calcul (% du montant réservation)
  - Filtrer par centre
  - Voir les détails (montant réservation, commission, montant centre)

---

## PHASE 6: Tests de Validation de Formulaires

### 6.1 Validation Email
- Email vide → erreur
- Email invalide (sans @) → erreur
- Email déjà utilisé (inscription) → erreur

### 6.2 Validation Mot de Passe
- Moins de 8 caractères → erreur
- Sans majuscule → erreur
- Sans minuscule → erreur
- Sans chiffre → erreur
- Confirmation différente → erreur
- Indicateur de force visible

### 6.3 Validation Service
- Prix négatif → erreur
- Durée 0 → erreur
- Min participants > Max participants → erreur
- Nom FR vide → erreur
- Créneaux vides → erreur (ou avertissement)

### 6.4 Validation Avis
- Note non sélectionnée → erreur
- Commentaire < 20 chars → erreur
- Commentaire > 2000 chars → erreur
- Plus de 3 photos → erreur

### 6.5 Validation Réservation
- Date passée → erreur
- Créneau non disponible → erreur
- Participants > max service → erreur
- Email invité invalide → erreur

---

## PHASE 7: Tests Responsifs

Teste sur différentes tailles d'écran:

### 7.1 Mobile (375px)
- Navigation hamburger fonctionnelle
- Formulaires lisibles et utilisables
- Tableaux scrollables horizontalement
- Boutons accessibles au pouce
- Modals en plein écran

### 7.2 Tablette (768px)
- Layout adapté (2 colonnes où approprié)
- Sidebar collapsable
- Cartes en grille responsive

### 7.3 Desktop (1440px+)
- Layout complet
- Sidebar visible
- Tableaux complets

---

## PHASE 8: Tests de Performance et UX

### 8.1 Temps de Chargement
- Page d'accueil < 3s
- Dashboard < 2s
- Liste de réservations < 2s

### 8.2 Feedback Utilisateur
- Loader visible pendant les actions
- Toast de succès/erreur après actions
- États désactivés pendant le traitement
- Skeleton loading sur les listes

### 8.3 Navigation
- Bouton retour fonctionne
- Breadcrumbs corrects
- Liens actifs dans la navigation

---

## PHASE 9: Tests d'Erreur

### 9.1 Erreurs Réseau
- Simuler une déconnexion → message d'erreur approprié
- Retry automatique ou manuel

### 9.2 Erreurs 404
- URL inexistante → page 404 personnalisée
- Centre supprimé → page 404

### 9.3 Erreurs 403
- Accès non autorisé → redirection ou message

### 9.4 Erreurs Serveur
- Vérifier les logs en cas d'erreur 500
- Message utilisateur générique (pas d'infos sensibles)

---

## PHASE 10: Tests de Sécurité (Basiques)

### 10.1 CSRF
- Les formulaires incluent des tokens

### 10.2 XSS
- Tenter d'injecter `<script>alert(1)</script>` dans les champs texte
- **Attendu:** Code échappé, pas d'exécution

### 10.3 Autorisation
- Tenter d'accéder aux ressources d'un autre utilisateur via URL directe
- **Attendu:** Erreur 403 ou redirection

### 10.4 Rate Limiting
- Soumettre le formulaire de login 10+ fois rapidement
- **Attendu:** Blocage temporaire ou CAPTCHA

---

## Rapport de Test

Pour chaque test, note:

```markdown
## [NOM DU TEST]
- **Statut:** ✅ PASS | ❌ FAIL | ⚠️ WARNING
- **URL testée:**
- **Étapes effectuées:**
- **Résultat attendu:**
- **Résultat obtenu:**
- **Screenshot/Video:** (si échec)
- **Bug ID:** (si créé)
```

---

## Critères d'Acceptation Release

### Bloquants (MUST FIX)
- [ ] Authentification fonctionne (login/register/logout)
- [ ] Réservation fonctionne (création, confirmation)
- [ ] Paiement fonctionne (si activé)
- [ ] Pas d'erreurs 500 sur les pages principales
- [ ] Redirections de sécurité fonctionnent

### Importants (SHOULD FIX)
- [ ] Emails transactionnels envoyés
- [ ] Toutes les validations fonctionnent
- [ ] Responsive sur mobile
- [ ] Multilingue FR/EN minimum

### Mineurs (NICE TO FIX)
- [ ] Animations fluides
- [ ] Textes traduits à 100%
- [ ] Performances optimales

---

## Notes Finales

1. **Créer des utilisateurs de test** si les mots de passe existants ne fonctionnent pas
2. **Documenter chaque bug** avec screenshots
3. **Tester les flows complets**, pas juste les pages individuelles
4. **Vérifier la console** pour les erreurs JavaScript
5. **Vérifier les logs serveur** pour les erreurs backend
