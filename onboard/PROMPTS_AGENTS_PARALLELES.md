# 📄 Prompts Agents Parallèles — EviDive Platform

> **Stack**: Next.js 16 • React 19 • Tailwind v4 • Shadcn/ui • **Prisma** + Prisma Accelerate • **Auth.js (NextAuth v5)** • **Nodemailer** • **Vercel**  
> **Langues**: FR (default), EN, DE, ES, IT  
> **Date**: 31 janvier 2026

---

## ⚡️ CONSIGNES COMMUNES À TOUS LES AGENTS

Pour chaque page assignée :

1. **Nettoie** l'UX/UI — clarté, logique, accessibilité, zéro décor inutile
2. **Vérifie** chaque fonctionnalité — code, intention, interactions
3. **Améliore** la lisibilité, nommage, structure (patterns modernes)
4. **Signale** en fin de travail tout élément incohérent ou inutile détecté

### Règles techniques obligatoires :
- `await params` obligatoire (Next.js 16)
- `setRequestLocale(locale)` dans chaque page
- `useTranslations()` pour tout texte user-facing
- Tailwind classes uniquement (JAMAIS `style={{}}`)
- Validation Zod sur tous les formulaires
- `cn()` pour merge de classes
- **Prisma** pour toutes les requêtes DB (pas Supabase)
- **Auth.js** pour l'authentification (pas Supabase Auth)
- **Nodemailer** pour les emails (pas Brevo)

### Stack technique :
```
Database:     Prisma + Prisma Accelerate (PostgreSQL)
Auth:         Auth.js (NextAuth v5)
Email:        Nodemailer (SMTP)
Déploiement:  Vercel
ORM:          Prisma Client
Validation:   Zod
State:        Zustand
```

---

## 🔐 AUTHENTIFICATION

---

### Prompt 01 — Création de compte Plongeur

```
Page: /[locale]/register

Implémente la page « Création de compte Plongeur » :

STACK:
- Auth.js (NextAuth v5) pour la gestion de session
- Prisma pour créer le Profile
- bcryptjs pour hash mot de passe
- Zod pour validation

FONCTIONNALITÉS OBLIGATOIRES:
- Formulaire épuré : email, mot de passe, confirmation mot de passe, prénom, nom
- Validation temps réel (Zod) : email syntaxe + unicité côté serveur via Prisma
- Force mot de passe : minimum 8 caractères, 1 majuscule, 1 chiffre
- Indicateur visuel force mot de passe
- Après validation : création Profile Prisma avec passwordHash (bcrypt)
- Connexion automatique via signIn() de next-auth
- Redirection vers /app (dashboard plongeur)

PRISMA:
- Créer un Profile avec userType: "DIVER"
- Hash password avec bcryptjs (cost 12)
- Vérifier unicité email: prisma.profile.findUnique({ where: { email } })

CONTRAINTES UX:
- OAuth Google/Facebook : MASQUÉS (désactivés)
- Lien "Mot de passe oublié" visible sous le formulaire
- Lien "Déjà inscrit ? Connexion" visible
- Checkbox CGV obligatoire avec lien cliquable
- Messages d'erreur inline sous chaque champ

SÉCURITÉ:
- Vérification isBlacklisted sur Profile avant inscription
- Rate limiting sur tentatives d'inscription
- Email de validation envoyé via Nodemailer après inscription

ACCESSIBILITÉ:
- Labels associés aux inputs (htmlFor)
- aria-describedby pour les erreurs
- Focus visible sur tous les champs

STRUCTURE COMPOSANTS:
- RegisterForm (client component)
- PasswordStrengthIndicator
- Server action: createDiverAccount() utilisant Prisma

À LA FIN, LISTE:
- Tout champ qui ne sert pas l'inscription
- Toute incohérence dans le flow
- Points à revoir / incohérences :
```

---

### Prompt 02 — Connexion Plongeur

```
Page: /[locale]/login

Implémente la page « Connexion » :

STACK:
- Auth.js signIn() avec credentials provider
- Prisma pour vérifier Profile
- bcryptjs pour comparer mot de passe

FONCTIONNALITÉS OBLIGATOIRES:
- Formulaire : email, mot de passe
- Validation Zod
- Option "Se souvenir de moi" (session longue durée)
- Bouton connexion avec état loading
- Après connexion : redirection selon userType (DIVER → /app, CENTER_OWNER → /center, ADMIN → /admin)

AUTH.JS:
- Utiliser signIn("credentials", { email, password })
- Vérifier Profile via Prisma dans authorize()
- Comparer passwordHash avec bcrypt.compare()
- Vérifier isActive === true et isBlacklisted === false

CONTRAINTES UX:
- OAuth Google/Facebook : MASQUÉS
- Lien "Mot de passe oublié" visible
- Lien "Pas encore inscrit ? Créer un compte" visible
- Messages d'erreur génériques (sécurité : pas de distinction email/mdp)

SÉCURITÉ:
- Rate limiting : max 5 tentatives/15min
- Blocage temporaire après échecs
- Log des tentatives de connexion

À LA FIN, LISTE:
- Points à revoir / incohérences :
```

---

### Prompt 03 — Mot de passe oublié

```
Page: /[locale]/forgot-password

Implémente la page « Mot de passe oublié » :

STACK:
- Prisma pour trouver Profile par email
- Nodemailer pour envoyer l'email
- Crypto pour générer token

FONCTIONNALITÉS:
- Formulaire : email uniquement
- Message de succès identique que l'email existe ou non (sécurité)
- Génération token temporaire (crypto.randomBytes)
- Stockage token + expiration dans Profile ou table dédiée
- Email envoyé via Nodemailer avec lien de réinitialisation
- Design épuré, centré

NODEMAILER:
- Utiliser le template password_reset
- Inclure lien avec token: /reset-password?token=xxx
- Token expire après 1h

CONTRAINTES:
- Rate limiting : max 3 demandes/email/heure
- Lien retour vers connexion

À LA FIN, LISTE:
- Points à revoir / incohérences :
```

---

### Prompt 04 — Réinitialisation mot de passe

```
Page: /[locale]/reset-password?token=xxx

Implémente la page « Réinitialisation mot de passe » :

STACK:
- Prisma pour vérifier token et mettre à jour passwordHash
- bcryptjs pour hash nouveau mot de passe

FONCTIONNALITÉS:
- Vérification token valide à l'affichage (query Prisma)
- Formulaire : nouveau mot de passe, confirmation
- Indicateur force mot de passe
- Après succès : mise à jour passwordHash, invalidation token
- Redirection vers connexion avec message succès
- Token expiré : message clair + lien vers "mot de passe oublié"

CONTRAINTES:
- Token usage unique (invalidé après utilisation)
- Expiration 1h

À LA FIN, LISTE:
- Points à revoir / incohérences :
```

---

### Prompt 05 — Inscription Centre de plongée

