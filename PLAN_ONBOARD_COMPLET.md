# PLAN ONBOARD COMPLET - EviDive

## EXTRACTION EXHAUSTIVE DES FONCTIONNALITÉS WORDPRESS

Source: `wp-base-settings-EviDive_January_27_2026.json` + `SITE_MAPPING_EVIDIVE_BLUE.md`

---

# 📋 LISTE EXHAUSTIVE DES FONCTIONNALITÉS À IMPLÉMENTER

## 1. AUTHENTIFICATION & COMPTES

### 1.1 Inscription Plongeur (Client)
- [ ] Formulaire inscription avec: email, mot de passe, prénom, nom
- [ ] Vérification email obligatoire (`validation_subject/message`)
- [ ] Auto-login après inscription (`auto_register_login`: yes)
- [ ] Connexion OAuth Google (configuré mais pas activé)
- [ ] Connexion OAuth Facebook (configuré mais pas activé)
- [ ] Page mot de passe oublié
- [ ] Page réinitialisation mot de passe
- [ ] Blacklist emails (`blacklisted` message configuré)

### 1.2 Inscription Centre (Vendor)
- [ ] Formulaire multi-étapes:
  - Prénom (`mv_ask_first_name`: true)
  - Nom (`mv_ask_last_name`: true)
  - Nom d'affichage (`mv_ask_display_name`: true)
  - Téléphone (`mv_ask_phone`: true)
  - Adresse (`mv_ask_address`: true)
  - Ville (`mv_ask_city`: true)
  - Code postal (`mv_ask_zip`: true)
  - Nom entreprise (`mv_ask_company_name`: false - optionnel)
- [ ] Statut "pending" après inscription
- [ ] Email "candidature reçue" (`vendor_pending_subject/message`)
- [ ] Workflow approbation admin (`mv_auto_approve`: auto)
- [ ] Email "candidature approuvée" (`approved_subject/message`)
- [ ] Email "candidature refusée" (`declined_subject/message`)

### 1.3 Gestion Compte
- [ ] Page profil utilisateur (`/mon-profil/[username]/`)
- [ ] Page modifier compte (`/compte/`)
- [ ] Page modifier mot de passe
- [ ] Page notifications
- [ ] Page confidentialité
- [ ] Upload avatar
- [ ] Upload bannière profil
- [ ] Langue préférée (`preferred_language`)

---

## 2. DASHBOARD PLONGEUR

### 2.1 Vue d'ensemble
- [ ] Prochaines réservations
- [ ] Historique récent
- [ ] Actions rapides

### 2.2 Mes Réservations
- [ ] Liste réservations avec filtres par statut:
  - `pending` (en attente)
  - `confirmed` (confirmée)
  - `paid` (payée)
  - `running` (en cours)
  - `completed` (terminée)
  - `removed` (annulée)
- [ ] Détail réservation avec:
  - Référence (`APP_ID`)
  - Service
  - Date/heure
  - Centre (WORKER)
  - Statut paiement
  - Note/demandes spéciales
- [ ] Bouton "Ajouter au calendrier Google" (`gcal_allow_client`: yes)
- [ ] Annulation désactivée (`allow_cancel`: no) - afficher message

### 2.3 Mes Avis
- [ ] Liste avis laissés
- [ ] Possibilité de laisser avis après plongée

### 2.4 Paramètres
- [ ] Notifications email on/off
- [ ] Notifications SMS on/off
- [ ] Langue préférée (FR, EN, ES, IT)

---

## 3. DASHBOARD CENTRE

### 3.1 Vue d'ensemble (Stats)
- [ ] Réservations du jour
- [ ] Réservations en attente de confirmation
- [ ] Revenus du mois
- [ ] Note moyenne
- [ ] Nombre d'avis

### 3.2 Profil Centre
- [ ] Informations de base:
  - Nom (multilingue FR/EN/ES/IT)
  - Description (multilingue)
  - Adresse complète
  - Coordonnées GPS (Google Maps picker)
  - Téléphone, email, site web
  - Réseaux sociaux
- [ ] Photos:
  - Logo
  - Photo de couverture
  - Galerie (max 10)
- [ ] Informations plongée:
  - Certifications (PADI, CMAS, SSI, NAUI...)
  - Langues parlées
  - Location équipement (oui/non)
  - Engagement écologique
- [ ] Modes de paiement acceptés

