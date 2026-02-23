# Evidive Frontend

Projet Next.js 16 avec Framer Motion, Shadcn/ui, Tailwind CSS v4, ESLint strict, Prettier et i18n complet.

## Stack technique

- **Next.js** 16.1.6 (App Router)
- **React** 19.2.3
- **TypeScript** 5 (mode strict)
- **Tailwind CSS** v4
- **Shadcn/ui** (composants UI)
- **Framer Motion** 11.11.17 (animations)
- **next-intl** 3.22.4 (i18n)
- **ESLint** (mode strict)
- **Prettier** (formatage)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur. La locale est détectée automatiquement via les cookies ou le header `Accept-Language` du navigateur. **Aucun préfixe de locale dans l'URL**.

## Langues supportées

### Langues européennes principales (24)
- **en** - Anglais (par défaut)
- **fr** - Français
- **de** - Allemand
- **es** - Espagnol
- **it** - Italien
- **pt** - Portugais
- **nl** - Néerlandais
- **pl** - Polonais
- **cs** - Tchèque
- **sv** - Suédois
- **da** - Danois
- **fi** - Finnois
- **hu** - Hongrois
- **ro** - Roumain
- **el** - Grec
- **sk** - Slovaque
- **bg** - Bulgare
- **hr** - Croate
- **lt** - Lituanien
- **lv** - Letton
- **et** - Estonien
- **si** - Slovène
- **mt** - Maltais
- **ga** - Irlandais

### Langues importantes (9)
- **ar** - Arabe
- **zh** - Chinois
- **ja** - Japonais
- **ko** - Coréen
- **hi** - Hindi
- **ru** - Russe
- **tr** - Turc
- **vi** - Vietnamien
- **th** - Thaïlandais

**Total : 33 langues**

## Structure du projet

```
src/
├── app/
│   ├── [locale]/          # Routes internationalisées (locale gérée en interne)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── layout.tsx         # Root layout (passe-through)
│   ├── page.tsx           # Root page (passe-through)
│   └── globals.css        # Styles globaux
├── components/            # Composants React
│   └── ui/               # Composants Shadcn/ui
├── i18n/                 # Configuration i18n
│   ├── routing.ts        # Configuration des routes (localePrefix: 'never')
│   ├── request.ts        # Configuration des requêtes (détection cookie/headers)
│   └── navigation.ts     # Navigation internationalisée
├── middleware.ts         # Middleware i18n (détection automatique)
├── lib/                  # Utilitaires
└── hooks/                # Hooks React personnalisés
messages/                  # Fichiers de traduction JSON
├── en.json
├── fr.json
├── de.json
└── ... (33 fichiers)
```

## Scripts disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Démarrer en production
npm start

# Linter (vérification)
npm run lint

# Linter (correction automatique)
npm run lint:fix

# Formatage Prettier (écriture)
npm run format

# Formatage Prettier (vérification)
npm run format:check

# Vérification TypeScript
npm run type-check
```

## Utilisation

### i18n avec next-intl

```tsx
// Server Component
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations();
  return <h1>{t("common.welcome")}</h1>;
}
```

```tsx
// Client Component
"use client";
import { useTranslations } from "next-intl";

export function Component() {
  const t = useTranslations();
  return <p>{t("common.hello")}</p>;
}
```

### Navigation avec i18n

```tsx
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export function Navigation() {
  const locale = useLocale();
  return (
    <Link href="/about" locale={locale}>
      {t("navigation.about")}
    </Link>
  );
}
```

### Framer Motion

```tsx
"use client";

import { motion } from "framer-motion";

export function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Contenu animé
    </motion.div>
  );
}
```

### Shadcn/ui

```bash
npx shadcn@latest add button
```

Les composants seront ajoutés dans `src/components/ui/`.

## Configuration

### ESLint (mode strict)

- Règles TypeScript strictes activées
- Règles React strictes activées
- Détection des erreurs communes
- Intégration avec Prettier

### Prettier

- Formatage automatique du code
- Configuration dans `.prettierrc.json`
- Intégration avec ESLint

### TypeScript (mode strict)

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`

## Ajouter une nouvelle traduction

1. Créer un fichier `messages/[locale].json`
2. Ajouter la locale dans `src/i18n/routing.ts`
3. Mettre à jour le middleware si nécessaire

## Notes importantes

- **Aucun préfixe de locale dans l'URL** : Les URLs restent propres (ex: `/about` au lieu de `/fr/about`)
- La locale est détectée automatiquement via :
  - Cookie `locale` (si défini)
  - Header `Accept-Language` du navigateur
  - Locale par défaut (`en`) si aucune correspondance
- Le composant `LocaleSwitcher` permet de changer la locale (stockée dans un cookie)
- Toutes les routes sont accessibles sans préfixe, la locale est gérée en interne