```
Page: /[locale]/register/center

Implémente la page « Inscription Centre de plongée » en MULTI-ÉTAPES :

STACK:
- Prisma pour créer Profile + DiveCenter
- bcryptjs pour hash mot de passe
- Nodemailer pour emails notification
- Zustand pour état multi-étapes

ÉTAPE 1 - Informations personnelles:
- Prénom, Nom (représentant légal)
- Email professionnel
- Mot de passe + confirmation
- Téléphone

ÉTAPE 2 - Informations centre:
- Nom du centre (public) - JSON multilingue
- Adresse complète (rue, ville, code postal, pays)
- Latitude/Longitude (auto via géocoding ou manuel)
- Site web (optionnel)
- Description courte - JSON multilingue

ÉTAPE 3 - Informations légales:
- Nom société (optionnel pour auto-entrepreneurs)
- Numéro SIRET/TVA (optionnel)
- Certifications (PADI, SSI, CMAS, FFESSM - array string)

ÉTAPE 4 - Confirmation:
- Récapitulatif toutes infos
- Checkbox CGV obligatoire
- Bouton "Soumettre ma demande"

PRISMA:
- Créer Profile avec userType: "CENTER_OWNER"
- Créer DiveCenter avec status: "PENDING"
- Lier via ownerId

APRÈS SOUMISSION:
- Email accusé réception envoyé au centre (Nodemailer)
- Email notification envoyé aux admins
- Redirection vers page "Demande envoyée" avec explications

VALIDATION ADMIN:
- Admin peut approuver/refuser via dashboard
- Update DiveCenter.status → APPROVED ou REJECTED
- Email automatique envoyé (approuvé ou refusé avec motif)
- Si approuvé: DiveCenter.approvedAt = new Date()

CONTRAINTES UX:
- Progress bar visible entre étapes
- Boutons Précédent/Suivant
- Données persistées entre étapes (Zustand)
- Validation par étape avant passage à la suivante

À LA FIN, LISTE:
- Tout champ inutile ou redondant
- Points à revoir / incohérences :
```

---

## 👤 ESPACE PLONGEUR

---

### Prompt 06 — Profil Utilisateur

```
Page: /[locale]/profile

Implémente la page « Profil Utilisateur » (plongeur) :

STACK:
- Auth.js useSession() pour récupérer user
- Prisma pour CRUD Profile
- Server Actions pour mutations

SECTIONS OBLIGATOIRES:

1. HEADER PROFIL:
- Avatar (avatarUrl - upload/modification)
- Image de couverture (bannerUrl - upload/modification)
- Nom complet (firstName + lastName)

2. INFORMATIONS PERSONNELLES (éditable):
- Prénom, Nom
- Email (non modifiable, affiché grisé)
- Téléphone (phone)
- Date de naissance
- Nationalité
- Adresse complète (address, city, zip, country)

3. INFORMATIONS PLONGÉE:
- Niveau de certification (certificationLevel)
- Organisme certification (certificationOrg)
- Nombre de plongées estimé (totalDives)
- Date dernière plongée

4. ACTIONS RAPIDES:
- Modifier mot de passe (modal ou page dédiée)
- Paramètres notifications (lien)
- Paramètres confidentialité (lien)
- Sélecteur langue interface (preferredLanguage)

5. ZONE DANGER:
- Supprimer mon compte (avec double confirmation)
- Update Profile.isActive = false

PRISMA:
- prisma.profile.update() pour modifications
- Uploader images vers storage (Vercel Blob ou similaire)

CONTRAINTES:
- Mode édition inline ou formulaire modal
- Sauvegarde automatique ou bouton explicite
- Feedback visuel après modification (toast)

À LA FIN, LISTE:
- Bloc ou champ sans utilité
- Points à revoir / incohérences :
```

---

### Prompt 07 — Tableau de bord Plongeur

```
Page: /[locale]/app

Implémente le « Dashboard Plongeur » :

STACK:
- Auth.js pour session
- Prisma pour queries bookings, reviews

WIDGETS OBLIGATOIRES:

1. PROCHAINES PLONGÉES (priorité haute):
- Query: prisma.booking.findMany({ where: { userId, diveDate: { gte: new Date() }, status: { in: ['CONFIRMED', 'PAID'] } } })
- Card listant les 3 prochaines réservations
- Pour chaque : date, nom centre (via include), nom service, statut
- CTA "Voir détails" sur chaque
- Si aucune : message + CTA "Explorer les offres"

2. HISTORIQUE RÉCENT:
- Query: prisma.booking.findMany({ where: { userId, status: 'COMPLETED' }, take: 3, orderBy: { diveDate: 'desc' } })
- 3 dernières plongées effectuées
- Pour chaque : date, centre, note donnée (via include review)
- CTA "Laisser un avis" si pas encore fait

3. STATISTIQUES SIMPLES:
- Nombre total de plongées (count bookings COMPLETED)
- Nombre d'avis laissés (count reviews)

4. ACTIONS RAPIDES:
- "Rechercher une plongée" → /search
- "Mes réservations" → /bookings
- "Mes avis" → /reviews

CONTRAINTES UX:
- Layout responsive : grille sur desktop, stack sur mobile
- Loading states sur chaque widget (Suspense)
- Empty states pour chaque section

À LA FIN, LISTE:
- Widget inutile ou non pertinent
- Points à revoir / incohérences :
```

---

### Prompt 08 — Réservations Plongeur

```
Page: /[locale]/bookings

Implémente la page « Mes Réservations » (plongeur) :

STACK:
- Prisma pour queries bookings avec includes
- Server Actions pour annulation

FONCTIONNALITÉS:

1. LISTE DES RÉSERVATIONS:
- Query: prisma.booking.findMany({ where: { userId }, include: { center: true, service: true, extras: true }, orderBy: { diveDate: 'desc' } })
- Filtrage par statut : Tous, À venir, Passées, Annulées

2. CARD RÉSERVATION:
- Date et heure (diveDate, diveTime)
- Nom du centre (center.name - JSON, afficher selon locale)
- Nom de l'offre/plongée (service.name - JSON)
- Nombre de participants
- Statut coloré (PENDING, CONFIRMED, PAID, COMPLETED, CANCELLED)
- Montant payé (totalPrice, currency)
- CTA selon statut

3. DÉTAILS RÉSERVATION (modal ou page):
- Toutes infos ci-dessus
- Référence booking (reference)
- Détails paiement (paidAt, stripePaymentIntentId)
- Commentaires/demandes spéciales (specialRequests)
- Extras sélectionnés (extras include)
- Bouton "Ajouter à Google Calendar" (génère URL)
- Bouton "Contacter le centre" (center.email)

4. ACTIONS:
- Annulation : si politique le permet
  - Vérifier délai selon politique centre
  - Si interdit : message UX clair "Annulation impossible - contactez le centre"
  - Aucun bouton "Annuler" si annulation impossible
  - Server Action: updateBookingStatus({ status: 'CANCELLED', cancelledBy: 'CLIENT' })
- Laisser un avis : si COMPLETED et pas encore fait (vérifier review relation null)

CONTRAINTES:
- Pagination ou infinite scroll si >10 réservations
- Empty state si aucune réservation

À LA FIN, LISTE:
- Action incohérente ou inutile
- Points à revoir / incohérences :
```

---

### Prompt 09 — Avis Plongeur

```
Page: /[locale]/reviews

Implémente la page « Mes Avis » (plongeur) :

STACK:
- Prisma pour queries reviews
- Server Actions pour CRUD

FONCTIONNALITÉS:

1. LISTE DES AVIS:
- Query: prisma.review.findMany({ where: { userId }, include: { center: true, booking: true }, orderBy: { createdAt: 'desc' } })
- Tri par date

2. CARD AVIS:
- Centre concerné (center.name + center.logoUrl)
- Date de l'avis (createdAt)
- Note (rating - étoiles 1-5)
- Texte de l'avis (comment)
- Statut modération (status: PENDING, APPROVED, REJECTED)
- CTA "Modifier" si status === PENDING

3. RÉSERVATIONS SANS AVIS:
- Query: prisma.booking.findMany({ where: { userId, status: 'COMPLETED', review: null } })
- Section "Plongées en attente d'avis"
- CTA "Laisser un avis" sur chaque

4. FORMULAIRE AVIS (modal):
- Note 1-5 étoiles (rating - obligatoire)
- Texte avis (comment - min 20 caractères)
- Photos (photos array - optionnel, max 3)
- Server Action: createReview()

PRISMA:
- prisma.review.create({ data: { rating, comment, photos, centerId, userId, bookingId, status: 'PENDING' } })

CONTRAINTES:
- Un seul avis par réservation (bookingId unique sur Review)
- Avis modifiable uniquement si status === PENDING
- Avis supprimable uniquement si status === PENDING

À LA FIN, LISTE:
- Fonctionnalité superflue
- Points à revoir / incohérences :
```