### 3.3 Gestion Services/Plongées
- [ ] CRUD services avec:
  - Nom (multilingue)
  - Description (multilingue)
  - Catégorie (9 catégories prédéfinies)
  - Prix (`mv_allow_own_price`: fixed)
  - Durée (minimum `min_time`: 60 min)
  - Capacité min/max participants
  - Prérequis certification
  - Âge minimum
  - Profondeur max
  - Équipement inclus
  - Ce qui est inclus (liste)
  - Photos
  - Jours disponibles
  - Heures de début
- [ ] Activer/désactiver service
- [ ] Supprimer service (`allow_worker_delete_service`: if_empty - si pas de réservations)

### 3.4 Calendrier & Disponibilités
- [ ] Vue calendrier mensuel (`app_page_type`: monthly)
- [ ] Horaires de travail par défaut (`wh_starts`: 02:00 à `wh_ends`: 21:00)
- [ ] Horaires par jour de semaine (`allow_worker_wh`: yes)
- [ ] Bloquer dates/créneaux
- [ ] Affichage réservations sur calendrier:
  - Couleur `busy_color`: #dd3333 (occupé)
  - Couleur `free_color`: #0b3d91 (libre)
  - Couleur `has_appointments_color`: #ffa500 (a des RDV)
- [ ] Sync Google Calendar (`gcal_allow_worker`: yes, `gcal_api_mode`: sync)

### 3.5 Gestion Réservations
- [ ] Liste réservations avec:
  - Filtres par statut
  - Filtres par date
  - Recherche par client
- [ ] Actions:
  - Confirmer réservation (`allow_worker_confirm`: yes)
  - Annuler réservation (`allow_worker_cancel`: yes)
  - Modifier réservation (`allow_worker_edit`: yes)
  - Marquer comme terminée
  - Marquer comme no-show
- [ ] Détail réservation:
  - Toutes infos client
  - Historique statuts
  - Paiement
- [ ] Notifications automatiques:
  - Email + SMS à chaque changement
  - Email confirmation centre (`confirmation_message_sms_worker`)
  - Email annulation centre (`cancellation_message_sms_worker`)

### 3.6 Gestion Avis
- [ ] Liste avis reçus
- [ ] Filtrer par note
- [ ] Répondre aux avis
- [ ] Signaler avis inapproprié

### 3.7 Statistiques
- [ ] Vue revenus par période
- [ ] Nombre de réservations
- [ ] Taux de confirmation
- [ ] Taux d'annulation
- [ ] Note moyenne évolution
- [ ] Services les plus réservés

### 3.8 Paramètres Centre
- [ ] Commission rate info (`mv_commission_rate`: 80%)
- [ ] Frais payés par (`mv_fees_paid_by`: website)
- [ ] Paiement Stripe Connect (optionnel, `use-worker-account`: no actuellement)
- [ ] Fuseau horaire (`allow_worker_set_tz`: yes)
- [ ] Notifications email on/off
- [ ] Notifications SMS on/off

---

## 4. SYSTÈME DE RÉSERVATION

### 4.1 Configuration Générale
- [ ] Réservation jusqu'à 365 jours à l'avance (`app_limit`: 365)
- [ ] Réservation minimum 0 jours à l'avance (`app_lower_limit`: 0)
- [ ] Durée minimum 60 min (`min_time`: 60)
- [ ] Paiement obligatoire (`payment_required`: yes)
- [ ] Connexion non obligatoire (`login_required`: no)
- [ ] Confirmation manuelle par centre (`auto_confirm`: no)

### 4.2 Formulaire Réservation
Champs client:
- [ ] Nom complet (`ask_name`: true)
- [ ] Prénom (`ask_first_name`: true)
- [ ] Nom (`ask_last_name`: false - optionnel)
- [ ] Email (`ask_email`: true)
- [ ] Téléphone (`ask_phone`: true)
- [ ] Adresse (`ask_address`: true)
- [ ] Ville (`ask_city`: false - optionnel)
- [ ] Code postal (`ask_zip`: false - optionnel)
- [ ] Note/demandes spéciales (`ask_note`: true)
- [ ] Acceptation CGV (`ask_terms`: no - actuellement désactivé)

### 4.3 Sélection Service
- [ ] Liste services du centre
- [ ] Filtrer par catégorie
- [ ] Afficher prix, durée, description
- [ ] Afficher prérequis

### 4.4 Sélection Date
- [ ] Calendrier mensuel
- [ ] Jours disponibles en vert
- [ ] Jours complets en orange
- [ ] Jours indisponibles grisés
- [ ] Limite 365 jours

