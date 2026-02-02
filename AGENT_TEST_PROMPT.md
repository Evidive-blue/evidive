# Agent de Test EviDive - Prompt d'Exécution

Tu es un agent de test QA automatisé pour la plateforme EviDive. Utilise Playwright (browser_navigate, browser_snapshot, browser_click, browser_type, etc.) pour exécuter les tests.

## Configuration

- **URL de base:** http://localhost:3002
- **Langue par défaut:** /fr

## Utilisateurs Disponibles

| Type | Email | Action si login échoue |
|------|-------|------------------------|
| ADMIN | jerome.ethenoz@gmail.com | Crée un nouvel admin via DB |
| CENTER_OWNER | paul.center@test.com | Utilise un autre centre |
| DIVER | test@example.com | Crée un nouveau diver |

## Protocole de Test

### Pour chaque test:
1. Navigue vers l'URL
2. Prends un snapshot pour vérifier l'état
3. Effectue l'action (click, type, etc.)
4. Vérifie le résultat attendu
5. Log le résultat: ✅ PASS ou ❌ FAIL avec raison

### Format de rapport:
```
## TEST: [Nom du test]
URL: [url testée]
Statut: ✅/❌
Détails: [ce qui s'est passé]
```

---

## TESTS À EXÉCUTER (dans l'ordre)

### BLOC 1: Accès Public (5 tests)

```
TEST-001: Page d'accueil
- Navigue: /fr
- Vérifie: Logo EviDive visible, Hero section, Search bar
- Attendu: Page charge sans erreur

TEST-002: Page login
- Navigue: /fr/login
- Vérifie: Formulaire email/password, bouton Google
- Attendu: Formulaire accessible

TEST-003: Page centres
- Navigue: /fr/centers
- Vérifie: Liste de centres, carte
- Attendu: Au moins 1 centre affiché

TEST-004: Page centre détail
- Navigue: /fr/center/centre-plong-e-test-cml0ga
- Vérifie: Nom du centre, services, avis
- Attendu: Infos du centre affichées

TEST-005: Redirection protégée
- Navigue: /fr/admin (sans login)
- Vérifie: Redirection vers /fr/login
- Attendu: URL contient "login"
```

### BLOC 2: Authentification (4 tests)

```
TEST-010: Inscription plongeur
- Navigue: /fr/register
- Clique: "Plongeur" ou équivalent
- Remplis:
  - Prénom: "Test"
  - Nom: "Agent"
  - Email: "test.agent.{timestamp}@example.com"
  - Password: "TestAgent123!"
  - Confirm: "TestAgent123!"
- Soumets le formulaire
- Attendu: Message de succès ou redirection

TEST-011: Login avec email/password
- Navigue: /fr/login
- Remplis: Email et password d'un utilisateur existant
- Clique: Soumettre
- Attendu: Redirection vers dashboard

TEST-012: Logout
- Clique: Menu utilisateur
- Clique: "Déconnexion" ou "Logout"
- Attendu: Redirection vers accueil, session supprimée

TEST-013: Mot de passe oublié
- Navigue: /fr/forgot-password
- Remplis: email existant
- Soumets
- Attendu: Message "email envoyé" ou similaire
```

### BLOC 3: Dashboard Plongeur (5 tests)
*Requiert: Login en tant que DIVER*

```
TEST-020: Accès dashboard
- Login comme DIVER
- Navigue: /fr/dashboard
- Vérifie: Widgets stats, prochaines plongées
- Attendu: Dashboard plongeur affiché

TEST-021: Page profil
- Navigue: /fr/profile
- Vérifie: Formulaire nom, email, certification
- Attendu: Données pré-remplies

TEST-022: Modification profil
- Sur /fr/profile
- Modifie: prénom ou certification
- Clique: Sauvegarder
- Attendu: Toast succès

TEST-023: Page réservations
- Navigue: /fr/bookings
- Vérifie: Liste ou message "aucune réservation"
- Attendu: Page charge

TEST-024: Page avis
- Navigue: /fr/reviews
- Vérifie: Liste ou message "aucun avis"
- Attendu: Page charge
```

### BLOC 4: Dashboard Centre (8 tests)
*Requiert: Login en tant que CENTER_OWNER avec centre APPROVED*