---

### Prompt 10 — Paramètres Plongeur

```
Page: /[locale]/settings

Implémente la page « Paramètres » (plongeur) :

STACK:
- Prisma pour update Profile
- Server Actions

SECTIONS:

1. NOTIFICATIONS:
- Email réservation confirmée : emailNotifications toggle
- SMS rappel plongée : smsNotifications toggle (si phone renseigné)
- Stockés dans Profile

2. CONFIDENTIALITÉ:
- Profil visible par les centres : toggle (nouveau champ à ajouter si besoin)

3. LANGUE:
- Sélecteur langue interface (preferredLanguage: fr, en, de, es, it)
- Update Profile + reload avec nouvelle locale via next-intl

4. COMPTE:
- Exporter mes données (RGPD) - génère JSON
- Supprimer mon compte (update isActive = false)

PRISMA:
- prisma.profile.update({ where: { id }, data: { emailNotifications, smsNotifications, preferredLanguage } })

CONTRAINTES:
- Sauvegarde automatique après chaque toggle
- Feedback visuel (toast)

À LA FIN, LISTE:
- Paramètre sans utilité
- Points à revoir / incohérences :
```

---

## 🏢 ESPACE CENTRE DE PLONGÉE

---

### Prompt 11 — Tableau de bord Centre

```
Page: /[locale]/center

Implémente le « Dashboard Centre de plongée » :

STACK:
- Auth.js pour session (vérifier userType === CENTER_OWNER)
- Prisma pour queries avec centerId

WIDGETS OBLIGATOIRES:

1. STATISTIQUES RAPIDES (cards en ligne):
- Réservations du jour: count bookings where diveDate === today
- Réservations cette semaine: count bookings where diveDate in week
- Revenus du mois: sum commissions.centerAmount where month
- Note moyenne: center.rating

2. RÉSERVATIONS À TRAITER:
- Query: prisma.booking.findMany({ where: { centerId, status: 'PENDING' }, include: { user: true, service: true } })
- CTA "Confirmer" / "Refuser" sur chaque
- Informations : client (guestFirstName/guestLastName ou user), date, offre, participants, montant

3. PROCHAINES PLONGÉES:
- Calendrier simplifié de la semaine
- Nombre de participants par jour (agrégation bookings)
- Clic → détail du jour

4. AVIS RÉCENTS:
- Query: prisma.review.findMany({ where: { centerId, status: 'APPROVED' }, take: 3 })
- Note, extrait texte
- CTA "Répondre" si centerResponse === null

5. ACTIONS RAPIDES:
- "Créer une offre" → /center/services/new
- "Voir calendrier" → /center/calendar
- "Gérer réservations" → /center/bookings

CONTRAINTES:
- Vérifier que l'utilisateur est owner du center
- Widgets collapsibles sur mobile

À LA FIN, LISTE:
- Widget inutile
- Points à revoir / incohérences :
```

---

### Prompt 12 — Profil Centre de plongée

```
Page: /[locale]/center/settings (ou /center/profile)

Implémente la page « Profil Centre » (édition) :

STACK:
- Prisma pour CRUD DiveCenter
- Upload images vers Vercel Blob

SECTIONS ÉDITABLES:

1. IDENTITÉ:
- Nom du centre (name - JSON multilingue)
- Logo (logoUrl - upload)
- Image de couverture (featuredImage - upload)
- Galerie photos (photos array - upload multiple, max 10)

2. DESCRIPTION:
- Description courte (shortDescription - JSON multilingue)
- Description longue (description - JSON multilingue)
- Tabs FR/EN/DE/ES/IT pour édition

3. COORDONNÉES:
- Adresse complète (address, city, region, country, zip)
- Téléphone (phone)
- Email public (email)
- Site web (website)
- Réseaux sociaux (facebook, instagram, whatsapp)

4. INFORMATIONS PRATIQUES:
- Horaires d'ouverture (openingHours - JSON par jour)
- Langues parlées (languagesSpoken - array string)
- Certifications (certifications - array string)
- Équipement disponible à la location (equipmentRental - boolean)

5. ENGAGEMENT:
- Badge éco-responsable (ecoCommitment - string textarea)

6. PAIEMENTS:
- Modes de paiement acceptés sur place (paymentTypes - array string)
- Configuration Stripe Connect (stripeAccountId)

7. LOCALISATION:
- Carte Google Maps avec marker draggable
- Coordonnées GPS (latitude, longitude)

PRISMA:
- prisma.diveCenter.update({ where: { id: centerId }, data: { ... } })

CONTRAINTES:
- Sauvegarde section par section ou globale
- Preview du profil public
- Validation des URLs (site, réseaux)

À LA FIN, LISTE:
- Champ redondant ou inutile
- Points à revoir / incohérences :
```

---

### Prompt 13 — Gestion des plongées/services

```
Page: /[locale]/center/services

Implémente la page « Gestion des Services » (centre) :

STACK:
- Prisma pour CRUD DiveService et ServiceExtra

FONCTIONNALITÉS:

1. LISTE DES SERVICES:
- Query: prisma.diveService.findMany({ where: { centerId }, include: { category: true, extras: true } })
- Affichage : nom (JSON locale), catégorie, prix, statut (isActive), places max
- Tri et filtrage par catégorie
- CTA "Modifier" / "Dupliquer" / "Archiver"

2. CRÉATION SERVICE (/center/services/new):
- Nom (name - JSON multilingue)
- Description (description - JSON multilingue)
- Catégorie (categoryId - sélecteur parmi DiveCategory)
- Prix (price, currency)
- Durée estimée (durationMinutes)
- Nombre de places (minParticipants, maxParticipants)
- Niveau requis (minCertification - string)
- Inclus dans le prix (includes - array string, equipmentIncluded boolean)
- Images (photos - array string upload)
- Disponibilité (availableDays, startTimes)

3. EXTRAS/OPTIONS (ServiceExtra):
- Pour chaque extra : name (JSON), price, multiplyByPax, isRequired
- CRUD via prisma.serviceExtra

4. RÉCURRENCE:
- availableDays : array de jours ["monday", "tuesday", ...]
- startTimes : array d'heures ["09:00", "14:00"]

PRISMA:
- prisma.diveService.create / update / findMany
- prisma.serviceExtra.create / update / delete

CONTRAINTES:
- Duplication de service conserve les extras
- Archivage soft (isActive = false)
- Validation prix > 0

À LA FIN, LISTE:
- Champ ou option superflue
- Points à revoir / incohérences :
```

---

### Prompt 14 — Calendrier & Disponibilités