### 4.5 Sélection Heure
- [ ] Créneaux disponibles selon:
  - Horaires du centre
  - Horaires du service
  - Réservations existantes
- [ ] Afficher capacité restante

### 4.6 Nombre de Participants
- [ ] Sélecteur PAX
- [ ] Respect min/max du service
- [ ] Calcul prix total automatique

### 4.7 Extras/Options (si activé)
- [ ] Liste options supplémentaires
- [ ] Prix par option
- [ ] Multiplication par PAX (`extra_multiplied_with_pax`: no)
- [ ] Extras requis (`extra_required`: no)

### 4.8 Récapitulatif
- [ ] Service sélectionné
- [ ] Date/heure
- [ ] Nombre participants
- [ ] Prix unitaire
- [ ] Extras
- [ ] Total
- [ ] Coupon de réduction (si applicable)

### 4.9 Liste d'Attente
Si créneau complet:
- [ ] Bouton "S'inscrire sur liste d'attente"
- [ ] Email confirmation liste d'attente (`waiting_list_subject/message`)
- [ ] Email notification place libérée (`waiting_list_notify_subject/message`)

---

## 5. SYSTÈME DE PAIEMENT

### 5.1 Stripe (Principal)
- [ ] Checkout Stripe
- [ ] Clés configurées:
  - `publishable_key`: pk_test_51RdF0MBGJR5rWNCn...
  - `private_key`: sk_test_51RdF0MBGJR5rWNCn...
- [ ] Devise: EUR
- [ ] Webhooks:
  - checkout.session.completed
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded

### 5.2 PayPal (Optionnel, non configuré)
- [ ] Mode sandbox actuellement
- [ ] Non prioritaire

### 5.3 Acompte/Dépôt
- [ ] Pourcentage acompte (`percent_downpayment`: 0 - désactivé)
- [ ] Montant fixe acompte (`fixed_downpayment`: 0 - désactivé)
- [ ] Si activé: paiement partiel puis solde

### 5.4 Timeout Paiement
- [ ] Annulation auto si non payé après 15 min (`clear_time_pending_payment`: 15)

### 5.5 Rappels Paiement Dû
- [ ] Email rappel à 72h, 48h (`dp_reminder_time`: "72,48")
- [ ] Email `dp_reminder_subject/message`

### 5.6 Remboursements
- [ ] Gestion remboursements via Stripe
- [ ] Logging dans DB

---

## 6. SYSTÈME DE COMMISSION

### 6.1 Configuration
- [ ] Taux commission: 80% pour le centre (`mv_commission_rate`: 80)
- [ ] Frais Stripe payés par le site (`mv_fees_paid_by`: website)
- [ ] Commission sur propres ventes: non (`mv_give_commission_own_sales`: no)

### 6.2 Dashboard Admin
- [ ] Vue commissions par centre
- [ ] Vue commissions par période
- [ ] Paiements aux centres (manuel ou Stripe Connect)

---

## 7. COUPONS & RÉDUCTIONS

### 7.1 Gestion Coupons
- [ ] Créer coupon (% ou montant fixe)
- [ ] Date validité
- [ ] Nombre utilisations max
- [ ] Coupon appliqué une seule fois (`apply_coupon_once`: yes)
- [ ] Non applicable aux extras (`apply_coupon_to_extras`: no)

### 7.2 Application Coupon
- [ ] Champ code promo dans formulaire
- [ ] Validation en temps réel
- [ ] Affichage réduction dans récapitulatif

---

## 8. SYSTÈME D'EMAILS

### 8.1 Configuration
- [ ] From: webmaster@evidive.blue
- [ ] From name: Evidive
- [ ] Logging emails (`log_emails`: yes)

### 8.2 Templates Emails Client

| Template | Trigger | Variables |
|----------|---------|-----------|
| `pending` | Nouvelle résa | CLIENT, APP_ID, SERVICE, DATE_TIME, TIMEZONE, EMAIL |
| `confirmation` | Résa confirmée | CLIENT, APP_ID, SERVICE, DATE_TIME, TIMEZONE, WORKER |
| `cancellation` | Résa annulée | CLIENT, APP_ID, SERVICE, DATE_TIME, TIMEZONE |
| `reminder` | 24h avant | CLIENT, APP_ID, SERVICE, DATE_TIME, TIMEZONE, WORKER |
| `completed` | Après plongée | CLIENT, APP_ID, SERVICE, DATE_TIME, CREATED |
| `follow_up` | 30/60/120j après | CLIENT, SERVICE, END_DATE_TIME |
| `dp_reminder` | Paiement dû | CLIENT, APP_ID, SERVICE, DATE_TIME, CREATED |
| `waiting_list` | Ajout liste attente | CLIENT, APP_ID, SERVICE, DATE_TIME |
| `waiting_list_notify` | Place libérée | CLIENT, APP_ID, SERVICE, DATE_TIME, CLAIM |
| `validation` | Activer compte | CLIENT, ACTIVATE |

