# Configuration Vercel - EviDive

## ✅ État Actuel

- ✅ Code commité et poussé vers GitHub : `https://github.com/WhytcardAI/evidive.git`
- ✅ Configuration Vercel ajoutée (`vercel.json`)
- ✅ Projet Vercel existant : `evidive-f12h`

## 🔧 Étapes de Configuration

### 1. Connecter le Repo GitHub au Projet Vercel

1. Aller sur : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/settings/git
2. Cliquer sur **"Connect Git Repository"** ou **"Change Git Repository"**
3. Sélectionner : `WhytcardAI/evidive`
4. Branche de production : `master`
5. Sauvegarder

### 2. Configurer les Variables d'Environnement

Aller sur : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/settings/environment-variables

Ajouter les variables suivantes :

```
DATABASE_URL=postgres://515f67300fc891b507a700b065ef6054b45a3d5b83e3eda520eb2821fa170c60:sk_pWd8UuYox2XwG7boAvgWf@db.prisma.io:5432/postgres?sslmode=require

POSTGRES_URL=postgres://515f67300fc891b507a700b065ef6054b45a3d5b83e3eda520eb2821fa170c60:sk_pWd8UuYox2XwG7boAvgWf@db.prisma.io:5432/postgres?sslmode=require

PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19wV2Q4VXVZb3gyWHdHN2JvQXZnV2YiLCJhcGlfa2V5IjoiMDFLRzVSWjdFTU1XRzhQRzJEUzhGSDg0VkQiLCJ0ZW5hbnRfaWQiOiI1MTVmNjczMDBmYzg5MWI1MDdhNzAwYjA2NWVmNjA1NGI0NWEzZDViODNlM2VkYTUyMGViMjgyMWZhMTcwYzYwIiwiaW50ZXJuYWxfc2VjcmV0IjoiMzFiM2M1YzItNWIzNC00MDQ3LWFjYjItN2FmNjNlYWY4YTZiIn0.5RqDdqfeKscyl3uB1SOrF5-Q0LUyGtTc6eEjZl_NJP0

NEXTAUTH_SECRET=[GÉNÉRER UNE CLÉ SECRÈTE - utiliser: openssl rand -base64 32]

NEXTAUTH_URL=https://Evidive.whytcard.ai
```

**Important** : 
- Sélectionner **Production**, **Preview**, et **Development** pour toutes les variables
- Pour `NEXTAUTH_SECRET`, générer une nouvelle clé sécurisée

### 3. Configurer le Domaine Evidive.whytcard.ai

1. Aller sur : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/settings/domains
2. Si le domaine `Evidive.whytcard.ai` est déjà utilisé par un autre projet :
   - Aller dans l'ancien projet Vercel
   - Retirer le domaine `Evidive.whytcard.ai`
3. Dans le projet `evidive-f12h`, ajouter le domaine : `Evidive.whytcard.ai`
4. Vercel détectera automatiquement les enregistrements DNS nécessaires
5. Configurer les DNS dans votre provider (whytcard.ai) si nécessaire :
   - Type : `CNAME`
   - Name : `Evidive`
   - Value : `cname.vercel-dns.com` (ou la valeur fournie par Vercel)

### 4. Configurer les Build Settings

Aller sur : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/settings/general

Vérifier :
- **Framework Preset** : Next.js
- **Build Command** : `prisma generate && next build` (déjà configuré dans `vercel.json`)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)
- **Development Command** : `next dev` (par défaut)

### 5. Déclencher un Nouveau Déploiement

1. Aller sur : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/deployments
2. Cliquer sur **"Redeploy"** sur le dernier déploiement OU
3. Vercel devrait automatiquement détecter le nouveau push et redéployer

### 6. Vérification Post-Déploiement

1. ✅ Vérifier que le build passe sans erreur
2. ✅ Vérifier les logs : https://vercel.com/jeromes-projects-414dad4a/evidive-f12h/logs
3. ✅ Tester le site : https://Evidive.whytcard.ai
4. ✅ Vérifier que toutes les pages fonctionnent
5. ✅ Vérifier que la base de données est accessible

## 🔍 Troubleshooting

### Erreur de Build Prisma

Si vous voyez une erreur liée à Prisma :
- Vérifier que `PRISMA_GENERATE_DATAPROXY=true` est dans les variables d'environnement
- Vérifier que `prisma generate` s'exécute avant `next build`

### Erreur de Domaine

- Vérifier les DNS dans votre provider de domaine
- Attendre jusqu'à 24h pour la propagation DNS
- Vérifier que le domaine est bien configuré dans Vercel

### Erreur Database Connection

- Vérifier que toutes les variables `DATABASE_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL` sont correctes
- Vérifier que Prisma Accelerate est bien configuré

## 📝 Notes

- Le projet utilise Prisma Accelerate pour les performances
- Next.js 16 avec App Router
- Internationalisation avec next-intl (FR, EN, ES, IT)
- Authentification avec NextAuth v5