```
Page: /[locale]/center/calendar

Implémente la page « Calendrier » (centre) :

STACK:
- Prisma pour queries bookings par date
- Prisma pour CenterBlockedDate

FONCTIONNALITÉS:

1. VUE CALENDRIER:
- Vue mois par défaut, toggle semaine/jour
- Query: prisma.booking.findMany({ where: { centerId, diveDate: { gte, lte } }, include: { service: true } })
- Affichage : slots avec nombre de réservations / places totales
- Couleur selon taux de remplissage

2. GESTION DISPONIBILITÉS:
- Bloquer des dates via CenterBlockedDate
- prisma.centerBlockedDate.create({ data: { centerId, blockedDate, reason, allDay } })

3. MODAL SLOT:
- Service concerné
- Date et heure
- Participants inscrits (noms, statuts)
- Places restantes
- CTA "Ajouter réservation manuelle"
- CTA "Fermer ce créneau" (bloquer)

4. DATES BLOQUÉES:
- Query: prisma.centerBlockedDate.findMany({ where: { centerId } })
- Ajout/suppression

CONTRAINTES:
- Responsive : liste sur mobile, calendrier sur desktop
- Chargement performant (ne charger que le mois visible)

À LA FIN, LISTE:
- Fonctionnalité complexe inutile
- Points à revoir / incohérences :
```

---

### Prompt 15 — Gestion des réservations (Centre)

```
Page: /[locale]/center/bookings

Implémente la page « Gestion Réservations » (centre) :

STACK:
- Prisma pour queries bookings
- Server Actions pour status updates

FONCTIONNALITÉS:

1. LISTE RÉSERVATIONS:
- Query: prisma.booking.findMany({ where: { centerId }, include: { user: true, service: true, extras: { include: { extra: true } } } })
- Filtres : date, statut, service
- Recherche par nom client ou référence

2. CARD RÉSERVATION:
- Référence (reference)
- Client (guestFirstName/guestLastName + guestEmail + guestPhone, ou user.*)
- Service et date (service.name, diveDate, diveTime)
- Nombre de participants (participants)
- Extras sélectionnés (extras)
- Montant total (totalPrice)
- Statut coloré (status)

3. ACTIONS:
- Confirmer: update status → CONFIRMED, set confirmedAt, confirmedById
- Annuler: update status → CANCELLED, cancelledBy: 'CENTER', cancellationReason
- Marquer comme effectuée: update status → COMPLETED, completedAt
- Contacter le client (guestEmail)

4. DÉTAILS RÉSERVATION (modal ou page):
- Toutes infos client
- Niveau certification (certificationLevel)
- Demandes spéciales (specialRequests)
- Historique statuts
- Paiement : montant, commission, net (via commission relation)

5. RÉSERVATION MANUELLE:
- Formulaire pour ajouter une réservation manuellement
- Créer booking avec source: 'manual'

PRISMA:
- prisma.booking.update({ where: { id }, data: { status, confirmedAt, confirmedById } })

CONTRAINTES:
- Export CSV des réservations (filtres appliqués)
- Pagination

À LA FIN, LISTE:
- Action sans utilité
- Points à revoir / incohérences :
```

---

### Prompt 16 — Avis reçus (Centre)

```
Page: /[locale]/center/reviews

Implémente la page « Avis reçus » (centre) :

STACK:
- Prisma pour queries reviews

FONCTIONNALITÉS:

1. STATISTIQUES:
- Note moyenne (center.rating)
- Distribution des notes (agrégation par rating 1-5)
- Nombre total d'avis (center.reviewCount)

2. LISTE DES AVIS:
- Query: prisma.review.findMany({ where: { centerId, status: 'APPROVED' }, include: { user: true }, orderBy: { createdAt: 'desc' } })
- Tri par date, note
- Filtre par note

3. CARD AVIS:
- Auteur (user.firstName + initiale user.lastName)
- Date (createdAt)
- Note (rating - étoiles)
- Texte (comment)
- Photos si présentes (photos)
- Réponse du centre si existante (centerResponse, centerResponseAt)

4. RÉPONSE AUX AVIS:
- CTA "Répondre" si centerResponse === null
- Modal avec textarea
- Server Action: prisma.review.update({ where: { id }, data: { centerResponse, centerResponseAt: new Date() } })
- Une seule réponse par avis

CONTRAINTES:
- Centre ne peut pas supprimer ou modifier les avis (lecture seule)
- Centre ne peut pas voir les avis status !== 'APPROVED'

À LA FIN, LISTE:
- Fonctionnalité inappropriée
- Points à revoir / incohérences :
```

---

### Prompt 17 — Statistiques Centre

```
Page: /[locale]/center/stats

Implémente la page « Statistiques » (centre) :

STACK:
- Prisma agrégations et groupBy

MÉTRIQUES OBLIGATOIRES:

1. REVENUS:
- Query: prisma.commission.aggregate + groupBy par mois
- Graphique revenus par mois (12 derniers mois)
- Revenus bruts (bookingAmount) vs nets (centerAmount)
- Comparaison période précédente

2. RÉSERVATIONS:
- Query: prisma.booking.count + groupBy
- Nombre par mois
- Taux de confirmation (CONFIRMED / total)
- Taux d'annulation (CANCELLED / total)
- Top services (par nombre de bookings)

3. CLIENTS:
- Nouveaux vs récurrents (count distinct userId)

4. AVIS:
- Évolution note moyenne (agrégation reviews par mois)
- Nombre d'avis par mois

CONTRAINTES:
- Sélecteur période (30j, 90j, 12 mois, tout)
- Graphiques responsives (Recharts recommandé)

À LA FIN, LISTE:
- Métrique sans valeur ajoutée
- Points à revoir / incohérences :
```

---

### Prompt 18 — Paramètres Centre

```
Page: /[locale]/center/settings

Implémente la page « Paramètres » (centre) :

STACK:
- Prisma pour update DiveCenter

SECTIONS:

1. NOTIFICATIONS:
- Toggles pour notifications (à stocker dans Setting ou champs DiveCenter)

2. POLITIQUE ANNULATION:
- Champs à ajouter si besoin dans DiveCenter
- Type : flexible, modérée, stricte
- Délai annulation gratuite (heures)
- Remboursement partiel après délai (%)

3. PAIEMENT:
- Configuration Stripe Connect (stripeAccountId)
- Lien vers onboarding Stripe si pas configuré

4. ÉQUIPE:
- Lien vers gestion équipe (/center/team)

5. COMMISSION:
- Affichage commissionRate (lecture seule, défini par admin)

6. DANGER:
- Désactiver le centre: update status → SUSPENDED
- Supprimer le centre: soft delete

À LA FIN, LISTE:
- Paramètre inutile
- Points à revoir / incohérences :
```

---

### Prompt 19 — Équipe Centre (Workers)

```
Page: /[locale]/center/team

Implémente la page « Gestion Équipe » (centre) :

STACK:
- Prisma pour CRUD CenterWorker

FONCTIONNALITÉS:

1. LISTE DES MEMBRES:
- Query: prisma.centerWorker.findMany({ where: { centerId } })
- Infos : name, email, certifications, isActive

2. CRÉATION WORKER:
- Formulaire : name, email, phone, photoUrl, bio, certifications, languages
- prisma.centerWorker.create()

3. ACTIONS:
- Modifier
- Désactiver (isActive = false)
- Réactiver

CONTRAINTES:
- isDefault worker ne peut pas être supprimé (premier worker = owner)

À LA FIN, LISTE:
- Rôle ou permission superflue
- Points à revoir / incohérences :
```

---

## 📅 RÉSERVATION & PAIEMENT

---

### Prompt 20 — Page Réservation (Booking)