### 8.3 Templates Emails Centre

| Template | Trigger | Variables |
|----------|---------|-----------|
| `confirmation_worker` | Nouvelle résa | CLIENT, PHONE, SERVICE, DATE_TIME, WORKER |
| `cancellation_worker` | Résa annulée | APP_ID, SERVICE, WORKER, DATE_TIME, CLIENT, PHONE |
| `reminder_worker` | 4h avant | APP_ID, CLIENT, PHONE, DATE_TIME, SERVICE |
| `approved` | Centre approuvé | CLIENT, SITE_NAME |
| `declined` | Centre refusé | CLIENT, SITE_NAME |
| `vendor_pending` | Candidature reçue | CLIENT, SITE_NAME |

### 8.4 Timing Rappels
- [ ] Rappel client: 24h avant (`reminder_time`: 24)
- [ ] Rappel centre: 4h avant (`reminder_time_worker`: 4)
- [ ] Follow-up: 30, 60, 120 jours (`follow_up_time`: "30,60,120")

---

## 9. SYSTÈME SMS (Twilio)

### 9.1 Configuration
- [ ] Numéro: +15005550006 (test)
- [ ] Logging SMS (`log_sms`: yes)

### 9.2 SMS Activés
- [ ] Confirmation client (`send_confirmation_sms`: yes)
- [ ] Confirmation admin (`send_confirmation_sms_admin`: yes)
- [ ] Confirmation centre (`send_confirmation_sms_worker`: yes)
- [ ] Annulation client (`send_cancellation_sms`: yes)
- [ ] Annulation admin (`send_cancellation_sms_admin`: yes)
- [ ] Annulation centre (`send_cancellation_sms_worker`: yes)
- [ ] Rappel client 24h (`send_reminder_sms`: yes, `reminder_time_sms`: 24)
- [ ] Rappel centre 4h (`send_reminder_sms_worker`: yes, `reminder_time_sms_worker`: 4)

### 9.3 SMS Désactivés
- [ ] Pending (`send_pending_sms_worker`: no)
- [ ] Completed (`send_completed_sms`: no)

---

## 10. GOOGLE CALENDAR SYNC

### 10.1 Configuration
- [ ] API Key: AIzaSyBdcGZj749ciXcs1tly9bSokiS3lF8VdQA
- [ ] Client ID: 1019036813987-...
- [ ] Mode: sync bidirectionnel (`gcal_api_mode`: sync)
- [ ] Push notifications: yes

### 10.2 Fonctionnalités
- [ ] Client peut ajouter événement à son GCal (`gcal_allow_client`: yes)
- [ ] Centre sync automatique (`gcal_allow_worker`: yes)
- [ ] Création événement pour statuts: confirmed, paid (`gcal_status_for_insert`)
- [ ] Suppression événement pour statuts: pending, removed, noshow, deleted (`gcal_status_for_delete`)
- [ ] Bouton "Ajouter à Google Calendar" (`gcal_button`: yes)
- [ ] Google Meet/Conférence (`gcal_conference`: yes)

### 10.3 Format Événement
- [ ] Titre: "Réservation de plongée" (`gcal_worker_summary`)
- [ ] Description: Nom client, email, téléphone, service, prestataire

---

## 11. GOOGLE MAPS

### 11.1 Configuration
- [ ] API Key: AIzaSyAaJ8s3scbbOpU_BB8hvG8h2pPQ543JTqA
- [ ] Taille carte: 800x300
- [ ] Zoom: 16

### 11.2 Utilisation
- [ ] Carte sur fiche centre
- [ ] Picker adresse lors inscription centre
- [ ] Carte Explorer avec tous les centres

---

## 12. CATÉGORIES DE PLONGÉE

9 catégories prédéfinies (multilingue FR/EN/ES/IT):

