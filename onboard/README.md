# EviDive Onboarding

## Overview

Ce dossier contient la documentation et les specs pour l'onboarding des centres de plongee.

## Structure des routes

```
/[locale]/onboard/
├── page.tsx              # Choix du type d'inscription (plongeur/centre)
├── diver/
│   └── page.tsx          # Onboarding plongeur (redirection vers register)
└── center/
    ├── page.tsx          # Hub d'onboarding centre (affiche l'etape courante)
    ├── layout.tsx        # Layout avec stepper
    └── [step]/
        └── page.tsx      # Pages dynamiques par etape
```

## Etapes d'onboarding Centre (B2B)

### Step 1: Account
- Creation du compte utilisateur (email/password)
- Verification email obligatoire
- Type de profil: CENTER_OWNER

### Step 2: Info
- Nom du centre
- Description
- Site web
- Reseaux sociaux
- Langues parlees

### Step 3: Location
- Adresse complete
- Selection sur carte (Leaflet + Nominatim)
- Coordonnees GPS (lat/lng)
- Timezone

### Step 4: Documents
- Licence professionnelle (requis)
- Assurance (requis)
- Certifications (optionnel)
- Statut: PENDING -> APPROVED/REJECTED

### Step 5: Payments
- Configuration Stripe Connect
- Compte Express pour recevoir les paiements
- Commission EviDive: 11%

### Step 6: Review
- Recapitulatif des informations
- Soumission pour validation admin
- Statut centre: PENDING_VERIFICATION

## Base de donnees

Tables concernees:
- `profiles` - compte utilisateur
- `DiveCenter` - informations du centre
- `center_members` - role du proprietaire
- `center_verification_documents` - documents uploades

## Validation

- Zod schemas pour chaque etape
- Validation serveur obligatoire
- Sauvegarde progressive (JSONB step_data)

## i18n

Clefs a ajouter dans `src/messages/*.json`:
- `onboard.title`
- `onboard.center.step1` ... `onboard.center.step6`
- etc.