```
Page: /[locale]/offer/[offerId] + /[locale]/checkout

Implémente le flow « Réservation » :

STACK:
- Prisma pour queries DiveService, DiveCenter, ServiceExtra
- Prisma pour créer Booking
- Stripe Checkout pour paiement

ÉTAPE 1 - PAGE OFFRE (/offer/[offerId]):
- Query: prisma.diveService.findUnique({ where: { id }, include: { center: true, category: true, extras: true } })
- Détails complets de l'offre (name, description - JSON locale)
- Galerie photos (photos)
- Inclus / Non inclus (includes, equipmentIncluded)
- Avis sur ce centre (reviews via center)
- Sélection date (calendrier - vérifier CenterBlockedDate)
- Sélection nombre de participants (min/maxParticipants)
- Prix calculé dynamiquement
- CTA "Réserver"

ÉTAPE 2 - CHECKOUT (/checkout):
- Récapitulatif : offre, date, participants, prix
- Sélection extras (ServiceExtra where isActive)
- Prix total mis à jour

- Formulaire participant principal:
  - Prénom, Nom (guestFirstName, guestLastName)
  - Email (guestEmail)
  - Téléphone (guestPhone)
  - Adresse (guestAddress)
  - Niveau certification (certificationLevel)
  - Demandes spéciales (specialRequests)

- Si plusieurs participants:
  - Formulaire simplifié (participantDetails JSON)

- CGV : checkbox obligatoire
- Bouton "Payer XX€"

PRISMA (création booking):
- Générer reference unique
- Créer Booking avec status: 'PENDING', paymentStatus: 'UNPAID'
- Créer BookingExtra pour chaque extra sélectionné

APRÈS PAIEMENT:
- Page confirmation avec référence
- Email confirmation envoyé via Nodemailer
- Bouton "Ajouter à Google Calendar"

CONTRAINTES:
- Timeout session checkout : 15 min (afficher timer)
- Vérification disponibilité avant paiement
- Si plus dispo : message clair, pas de paiement

À LA FIN, LISTE:
- Champ inutile dans formulaire
- Points à revoir / incohérences :
```

---

### Prompt 21 — Paiement

```
Flow: Stripe Checkout + Webhooks

Implémente le système « Paiement » :

STACK:
- Stripe Checkout Sessions
- Stripe Connect pour multi-vendeurs
- Webhooks API Routes
- Prisma pour update Booking, Commission

INTÉGRATION STRIPE:

1. CRÉATION PAIEMENT (/api/checkout):
- Calcul montant : unitPrice × participants + extras (avec multiplyByPax)
- Application coupon si code valide
- Stripe Checkout Session avec:
  - line_items
  - success_url
  - cancel_url
  - metadata: { bookingId }
- Update Booking: stripeCheckoutSessionId

2. WEBHOOKS (/api/webhooks/stripe):
- checkout.session.completed:
  - Update Booking: paymentStatus → 'PAID', paidAt, status → 'PAID'
  - Créer Commission
  - Envoyer email confirmation (Nodemailer)
- payment_intent.payment_failed:
  - Log erreur
- charge.refunded:
  - Update Booking: paymentStatus → 'REFUNDED', refundedAt, refundAmount

3. COMMISSION (auto-calculée):
- prisma.commission.create({
    bookingId,
    centerId,
    bookingAmount: totalPrice,
    commissionRate: center.commissionRate,
    commissionAmount: totalPrice * (100 - commissionRate) / 100,
    centerAmount: totalPrice * commissionRate / 100
  })

CONTRAINTES:
- Pas de stockage carte côté serveur
- Logs tous les événements paiement
- Gestion erreurs Stripe gracieuse

À LA FIN, LISTE:
- Flux de paiement incohérent
- Points à revoir / incohérences :
```

---

### Prompt 22 — Commissions

```
Page: /[locale]/admin/commissions

Implémente la page « Gestion Commissions » (admin) :

STACK:
- Prisma pour queries Commission

FONCTIONNALITÉS:

1. CONFIGURATION GLOBALE:
- Taux de commission par défaut (Setting key='default_commission_rate')
- Taux par centre (DiveCenter.commissionRate - override individuel)

2. LISTE COMMISSIONS:
- Query: prisma.commission.findMany({ include: { booking: true, center: true } })
- Filtres : centre, période, statut
- Infos : booking.reference, bookingAmount, commissionAmount, centerAmount, status

3. PAIEMENT CENTRES:
- Agrégation par centre où status === 'PENDING'
- Bouton "Marquer comme versé" → update status → 'PAID', paidAt

4. RAPPORTS:
- Total commissions par période
- Export CSV

CONTRAINTES:
- Commission calculée automatiquement (trigger ou hook)
- Historique non modifiable (audit trail)

À LA FIN, LISTE:
- Fonctionnalité admin superflue
- Points à revoir / incohérences :
```

---

### Prompt 23 — Coupons & Réductions

```
Page: /[locale]/admin/coupons

Implémente la page « Gestion Coupons » (admin) :

STACK:
- Prisma pour CRUD Coupon, CouponUse

FONCTIONNALITÉS:

1. LISTE COUPONS:
- Query: prisma.coupon.findMany({ include: { _count: { select: { uses: true } } } })
- Infos : code, discountType, discountValue, validFrom/Until, usesCount/maxUses

2. CRÉATION COUPON:
- Code (code - auto-généré ou personnalisé, unique)
- Type (discountType: PERCENT ou FIXED)
- Valeur (discountValue)
- Date début / fin validité (validFrom, validUntil)
- Usage max total (maxUses)
- Usage max par utilisateur (maxUsesPerUser)
- Centres éligibles (centerId - null = tous)
- Montant minimum d'achat (minAmount)

3. ACTIONS:
- Activer / Désactiver (isActive)
- Modifier
- Supprimer (si usesCount === 0)
- Voir utilisations (CouponUse)

PRISMA:
- prisma.coupon.create / update
- Validation au checkout: vérifier validité, maxUses, maxUsesPerUser

CONTRAINTES:
- Code unique, insensible à la casse (transform toUpperCase)
- Un seul coupon par commande

À LA FIN, LISTE:
- Option coupon inutile
- Points à revoir / incohérences :
```

---

### Prompt 24 — Annulation & Remboursement

```
Flow: Annulation booking

Implémente le système « Annulation & Remboursement » :

STACK:
- Prisma pour update Booking, Commission
- Stripe Refunds API

RÈGLES ANNULATION:

1. PAR LE PLONGEUR (cancelledBy: 'CLIENT'):
- Selon politique du centre (à définir dans DiveCenter)
- CTA visible seulement si annulation possible
- Update: status → 'CANCELLED', cancelledAt, cancelledBy, cancellationReason

2. PAR LE CENTRE (cancelledBy: 'CENTER'):
- Annulation possible à tout moment
- Remboursement 100% obligatoire
- Email automatique au client (Nodemailer)

3. PAR L'ADMIN (cancelledBy: 'ADMIN'):
- Annulation possible à tout moment
- Choix remboursement : 100%, partiel, 0%
- Motif obligatoire (cancellationReason)

PROCESSUS REMBOURSEMENT:
- Stripe Refund API: stripe.refunds.create({ payment_intent: stripePaymentIntentId, amount })
- Update Booking: paymentStatus → 'REFUNDED' ou 'PARTIAL_REFUND', refundedAt, refundAmount
- Update Commission: status → 'CANCELLED' ou ajuster amounts

NODEMAILER:
- Email confirmation annulation au client
- Email notification au centre

CONTRAINTES:
- Historique complet de l'annulation
- Motif stocké (cancellationReason)
- Notifications à toutes les parties

À LA FIN, LISTE:
- Cas non couvert
- Points à revoir / incohérences :
```

---

## 📧 EMAILS & SMS

---

### Prompt 25 — Configuration Emails