| ID | Français | English |
|----|----------|---------|
| 1 | Plongée depuis la plage | Beach dive |
| 2 | Plongée en bateau | Boat dive |
| 3 | Plongée double depuis la plage | Double beach dive |
| 4 | Plongée double en bateau | Double boat dive |
| 5 | Baptême de plongée | Discover Scuba Diving |
| 6 | Plongée découverte | Try Dive |
| 7 | Snorkeling | Snorkeling |
| 8 | Journée complète de plongée | Full day diving |
| 9 | Croisière plongée | Liveaboard |

---

## 13. ÉQUIPE DU CENTRE (Workers)

### 13.1 Gestion Équipe
- [ ] Ajouter membre équipe
- [ ] Nom, photo, bio
- [ ] Certifications
- [ ] Langues parlées
- [ ] Horaires de travail propres
- [ ] Affecter à des services

### 13.2 Affectation Réservations
- [ ] Affectation automatique (`assign_worker`: default_worker)
- [ ] Préselection dernier prestataire (`preselect_latest_worker`: yes)
- [ ] Client ne choisit pas le prestataire (`client_selects_worker`: no)

---

## 14. CONDITIONS GÉNÉRALES

### 14.1 CGV Configurées
- [ ] Titre: "Conditions Générales"
- [ ] Contenu HTML complet (société LAM2 Sàrl, Suisse)
- [ ] 12 articles couvrant:
  1. Présentation du site
  2. Acceptation des CGUV
  3. Services proposés
  4. Compte utilisateur
  5. Réservations
  6. Tarifs et paiements
  7. Conditions d'annulation et de remboursement
  8. Responsabilités
  9. Évaluations et commentaires
  10. Propriété intellectuelle
  11. Données personnelles
  12. Droit applicable et litiges

### 14.2 Affichage
- [ ] Page `/conditions-generales`
- [ ] Checkbox dans formulaire (actuellement désactivé)
- [ ] Lien dans footer

---

## 15. MULTILINGUE (i18n)

### 15.1 Langues
- [ ] Français (FR) - défaut
- [ ] English (EN)
- [ ] Español (ES)
- [ ] Italiano (IT)

### 15.2 Contenu Traduit
- [ ] Interface utilisateur
- [ ] Emails (tous les templates)
- [ ] Noms services
- [ ] Descriptions services
- [ ] Catégories
- [ ] Noms centres
- [ ] Descriptions centres

### 15.3 Custom Texts
Plus de 300 textes personnalisables dans `custom_texts`

---

## 16. ADMIN DASHBOARD

### 16.1 Gestion Centres
- [ ] Liste tous les centres
- [ ] Filtrer par statut (pending, approved, rejected, suspended)
- [ ] Approuver/Rejeter candidatures
- [ ] Suspendre centre
- [ ] Voir détails centre

### 16.2 Gestion Réservations
- [ ] Vue toutes réservations
- [ ] Filtres multiples
- [ ] Actions en masse
- [ ] Export CSV

### 16.3 Gestion Utilisateurs
- [ ] Liste utilisateurs
- [ ] Rôles (diver, center_owner, admin)
- [ ] Blacklist emails

### 16.4 Gestion Avis
- [ ] Modération avis (pending, approved, rejected, spam)
- [ ] 0 avis en attente actuellement

### 16.5 Statistiques Globales
- [ ] Réservations totales
- [ ] Revenus totaux
- [ ] Commissions
- [ ] Centres actifs
- [ ] Utilisateurs actifs

### 16.6 Configuration Site
- [ ] Paramètres généraux
- [ ] Paramètres paiement
- [ ] Paramètres emails
- [ ] Paramètres SMS

---

## 17. AVIS & NOTES

### 17.1 Système Avis
- [ ] Note 1-5 étoiles
- [ ] Titre
- [ ] Commentaire
- [ ] Photos (optionnel)
- [ ] Date de plongée
- [ ] Service utilisé

### 17.2 Modération
- [ ] Statuts: pending, approved, rejected, spam
- [ ] Email notification centre
- [ ] Réponse du centre

### 17.3 Affichage
- [ ] Liste avis sur fiche centre
- [ ] Note moyenne
- [ ] Distribution des notes
- [ ] Filtres par note

---

## 18. NOTIFICATIONS IN-APP

Messages de notification (BuddyPress style):

