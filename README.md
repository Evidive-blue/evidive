# EviDive v2 - Plateforme de Réservation de Plongées

## 🎯 Architecture Simplifiée

```
VISITEUR → DIVER → DIVER + CENTER
   👀        🤿         🤿 + 🏢
 Browse    Achète    Achète + Vend
```

### 3 Types d'utilisateurs :
1. **VISITEUR** (non connecté) : Browse uniquement
2. **DIVER** (connecté) : Achète des plongées
3. **DIVER + CENTER** : Achète + Vend via son/ses centre(s)
4. **ADMIN** : Valide centres, gère tout

## 🚀 Stack Technique

- **Framework** : Next.js 16.1.6 (App Router)
- **UI** : React 19.2.3
- **Styling** : Tailwind CSS v4
- **Database** : Neon PostgreSQL
- **ORM** : Prisma 6
- **Auth** : NextAuth v5
- **Payments** : Stripe
- **i18n** : Custom (11 langues)
- **Deploy** : Vercel

## 📦 Installation

```bash
# Installer dépendances
npm install

# Générer Prisma Client
npm run db:generate

# Push schema vers DB (Neon)
npm run db:push

# Seed base de données
npm run db:seed

# Lancer dev server
npm run dev
```

## 🗃️ Base de données (Neon)

```bash
# Prisma Studio (GUI)
npm run db:studio

# Générer migration
npx prisma migrate dev --name nom_migration

# Reset DB (DANGER)
npx prisma migrate reset
```

## 🔑 Variables d'environnement

Copier `.env.example` vers `.env` et remplir :

```env
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## 📝 Comptes de test

Après `npm run db:seed` :

- **Admin** : admin@evidive.blue / Admin123!
- **Diver** : diver@evidive.blue / Diver123!

## 🏗️ Structure

```
frontend/
├── app/                    # App Router (SANS préfixe langue)
│   ├── (public)/          # Routes publiques
│   ├── (auth)/            # Login, Register
│   ├── (dashboard)/       # Dashboard, Bookings, Centers
│   └── api/               # API Routes
├── components/            # Composants réutilisables
│   ├── ui/               # Shadcn components
│   ├── layout/           # Header, Footer
│   ├── home/             # Homepage sections
│   └── centers/          # Centre components
├── lib/                   # Utilitaires
│   ├── auth/             # NextAuth config
│   ├── db/               # Prisma client
│   ├── validations/      # Zod schemas
│   └── i18n/             # i18n system
├── prisma/
│   ├── schema.prisma     # DB Schema
│   └── seed.ts           # Seed data
└── messages/             # Traductions (11 langues)
```

## 🌍 Internationalisation (i18n)

**Nouveau système SANS préfixes dans URLs**

Avant : `/fr/about`, `/en/about`  
Après : `/about` (détection auto langue)

- Détection auto via `Accept-Language` header
- Stockage dans cookie `NEXT_LOCALE`
- Middleware transparent
- 11 langues supportées

## 🎨 Design Système

**Thème océanique immersif**

- Palette ocean depth (surface → abyss)
- Animations : float, bubble, light-ray
- Glass morphism
- Dark/Light modes
- OKLCH color system

## 📊 Modèles de données

### Relations principales

```
DIVER (1) ──owns──> (N) CENTER
DIVER (1) ──makes──> (N) BOOKING
CENTER (1) ──offers──> (N) SERVICE
CENTER (1) ──receives──> (N) BOOKING
SERVICE (1) ──includes──> (N) BOOKING
```

### Workflow centre

1. DIVER crée centre → `CENTER` (status: PENDING)
2. ADMIN approuve → `CENTER` (status: APPROVED)
3. DIVER configure Stripe → `CENTER` (stripe_account_id)
4. DIVER crée services → `SERVICE`
5. Autres DIVER achètent → `BOOKING`

## 🛣️ Routes principales

### Public
- `/` - Homepage
- `/about` - À propos
- `/centers` - Liste centres
- `/centers/[slug]` - Détail centre
- `/explorer` - Explorateur global

### Auth
- `/login` - Connexion
- `/register` - Inscription
- `/forgot-password` - Mot de passe oublié

### Dashboard
- `/dashboard` - Dashboard principal
- `/bookings` - Mes réservations
- `/centers` - Mes centres (si owner)
- `/centers/[slug]/manage` - Gérer un centre
- `/admin` - Panel admin (ADMIN only)

## 🔐 Authentification

NextAuth v5 avec :
- Credentials (email/password)
- Google OAuth
- JWT sessions
- Role-based access

## 💳 Paiements

Stripe avec :
- Payment Intents
- Checkout Sessions
- Webhooks
- Commissions tracking
- Multi-currency

## 📧 Notifications

- In-app (DB)
- Email (Nodemailer)
- SMS (optionnel, Twilio)

## 🧪 Tests

```bash
# Tests E2E Playwright
npm run test:e2e

# Lint
npm run lint
```

## 🚢 Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

## 📚 Documentation

- [Schema Relations](../SCHEMA_RELATIONS.md)
- [Discussion Fonctionnalités](../DISCUSSION_FONCTIONNALITES.md)
- [Plan Refonte](~/.cursor/plans/refonte_evidive_v2_*.plan.md)

## 🐛 Troubleshooting

### Erreur Prisma

```bash
rm -rf node_modules .next
npm install
npm run db:generate
```

### Erreur i18n

Vérifier cookie `NEXT_LOCALE` dans DevTools

### Erreur Stripe

Vérifier webhook secret et mode (test/prod)

---

**Version** : 2.0.0  
**License** : Propriétaire  
**Contact** : armando.romano@bluewin.ch
# V2_EviDive
