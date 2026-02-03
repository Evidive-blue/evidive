# Création de Centres Additionnels

## Vue d'ensemble

Cette fonctionnalité permet aux propriétaires de centres de plongée (CENTER_OWNER) de créer plusieurs centres depuis leur dashboard sans avoir à créer un nouveau compte pour chaque centre.

## Fonctionnalités

### Pour les Propriétaires de Centres

- **Création simplifiée** : Les informations de compte (email, nom, téléphone) sont automatiquement récupérées du profil existant
- **Pas de re-création de compte** : Utilise le compte actuel pour créer des centres additionnels
- **Géolocalisation** : Intégration avec OpenStreetMap Nominatim pour géolocaliser automatiquement les adresses
- **Multilingue** : Interface disponible en français, anglais, espagnol, allemand et italien

### Workflow

1. Le propriétaire se connecte à son dashboard (`/dashboard/center`)
2. Clique sur "Créer un autre centre"
3. Remplit le formulaire avec :
   - Informations du centre (nom, description, téléphone, réseaux sociaux)
   - Localisation (adresse complète + géolocalisation)
4. Le centre est créé avec le statut `PENDING` en attente de validation admin
5. Une notification email est envoyée à l'administrateur

## Fichiers Créés/Modifiés

### Nouveaux Fichiers

1. **Action Server** : `src/app/[locale]/onboard/center/actions.ts`
   - Nouvelle fonction `createAdditionalCenter()` qui :
     - Vérifie l'authentification
     - Valide les données du centre et de la localisation
     - Récupère automatiquement les infos du profil utilisateur
     - Crée le centre avec un slug unique
     - Envoie une notification à l'admin

2. **Page Dashboard** : `src/app/[locale]/dashboard/center/create/page.tsx`
   - Page protégée (CENTER_OWNER ou ADMIN uniquement)
   - Affiche le formulaire de création

3. **Composant Formulaire** : `src/components/dashboard/create-center-form.tsx`
   - Formulaire client-side avec validation
   - Géolocalisation via bouton dédié
   - Gestion des erreurs et états de chargement
   - Toast notifications pour le feedback utilisateur

### Fichiers Modifiés

1. **Dashboard Centre** : `src/app/[locale]/dashboard/center/page.tsx`
   - Bouton "Créer un autre centre" redirige vers `/dashboard/center/create`

2. **Traductions** : `src/messages/{locale}.json`
   - Ajout de la section `dashboard.center.create` avec :
     - Titres et labels de formulaire
     - Messages d'erreur
     - Confirmations de succès
   - Langues supportées : fr, en, es, de, it

## Structure des Données

### Input (createAdditionalCenter)

```typescript
centerInfo: {
  centerName: string;        // Nom du centre (min 2 caractères)
  description: string;       // Description (min 20 caractères)
  website?: string;          // URL du site web (optionnel)
  facebook?: string;         // URL Facebook (optionnel)
  instagram?: string;        // Username Instagram (optionnel)
  centerPhone?: string;      // Téléphone du centre (optionnel)
}

locationData: {
  address: string;           // Adresse complète
  city: string;              // Ville
  postalCode?: string;       // Code postal (optionnel)
  country: string;           // Pays
  latitude: number;          // Latitude (requise)
  longitude: number;         // Longitude (requise)
}
```

### Output (ActionResult)

```typescript
{
  success: boolean;
  error?: string;
  errorCode?: "VALIDATION_FAILED" | "CENTER_REGISTER_FAILED";
  data?: {
    profileId: string;
    centerId: string;
  };
}
```

## Sécurité

- **Authentification requise** : Seuls les utilisateurs connectés peuvent accéder
- **Autorisation** : Vérification du `userType` (CENTER_OWNER ou ADMIN)
- **Validation des données** : Utilisation de Zod schemas (`centerInfoSchema`, `centerLocationSchema`)
- **Slug unique** : Génération avec timestamp pour éviter les doublons

## Base de Données

Le centre créé est inséré dans la table `dive_centers` avec :
- `ownerId` : ID du profil utilisateur actuel
- `status: "PENDING"` : En attente de validation admin
- Contenu multilingue (name, description) dupliqué pour toutes les langues
- Slug unique généré automatiquement

## Notifications

Lors de la création d'un centre :
1. Email envoyé à l'admin (`ADMIN_EMAIL` env var)
2. Template : `center_pending`
3. Métadonnées : `centerId`, `ownerProfileId`, `centerEmail`

## Routes

- **Page de création** : `/[locale]/dashboard/center/create`
- **API Action** : `createAdditionalCenter` (server action)
- **Redirection après succès** : `/[locale]/dashboard/center`

## Tests Recommandés

1. Créer un compte CENTER_OWNER
2. Créer un premier centre via onboarding
3. Accéder au dashboard et cliquer sur "Créer un autre centre"
4. Vérifier que les champs de compte ne sont pas présents
5. Remplir le formulaire et géolocaliser
6. Vérifier la création et le statut PENDING
7. Vérifier l'email admin
8. Valider que le centre apparaît dans le dashboard

## Améliorations Futures

- [ ] Upload de photos lors de la création
- [ ] Pré-remplissage de l'adresse depuis le profil
- [ ] Duplication d'un centre existant comme template
- [ ] Import en masse de centres via CSV
- [ ] Carte interactive pour sélectionner la localisation