- [ ] Nouvelle réservation (`bp_ntf_new_booking`)
- [ ] Réservation confirmée (`bp_ntf_booking_confirmed`)
- [ ] Réservation payée (`bp_ntf_booking_paid`)
- [ ] Réservation reprogrammée (`bp_ntf_booking_rescheduled`)
- [ ] Réservation annulée (`bp_ntf_booking_cancelled`)
- [ ] Réservation terminée (`bp_ntf_booking_completed`)
- [ ] Réservation en cours (`bp_ntf_booking_running`)

---

## 19. ANNULATION & REMBOURSEMENT

### 19.1 Politique
- [ ] Client ne peut pas annuler (`allow_cancel`: no)
- [ ] Centre peut annuler (`allow_worker_cancel`: yes)
- [ ] Admin peut annuler

### 19.2 Délai
- [ ] Limite annulation: 24h avant (`cancel_limit`: 24)

### 19.3 Process
- [ ] Email annulation envoyé
- [ ] SMS annulation envoyé
- [ ] Remboursement manuel ou automatique
- [ ] Suppression de Google Calendar

---

## 20. SÉCURITÉ & LOGS

### 20.1 Logging
- [ ] Log emails (`log_emails`: yes)
- [ ] Log SMS (`log_sms`: yes)
- [ ] Log paramètres (`log_settings`: yes)

### 20.2 Anti-spam
- [ ] Temps anti-spam: 0 (`spam_time`: 0)
- [ ] Blacklist emails

### 20.3 Validation
- [ ] Strict check (`strict_check`: yes)
- [ ] Service WH check (`service_wh_check`: yes)

---

# 🗄️ SCHÉMA BASE DE DONNÉES COMPLET

## Tables Supabase

### 1. profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  banner_url text,
  bio text,
  phone text,
  address text,
  city text,
  zip text,
  country text,
  
  -- Type compte
  user_type text DEFAULT 'diver' CHECK (user_type IN ('diver', 'center_owner', 'admin')),
  
  -- Plongeur spécifique
  certification_level text,
  certification_org text,
  total_dives integer DEFAULT 0,
  
  -- Préférences
  preferred_language text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'es', 'it')),
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  timezone text DEFAULT 'Europe/Paris',
  
  -- Statut
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_blacklisted boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. dive_centers
```sql
CREATE TABLE dive_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  
  -- Contenu multilingue (JSONB)
  name jsonb NOT NULL,
  description jsonb NOT NULL,
  short_description jsonb,
  
  -- Localisation
  address text NOT NULL,
  street2 text,
  city text NOT NULL,
  region text,
  country text NOT NULL,
  zip text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  
  -- Contact
  email text NOT NULL,
  phone text NOT NULL,
  website text,
  facebook text,
  instagram text,
  whatsapp text,
  
  -- Plongée
  certifications text[] DEFAULT '{}',
  languages_spoken text[] DEFAULT '{}',
  equipment_rental boolean DEFAULT false,
  eco_commitment text,
  
  -- Médias
  logo_url text,
  featured_image text,
  photos text[] DEFAULT '{}',
  
  -- Paiement
  stripe_account_id text,
  payment_types text[] DEFAULT '{}',
  
  -- Horaires (JSONB)
  opening_hours jsonb,
  
  -- Commission
  commission_rate numeric DEFAULT 80,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  
  -- Stats
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  
  -- SEO
  seo_title jsonb,
  seo_description jsonb,
  
  -- Dates
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 3. dive_categories
```sql
CREATE TABLE dive_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name jsonb NOT NULL,
  description jsonb,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 4. dive_services