```
Page: /[locale]/admin/emails/settings

Implémente la page « Configuration Emails » (admin) :

STACK:
- Nodemailer avec SMTP
- Setting table pour config

FONCTIONNALITÉS:

1. PROVIDER (Setting table):
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS (masqué)
- SMTP_FROM

2. PARAMÈTRES GLOBAUX (Setting):
- Logo dans emails (email_logo_url)
- Couleurs (email_primary_color)
- Footer texte (email_footer_text)

3. ACTIVATION PAR TYPE:
- Toggle par type d'email (Setting keys: email_booking_confirmed_enabled, etc.)

4. TEST:
- Envoi email test à une adresse via Nodemailer

CONTRAINTES:
- Validation connexion SMTP avant sauvegarde
- Preview des modifications

À LA FIN, LISTE:
- Paramètre email inutile
- Points à revoir / incohérences :
```

---

### Prompt 26 — Templates Emails

```
Page: /[locale]/admin/emails/templates

Implémente la page « Templates Emails » (admin) :

STACK:
- Nodemailer
- Templates HTML stockés dans code ou Setting

TEMPLATES REQUIS:

CLIENT:
1. booking_pending - Réservation en attente
2. booking_confirmed - Réservation confirmée
3. booking_cancelled - Réservation annulée
4. booking_reminder - Rappel J-1
5. booking_completed - Plongée effectuée
6. review_request - Demande d'avis

CENTRE:
1. center_new_booking - Nouvelle réservation
2. center_cancellation - Annulation client
3. center_approved - Compte approuvé
4. center_rejected - Compte refusé

FONCTIONNALITÉS:
- Liste tous les templates
- Prévisualisation
- Variables disponibles : {{customer_name}}, {{booking_date}}, {{center_name}}, etc.
- Multilingue si possible

NODEMAILER:
- transporter.sendMail({ to, subject, html: compiledTemplate })
- Logging dans EmailLog

CONTRAINTES:
- Templates par défaut non supprimables
- Variables obligatoires par template

À LA FIN, LISTE:
- Template manquant ou superflu
- Points à revoir / incohérences :
```

---

### Prompt 27 — Paramétrage SMS

```
Page: /[locale]/admin/sms/settings

Implémente la page « Configuration SMS » (admin) :

STACK:
- Twilio (si configuré)
- Setting table pour config
- SmsLog pour tracking

FONCTIONNALITÉS:

1. PROVIDER (Setting ou .env):
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

2. TEMPLATES SMS:
- booking_reminder_client - Rappel J-1 client
- booking_reminder_center - Rappel centre
- Variables : {{name}}, {{date}}, {{center_name}}

3. ACTIVATION:
- SMS activés : toggle global
- SMS par type : toggles individuels

4. TEST:
- Envoi SMS test

PRISMA:
- Logging dans SmsLog: { toPhone, template, message, status, twilioSid }

CONTRAINTES:
- SMS courts (< 160 caractères si possible)
- Validation credentials Twilio

À LA FIN, LISTE:
- SMS inutile
- Points à revoir / incohérences :
```

---

## 🔗 INTÉGRATIONS

---

### Prompt 28 — Google Calendar

```
Feature: Intégration Google Calendar

Implémente l'intégration « Google Calendar » :

NIVEAU 1 - SANS AUTH (priorité):
- Générer URL "Ajouter à Google Calendar"
- Format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...
- Bouton visible sur confirmation booking et page réservations

DÉTAILS ÉVÉNEMENT:
- Titre : "[EviDive] {service.name} - {center.name}"
- Date/heure début : diveDate + diveTime
- Durée : durationMinutes
- Description : détails réservation, référence
- Location : center.address

STOCKAGE (optionnel):
- gcalEventId sur Booking (si sync OAuth futur)
- gcalSynced boolean

CONTRAINTES:
- Fonctionne sans authentification Google
- URL encoding correct

À LA FIN, LISTE:
- Fonctionnalité calendar superflue
- Points à revoir / incohérences :
```

---

### Prompt 29 — Google Maps

```
Feature: Intégration Google Maps

Implémente l'intégration « Google Maps » :

STACK:
- Google Maps JavaScript API
- @react-google-maps/api ou équivalent

USAGES:

1. PROFIL CENTRE:
- Carte interactive avec marker à (latitude, longitude)
- Position éditable (drag marker) → update DiveCenter
- Affichage adresse formatée

2. RECHERCHE (/search):
- Carte des centres dans une zone
- Clusters si nombreux
- Clic marker → aperçu centre (nom, note, lien)
- Filtrage carte en temps réel

3. PAGE OFFRE:
- Mini carte localisation centre
- Lien "Itinéraire" → Google Maps directions

CONTRAINTES:
- API Key sécurisée (NEXT_PUBLIC_GOOGLE_MAPS_KEY, restriction domaine)
- Lazy loading des cartes
- Fallback si API indisponible

À LA FIN, LISTE:
- Usage carte non justifié
- Points à revoir / incohérences :
```

---

## 🏷️ CONFIGURATION

---

### Prompt 30 — Catégories de plongée

```
Page: /[locale]/admin/categories

Implémente la page « Catégories de plongée » (admin) :

STACK:
- Prisma pour CRUD DiveCategory

CATÉGORIES PRÉ-DÉFINIES (seed):
1. Baptême / Découverte
2. Plongée exploration
3. Formation / Certification
4. Plongée de nuit
5. Plongée épave
6. Plongée dérivante
7. Plongée technique
8. Snorkeling / PMT
9. Excursion bateau

FONCTIONNALITÉS:
- Query: prisma.diveCategory.findMany({ orderBy: { sortOrder: 'asc' } })
- Nom multilingue (name - JSON)
- Icône (icon - string emoji ou URL)
- Ordre d'affichage (sortOrder - drag & drop)
- Actif/Inactif (isActive)

ACTIONS:
- Ajouter nouvelle catégorie
- Modifier
- Désactiver (pas supprimer si services liés)

CONTRAINTES:
- Vérifier count services avant suppression: prisma.diveService.count({ where: { categoryId } })
- Unicité du slug

À LA FIN, LISTE:
- Catégorie superflue ou manquante
- Points à revoir / incohérences :
```

---

### Prompt 31 — Conditions Générales (CGV)

```
Page: /[locale]/terms + /[locale]/admin/legal

Implémente les pages « Conditions Générales » :

STACK:
- Setting table pour contenu CGV
- Markdown ou HTML

PAGE PUBLIQUE (/terms):
- Affichage CGV depuis Setting (key='terms_content')
- Multilingue : Setting keys terms_content_fr, terms_content_en, etc.
- Sections navigables (ancres)
- Date dernière mise à jour (Setting key='terms_updated_at')

ADMIN (/admin/legal):
- Éditeur CGV (textarea ou rich text)
- Tabs FR/EN/DE/ES/IT
- Sauvegarde: prisma.setting.upsert()

CONTRAINTES:
- Checkbox CGV obligatoire à l'inscription et au checkout

À LA FIN, LISTE:
- Section légale manquante
- Points à revoir / incohérences :
```

---

### Prompt 32 — Multilingue (i18n)