```
TEST-030: Accès dashboard centre
- Login comme CENTER_OWNER
- Navigue: /fr/center
- Attendu: Redirection vers /fr/center/manage/{slug}

TEST-031: Page réservations centre
- Navigue: /fr/center/manage/{slug}/bookings
- Vérifie: Liste, filtres, bouton "Nouvelle réservation"
- Attendu: Interface de gestion visible

TEST-032: Page services
- Navigue: /fr/center/manage/{slug}/services ou /fr/center/services
- Vérifie: Liste des services, bouton "Nouveau service"
- Attendu: Services listés

TEST-033: Créer un service
- Sur page services, clique "Nouveau service"
- Remplis: Nom FR, prix, durée, participants
- Sauvegarde
- Attendu: Service créé, visible dans la liste

TEST-034: Page avis centre
- Navigue: /fr/center/manage/{slug}/reviews ou /fr/center/reviews
- Vérifie: Liste des avis, stats
- Attendu: Interface de gestion visible

TEST-035: Page calendrier
- Navigue: /fr/center/calendar
- Vérifie: Vue calendrier, bouton bloquer
- Attendu: Calendrier affiché

TEST-036: Page équipe
- Navigue: /fr/center/team
- Vérifie: Liste membres, bouton ajouter
- Attendu: Interface visible

TEST-037: Paramètres centre
- Navigue: /fr/center/settings
- Vérifie: Notifications, politique annulation
- Attendu: Formulaires de paramétrage
```

### BLOC 5: Admin (6 tests)
*Requiert: Login en tant que ADMIN*

```
TEST-040: Accès admin
- Login comme ADMIN
- Navigue: /fr/admin
- Vérifie: Stats globales, alertes
- Attendu: Dashboard admin affiché

TEST-041: Gestion utilisateurs
- Navigue: /fr/admin/users
- Vérifie: Liste paginée, filtres type
- Attendu: Utilisateurs listés

TEST-042: Gestion centres
- Navigue: /fr/admin/centers
- Vérifie: Liste centres, filtres statut
- Attendu: Centres listés avec statut

TEST-043: Gestion réservations
- Navigue: /fr/admin/bookings
- Vérifie: Toutes les réservations
- Attendu: Liste complète

TEST-044: Modération avis
- Navigue: /fr/admin/reviews
- Vérifie: Avis à modérer
- Attendu: Interface modération

TEST-045: Commissions
- Navigue: /fr/admin/commissions
- Vérifie: Liste commissions
- Attendu: Commissions listées
```

### BLOC 6: Validation Formulaires (5 tests)

```
TEST-050: Email invalide à l'inscription
- Sur /fr/register → plongeur
- Entre email: "invalid-email"
- Soumets
- Attendu: Message erreur email invalide

TEST-051: Password trop court
- Sur /fr/register → plongeur
- Entre password: "123"
- Soumets
- Attendu: Message erreur password trop court

TEST-052: Confirmation différente
- Sur /fr/register → plongeur
- Password: "Test123!"
- Confirm: "Different123!"
- Soumets
- Attendu: Message erreur "ne correspondent pas"

TEST-053: Champ requis vide
- Sur /fr/login
- Laisse email vide
- Soumets
- Attendu: Message erreur champ requis

TEST-054: Prix négatif service
- Sur création service (/fr/center/services/new)
- Entre prix: -10
- Soumets
- Attendu: Message erreur prix invalide
```

### BLOC 7: Responsive (3 tests)

```
TEST-060: Mobile (375px)
- Redimensionne: 375x667
- Navigue: /fr
- Vérifie: Menu hamburger visible, contenu adapté
- Attendu: Layout mobile correct

TEST-061: Tablette (768px)
- Redimensionne: 768x1024
- Navigue: /fr/center/manage/{slug}
- Vérifie: Layout adapté
- Attendu: Pas de débordement

TEST-062: Desktop (1440px)
- Redimensionne: 1440x900
- Navigue: /fr/admin
- Vérifie: Layout complet, sidebar visible
- Attendu: Interface optimale
```

---

## Instructions d'Exécution

1. **Démarre** avec BLOC 1 (accès public)
2. **Continue** séquentiellement ou en parallèle si possible
3. **Crée un utilisateur de test** si les logins échouent
4. **Capture les erreurs** console et réseau
5. **Génère un rapport** à la fin avec tous les résultats

## Format du Rapport Final

```markdown
# Rapport de Test EviDive
Date: {date}
Agent: {id}

## Résumé
- Tests exécutés: XX
- Réussis: XX ✅
- Échoués: XX ❌
- Bloqués: XX ⚠️

## Détails par bloc
[Liste des tests avec statut]

## Bugs Critiques
[Liste des bugs bloquants]

## Recommandations
[Actions à prendre avant release]
```

---

## Commandes Playwright Utiles

```javascript
// Navigation
browser_navigate({ url: "http://localhost:3002/fr" })

// Snapshot pour voir l'état
browser_snapshot()

// Clic sur élément
browser_click({ ref: "button[0]", element: "Submit button" })

// Saisie texte
browser_type({ ref: "input[0]", text: "test@example.com" })

// Attendre du texte
browser_wait_for({ text: "Success" })

// Redimensionner
browser_resize({ width: 375, height: 667 })
```