```sql
CREATE TABLE dive_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES dive_centers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES dive_categories(id),
  
  -- Contenu multilingue
  name jsonb NOT NULL,
  description jsonb,
  
  -- Prix
  price numeric NOT NULL,
  currency text DEFAULT 'EUR',
  price_per_person boolean DEFAULT true,
  
  -- Durée & Capacité
  duration_minutes integer NOT NULL,
  min_participants integer DEFAULT 1,
  max_participants integer DEFAULT 10,
  
  -- Prérequis
  min_certification text,
  min_age integer DEFAULT 10,
  max_depth integer,
  
  -- Inclus
  equipment_included boolean DEFAULT false,
  equipment_details text,
  includes text[] DEFAULT '{}',
  
  -- Médias
  photos text[] DEFAULT '{}',
  
  -- Disponibilité
  available_days text[] DEFAULT '{"monday","tuesday","wednesday","thursday","friday","saturday","sunday"}',
  start_times text[] DEFAULT '{}',
  
  -- Statut
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5. service_extras
```sql
CREATE TABLE service_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES dive_services(id) ON DELETE CASCADE,
  
  name jsonb NOT NULL,
  description jsonb,
  price numeric NOT NULL,
  multiply_by_pax boolean DEFAULT false,
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);
```

### 6. center_workers
```sql
CREATE TABLE center_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES dive_centers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  
  name text NOT NULL,
  email text,
  phone text,
  photo_url text,
  bio text,
  certifications text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  
  -- Horaires propres (JSONB)
  working_hours jsonb,
  
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 7. bookings
```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  
  -- Relations
  center_id uuid NOT NULL REFERENCES dive_centers(id),
  service_id uuid NOT NULL REFERENCES dive_services(id),
  worker_id uuid REFERENCES center_workers(id),
  user_id uuid REFERENCES profiles(id),
  
  -- Date & Heure
  dive_date date NOT NULL,
  dive_time time NOT NULL,
  end_time time,
  duration_minutes integer,
  
  -- Participants
  participants integer NOT NULL DEFAULT 1,
  participant_details jsonb,
  
  -- Client (si non connecté)
  guest_first_name text,
  guest_last_name text,
  guest_email text NOT NULL,
  guest_phone text,
  guest_address text,
  
  -- Demandes
  special_requests text,
  certification_level text,
  
  -- Prix
  unit_price numeric NOT NULL,
  extras_price numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  coupon_code text,
  total_price numeric NOT NULL,
  currency text DEFAULT 'EUR',
  deposit_amount numeric DEFAULT 0,
  
  -- Paiement
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded', 'partial_refund')),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_amount numeric,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'running', 'completed', 'cancelled', 'noshow', 'removed')),
  cancelled_by text CHECK (cancelled_by IN ('client', 'center', 'admin')),
  cancellation_reason text,
  
  -- Timestamps actions
  confirmed_by uuid REFERENCES profiles(id),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  
  -- Tracking
  source text DEFAULT 'website',
  ip_address inet,
  user_agent text,
  
  -- Google Calendar
  gcal_event_id text,
  gcal_synced boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 8. booking_extras
```sql
CREATE TABLE booking_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id uuid NOT NULL REFERENCES service_extras(id),
  
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  
  created_at timestamptz DEFAULT now()
);
```

### 9. waiting_list
```sql
CREATE TABLE waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  center_id uuid NOT NULL REFERENCES dive_centers(id),
  service_id uuid NOT NULL REFERENCES dive_services(id),
  user_id uuid REFERENCES profiles(id),
  
  -- Créneau souhaité
  desired_date date NOT NULL,
  desired_time time NOT NULL,
  participants integer NOT NULL DEFAULT 1,
  
  -- Contact
  guest_email text NOT NULL,
  guest_phone text,
  guest_name text,
  
  -- Statut
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired', 'cancelled')),
  notified_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);
```

### 10. reviews
```sql
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES dive_centers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  booking_id uuid REFERENCES bookings(id),
  
  -- Contenu
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  
  -- Contexte
  dive_date date,
  service_used text,
  
  -- Photos
  photos text[] DEFAULT '{}',
  
  -- Modération
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  moderated_by uuid REFERENCES profiles(id),
  moderated_at timestamptz,
  moderation_note text,
  
  -- Réponse centre
  center_response text,
  center_response_at timestamptz,
  
  -- Stats
  helpful_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 11. coupons
```sql
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code text UNIQUE NOT NULL,
  description text,
  
  -- Type
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL,
  
  -- Restrictions
  center_id uuid REFERENCES dive_centers(id), -- null = global
  service_id uuid REFERENCES dive_services(id),
  min_amount numeric,
  max_discount numeric,
  
  -- Validité
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer,
  uses_count integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  
  -- Options
  apply_to_extras boolean DEFAULT false,
  first_booking_only boolean DEFAULT false,
  
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### 12. coupon_uses
```sql
CREATE TABLE coupon_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  user_id uuid REFERENCES profiles(id),
  discount_applied numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 13. email_logs
```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  to_email text NOT NULL,
  to_name text,
  
  template text NOT NULL,
  subject text NOT NULL,
  
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES profiles(id),
  center_id uuid REFERENCES dive_centers(id),
  
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  
  metadata jsonb,
  
  sent_at timestamptz DEFAULT now()
);
```