```
Feature: Système i18n

Implémente/Vérifie le système « Multilingue » :

STACK:
- next-intl
- Messages JSON

LANGUES SUPPORTÉES:
- FR (default)
- EN
- DE
- ES
- IT

FICHIERS MESSAGES:
- src/messages/fr.json
- src/messages/en.json
- src/messages/de.json
- src/messages/es.json
- src/messages/it.json

VÉRIFICATIONS:
1. Toutes les clés présentes dans TOUTES les langues
2. Aucun texte hardcodé dans les composants
3. Formatage dates/nombres via useFormatter
4. Métadata traduites (generateMetadata)
5. URLs avec préfixe locale (/fr/..., /en/...)

CONTENU DYNAMIQUE (JSON dans Prisma):
- DiveService.name, description
- DiveCenter.name, description
- DiveCategory.name
- Accès via locale: content[locale] || content['fr']

SÉLECTEUR LANGUE:
- Présent dans header
- Sauvegarde Profile.preferredLanguage si connecté
- Cookie pour visiteurs non connectés

CONTRAINTES:
- setRequestLocale() dans chaque page/layout
- Fallback vers FR si clé manquante

À LA FIN, LISTE:
- Clé manquante ou incohérente
- Texte hardcodé trouvé
- Points à revoir / incohérences :
```

---

## 👑 ADMINISTRATION

---

### Prompt 33 — Admin Dashboard

```
Page: /[locale]/admin

Implémente le « Dashboard Admin » :

STACK:
- Auth.js (vérifier userType === 'ADMIN')
- Prisma agrégations

WIDGETS:

1. STATISTIQUES GLOBALES:
- Utilisateurs totaux: prisma.profile.count({ where: { userType: 'DIVER' } })
- Centres actifs: prisma.diveCenter.count({ where: { status: 'APPROVED' } })
- Réservations du mois: prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } })
- Revenus plateforme: sum commissions.commissionAmount

2. EN ATTENTE:
- Centres en attente: prisma.diveCenter.count({ where: { status: 'PENDING' } })
- Avis en attente: prisma.review.count({ where: { status: 'PENDING' } })

3. ACTIVITÉ RÉCENTE:
- 10 dernières actions (bookings, reviews récents)

4. ACTIONS RAPIDES:
- Approuver centres
- Modérer avis
- Gérer coupons

CONTRAINTES:
- Accès admin uniquement (middleware ou check userType)

À LA FIN, LISTE:
- Widget admin superflu
- Points à revoir / incohérences :
```

---

### Prompt 34 — Gestion Utilisateurs (Admin)

```
Page: /[locale]/admin/users

Implémente la page « Gestion Utilisateurs » (admin) :

STACK:
- Prisma pour queries/updates Profile

FONCTIONNALITÉS:

1. LISTE UTILISATEURS:
- Query: prisma.profile.findMany({ where: { userType: 'DIVER' }, orderBy: { createdAt: 'desc' } })
- Recherche par nom, email
- Filtres : isActive, isBlacklisted
- Pagination

2. DÉTAIL UTILISATEUR:
- Toutes infos profil
- Historique réservations: prisma.booking.findMany({ where: { userId } })
- Avis laissés: prisma.review.findMany({ where: { userId } })

3. ACTIONS:
- Désactiver compte: isActive = false
- Réactiver compte: isActive = true
- Blacklister email: isBlacklisted = true
- Supprimer compte (RGPD): soft delete ou anonymisation

CONTRAINTES:
- Logs de toutes les actions admin
- Confirmation pour actions destructives

À LA FIN, LISTE:
- Action admin inappropriée
- Points à revoir / incohérences :
```

---

### Prompt 35 — Gestion Centres (Admin)

```
Page: /[locale]/admin/centers

Implémente la page « Gestion Centres » (admin) :

STACK:
- Prisma pour queries/updates DiveCenter

FONCTIONNALITÉS:

1. LISTE CENTRES:
- Query: prisma.diveCenter.findMany({ include: { owner: true } })
- Filtres : status (PENDING, APPROVED, REJECTED, SUSPENDED)
- Recherche par nom
- Pagination

2. EN ATTENTE:
- Section prioritaire: prisma.diveCenter.findMany({ where: { status: 'PENDING' } })
- Détail complet de la demande
- Boutons Approuver / Refuser

3. ACTIONS:
- Approuver: status → 'APPROVED', approvedAt = new Date()
- Refuser: status → 'REJECTED' (+ motif en commentaire ou email)
- Suspendre: status → 'SUSPENDED'
- Réactiver: status → 'APPROVED'
- Modifier commission: commissionRate

NODEMAILER:
- Emails automatiques à chaque changement status (center_approved, center_rejected)

CONTRAINTES:
- Historique des actions

À LA FIN, LISTE:
- Action admin incohérente
- Points à revoir / incohérences :
```

---

### Prompt 36 — Modération Avis (Admin)

```
Page: /[locale]/admin/reviews

Implémente la page « Modération Avis » (admin) :

STACK:
- Prisma pour queries/updates Review

FONCTIONNALITÉS:

1. AVIS EN ATTENTE:
- Query: prisma.review.findMany({ where: { status: 'PENDING' }, include: { user: true, center: true, booking: true }, orderBy: { createdAt: 'asc' } })

2. CARD AVIS:
- Auteur (user.firstName + historique count)
- Centre concerné (center.name)
- Note (rating)
- Texte complet (comment)
- Photos (photos)
- Booking associé (booking.diveDate)

3. ACTIONS:
- Approuver: status → 'APPROVED', moderatedById, moderatedAt
  - Trigger: update center.rating (recalcul moyenne)
  - Trigger: update center.reviewCount++
- Rejeter: status → 'REJECTED', moderationNote (motif obligatoire)
  - Email notification auteur si rejeté

4. AVIS SIGNALÉS:
- Section avis avec reports (si feature existe)

CONTRAINTES:
- Email notification auteur si rejeté (Nodemailer)
- Motif rejet obligatoire (moderationNote)

À LA FIN, LISTE:
- Critère modération manquant
- Points à revoir / incohérences :
```

---

## 🔔 NOTIFICATIONS

---

### Prompt 37 — Notifications In-App

```
Feature: Système Notifications In-App

Implémente le système « Notifications » :

STACK:
- Prisma pour CRUD Notification
- Polling ou Prisma subscription

COMPOSANT HEADER:
- Icône cloche avec badge count (unread)
- Query: prisma.notification.count({ where: { userId, isRead: false } })
- Dropdown au clic avec liste notifications

DROPDOWN:
- Query: prisma.notification.findMany({ where: { userId }, take: 10, orderBy: { createdAt: 'desc' } })
- Pour chaque : type icon, title, message, createdAt (relatif)
- Clic → navigation vers linkUrl
- Bouton "Tout marquer comme lu": update isRead = true pour tous

PAGE NOTIFICATIONS (/notifications):
- Liste complète paginée
- Filtres par type
- Actions : marquer lu, supprimer

TYPES NOTIFICATIONS (type field):
- booking_confirmed
- booking_cancelled
- review_received
- review_published
- center_approved

CRÉATION (Server Actions ou Triggers):
- À chaque événement, créer Notification pour user concerné

CONTRAINTES:
- Polling 30s ou refresh manuel
- Max 100 notifications stockées par user (cleanup)

À LA FIN, LISTE:
- Type notification inutile
- Points à revoir / incohérences :
```

---

## 🔒 SÉCURITÉ

---

### Prompt 38 — Sécurité & Logs

```
Feature: Sécurité et Audit

Implémente le système « Sécurité » :

STACK:
- Auth.js pour sessions
- Middleware Next.js pour protection routes
- Prisma pour logs

AUTHENTIFICATION:
- Auth.js avec Credentials provider
- Sessions JWT ou database sessions
- Cookies httpOnly

AUTORISATION:
- Middleware: vérifier session + userType
- Protected routes: /app/* (DIVER), /center/* (CENTER_OWNER), /admin/* (ADMIN)

RATE LIMITING:
- Login : 5/15min
- Register : 3/heure
- API endpoints sensibles

LOGS ADMIN (/admin/logs):
- Table AuditLog (à créer si besoin)
- Actions admin (approve, reject, suspend, delete)
- Tentatives login échouées
- Filtres : date, type, user

HEADERS SÉCURITÉ (next.config.ts):
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

CONTRAINTES:
- Aucun secret dans le code (utiliser .env)
- Variables env pour tout secret

À LA FIN, LISTE:
- Faille potentielle
- Points à revoir / incohérences :
```