### 14. sms_logs
```sql
CREATE TABLE sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  to_phone text NOT NULL,
  
  template text NOT NULL,
  message text NOT NULL,
  
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES profiles(id),
  center_id uuid REFERENCES dive_centers(id),
  
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  error_message text,
  twilio_sid text,
  
  sent_at timestamptz DEFAULT now()
);
```

### 15. notifications
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  
  -- Lien
  link_url text,
  link_text text,
  
  -- Relations
  booking_id uuid REFERENCES bookings(id),
  center_id uuid REFERENCES dive_centers(id),
  review_id uuid REFERENCES reviews(id),
  
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);
```

### 16. commissions
```sql
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  booking_id uuid NOT NULL REFERENCES bookings(id),
  center_id uuid NOT NULL REFERENCES dive_centers(id),
  
  booking_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  center_amount numeric NOT NULL,
  
  -- Frais Stripe
  stripe_fee numeric DEFAULT 0,
  fees_paid_by text DEFAULT 'website' CHECK (fees_paid_by IN ('website', 'center')),
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);
```

### 17. center_blocked_dates
```sql
CREATE TABLE center_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES dive_centers(id) ON DELETE CASCADE,
  
  blocked_date date NOT NULL,
  reason text,
  
  -- Peut bloquer juste certains créneaux
  all_day boolean DEFAULT true,
  blocked_times text[],
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(center_id, blocked_date)
);
```

### 18. settings
```sql
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Insérer les settings par défaut
INSERT INTO settings (key, value, description) VALUES
  ('currency', '"EUR"', 'Devise par défaut'),
  ('commission_rate', '80', 'Taux commission centre (%)'),
  ('reminder_time', '24', 'Rappel client (heures avant)'),
  ('reminder_time_worker', '4', 'Rappel centre (heures avant)'),
  ('cancel_limit', '24', 'Délai annulation (heures avant)'),
  ('app_limit', '365', 'Réservation max jours à l''avance'),
  ('min_time', '60', 'Durée minimum service (minutes)'),
  ('payment_required', 'true', 'Paiement obligatoire'),
  ('auto_confirm', 'false', 'Confirmation automatique'),
  ('allow_cancel', 'false', 'Client peut annuler');
```

---

# 📅 PLANNING DÉTAILLÉ

## Phase 1: Backend (5 jours)
1. Toutes les migrations Supabase (17 tables)
2. RLS policies complètes
3. Functions/Triggers (génération référence, calcul stats)
4. Seeder catégories

## Phase 2: Authentification (3 jours)
5. Inscription plongeur
6. Inscription centre (wizard)
7. Connexion
8. Mot de passe oublié
9. Vérification email
10. Middleware protection

## Phase 3: Dashboard Plongeur (3 jours)
11. Layout + navigation
12. Vue d'ensemble
13. Mes réservations
14. Mes avis
15. Paramètres

## Phase 4: Dashboard Centre (5 jours)
16. Vue d'ensemble + stats
17. Profil centre
18. Gestion services (CRUD)
19. Calendrier + disponibilités
20. Gestion réservations
21. Gestion avis
22. Paramètres

## Phase 5: Réservation (5 jours)
23. Page réservation
24. Sélecteur service
25. Sélecteur date/heure
26. Formulaire participants
27. Extras
28. Récapitulatif
29. Liste d'attente
30. Confirmation

## Phase 6: Paiement (3 jours)
31. Intégration Stripe
32. Webhooks
33. Gestion remboursements

## Phase 7: Commission (2 jours)
34. Calcul commissions
35. Dashboard admin commissions

## Phase 8: Coupons (2 jours)
36. CRUD coupons
37. Application dans booking

## Phase 9: Emails (3 jours)
38. Setup Resend/SendGrid
39. Tous les templates (15+)
40. Triggers automatiques

## Phase 10: SMS (2 jours)
41. Setup Twilio
42. Templates SMS
43. Triggers

## Phase 11: Google Calendar (2 jours)
44. OAuth Google
45. Sync bidirectionnel
46. Bouton ajouter

## Phase 12: Admin Dashboard (3 jours)
47. Gestion centres
48. Gestion utilisateurs
49. Gestion réservations
50. Gestion avis
51. Statistiques globales

## Phase 13: Finalisation (3 jours)
52. Tests complets
53. Traductions i18n
54. Responsive
55. Performance

---

**TOTAL ESTIMÉ: ~40 jours de développement**

Ce plan est maintenant **100% COMPLET** et couvre TOUTES les fonctionnalités de l'ancien site WordPress.