---

## 💾 BASE DE DONNÉES

---

### Prompt 39 — Base de données

```
Feature: Schéma Prisma et Migrations

Vérifie/Documente la « Base de données » :

STACK:
- Prisma ORM
- Prisma Accelerate (caching)
- PostgreSQL

TABLES PRINCIPALES (voir schema.prisma):
- Profile (utilisateurs)
- DiveCenter (centres)
- DiveCategory (catégories)
- DiveService (services/plongées)
- ServiceExtra (options)
- CenterWorker (équipe)
- Booking (réservations)
- BookingExtra (extras réservés)
- WaitingListEntry (liste attente)
- Review (avis)
- Coupon, CouponUse
- EmailLog, SmsLog
- Notification
- Commission
- CenterBlockedDate
- Setting

INDEXES:
- Vérifier indexes sur foreign keys
- Indexes sur colonnes de recherche (email, slug)
- Indexes sur dates (createdAt, diveDate)

MIGRATIONS:
- Utiliser prisma migrate dev pour développement
- prisma migrate deploy pour production

SEED:
- prisma/seed.ts pour données initiales (catégories, admin)

CONTRAINTES:
- Pas de DELETE CASCADE sur données critiques
- Soft delete préféré (isActive = false)
- CUID pour tous les IDs

À LA FIN, LISTE:
- Table manquante
- Index manquant
- Points à revoir / incohérences :
```

---

## 📋 PLANNING

---

### Prompt 40 — Planning projet

```
Document: Planning et Priorités

Génère un document « Planning » :

PRIORITÉ 1 - CRITIQUE (Blocker déploiement):
- [ ] Auth complète (Auth.js + Prisma)
- [ ] Flow réservation end-to-end
- [ ] Paiement Stripe fonctionnel
- [ ] Emails transactionnels de base (Nodemailer)

PRIORITÉ 2 - IMPORTANT:
- [ ] Dashboard plongeur
- [ ] Dashboard centre
- [ ] Gestion réservations centre
- [ ] Système avis

PRIORITÉ 3 - NÉCESSAIRE:
- [ ] Notifications in-app
- [ ] Statistiques centre
- [ ] Admin dashboard
- [ ] Modération avis

PRIORITÉ 4 - NICE TO HAVE:
- [ ] Google Calendar URL
- [ ] SMS Twilio
- [ ] Export CSV
- [ ] Actions en masse admin

DÉPENDANCES:
- Paiement → Stripe Connect setup
- Emails → SMTP config
- SMS → Twilio config

VERCEL DEPLOYMENT:
- Vérifier variables env sur Vercel
- Prisma Accelerate connection string
- Build: prisma generate && next build

À LA FIN, LISTE:
- Tâche mal priorisée
- Dépendance manquante
- Points à revoir / incohérences :
```

---

## ✅ RÉCAPITULATIF AGENTS

| # | Page/Feature | Fichier principal | Stack clé |
|---|---|---|---|
| 01 | Création compte Plongeur | `/register/page.tsx` | Auth.js, Prisma, bcrypt |
| 02 | Connexion | `/login/page.tsx` | Auth.js signIn() |
| 03 | Mot de passe oublié | `/forgot-password/page.tsx` | Nodemailer, token |
| 04 | Reset mot de passe | `/reset-password/page.tsx` | Prisma, bcrypt |
| 05 | Inscription Centre | `/register/center/page.tsx` | Prisma, multi-step |
| 06 | Profil Utilisateur | `/profile/page.tsx` | Prisma Profile |
| 07 | Dashboard Plongeur | `/app/page.tsx` | Prisma queries |
| 08 | Réservations Plongeur | `/bookings/page.tsx` | Prisma Booking |
| 09 | Avis Plongeur | `/reviews/page.tsx` | Prisma Review |
| 10 | Paramètres Plongeur | `/settings/page.tsx` | Prisma Profile |
| 11 | Dashboard Centre | `/center/page.tsx` | Prisma aggregations |
| 12 | Profil Centre | `/center/settings/page.tsx` | Prisma DiveCenter |
| 13 | Gestion Services | `/center/services/page.tsx` | Prisma DiveService |
| 14 | Calendrier Centre | `/center/calendar/page.tsx` | Prisma, dates |
| 15 | Réservations Centre | `/center/bookings/page.tsx` | Prisma Booking |
| 16 | Avis Centre | `/center/reviews/page.tsx` | Prisma Review |
| 17 | Statistiques Centre | `/center/stats/page.tsx` | Prisma groupBy |
| 18 | Paramètres Centre | `/center/settings/page.tsx` | Prisma DiveCenter |
| 19 | Équipe Centre | `/center/team/page.tsx` | Prisma CenterWorker |
| 20 | Flow Réservation | `/offer/[id]` + `/checkout` | Prisma, Stripe |
| 21 | Paiement | `/api/checkout` + webhooks | Stripe, Prisma |
| 22 | Commissions | `/admin/commissions/page.tsx` | Prisma Commission |
| 23 | Coupons | `/admin/coupons/page.tsx` | Prisma Coupon |
| 24 | Annulation | Server actions | Stripe Refunds |
| 25 | Config Emails | `/admin/emails/settings` | Nodemailer, Setting |
| 26 | Templates Emails | `/admin/emails/templates` | Nodemailer |
| 27 | Config SMS | `/admin/sms/settings` | Twilio |
| 28 | Google Calendar | Helpers | URL generation |
| 29 | Google Maps | Composants | Maps API |
| 30 | Catégories | `/admin/categories/page.tsx` | Prisma DiveCategory |
| 31 | CGV | `/terms` + `/admin/legal` | Setting |
| 32 | i18n | `/messages/*.json` | next-intl |
| 33 | Admin Dashboard | `/admin/page.tsx` | Prisma counts |
| 34 | Gestion Users | `/admin/users/page.tsx` | Prisma Profile |
| 35 | Gestion Centres | `/admin/centers/page.tsx` | Prisma DiveCenter |
| 36 | Modération Avis | `/admin/reviews/page.tsx` | Prisma Review |
| 37 | Notifications | NotificationDropdown | Prisma Notification |
| 38 | Sécurité & Logs | middleware | Auth.js |
| 39 | Base de données | `/prisma/schema.prisma` | Prisma |
| 40 | Planning | Document | - |

---

**Stack Technique Résumé:**
```
Framework:    Next.js 16 + React 19
Styling:      Tailwind CSS v4 + Shadcn/ui
Database:     Prisma + Prisma Accelerate (PostgreSQL)
Auth:         Auth.js (NextAuth v5) + bcryptjs
Email:        Nodemailer (SMTP)
SMS:          Twilio (optionnel)
Payment:      Stripe Checkout + Connect
i18n:         next-intl (FR, EN, DE, ES, IT)
Deployment:   Vercel
Validation:   Zod
State:        Zustand
```

---

**Rappel pour chaque agent :**
1. Implémente UNIQUEMENT la page assignée
2. Utilise **Prisma** (pas Supabase)
3. Utilise **Auth.js** (pas Supabase Auth)
4. Utilise **Nodemailer** (pas Brevo)
5. Nettoie, vérifie, structure
6. Output final obligatoire : `Points à revoir / incohérences :`
