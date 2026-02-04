# Configuration Vercel Blob Storage

## 🎯 Objectif
Activer le stockage d'images sur Vercel Blob pour les photos de centres et services.

## 📋 Étapes de configuration

### 1. Créer un Blob Store dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **evidive**
3. Allez dans l'onglet **Storage**
4. Cliquez sur **Create Database**
5. Sélectionnez **Blob**
6. Donnez un nom: `evidive-images`
7. Cliquez sur **Create**

### 2. Récupérer le token

Après création du Blob Store:
1. Vercel va automatiquement créer `BLOB_READ_WRITE_TOKEN`
2. Copiez la valeur du token

### 3. Ajouter à .env.local

Ajoutez cette ligne à votre fichier `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXXXX
```

### 4. Redémarrer le serveur de développement

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

## 🧪 Tester l'upload

1. Connectez-vous à votre compte admin
2. Allez sur la page d'édition d'un centre
3. Cliquez sur l'onglet **Médias**
4. Uploadez une image de couverture
5. Uploadez des photos pour la galerie

## 📁 Structure des fichiers

```
/api/uploadthing/route.ts  -> Endpoint d'upload (POST)
/components/upload/image-upload.tsx  -> Composant d'upload réutilisable
/app/center/manage/[slug]/edit/edit-center-form.tsx  -> Formulaire avec upload
```

## 🔒 Sécurité

- ✅ Authentification requise (Auth.js session)
- ✅ Limite de taille: 4MB par fichier
- ✅ Types acceptés: images uniquement
- ✅ Accès public en lecture (via CDN)

## 💡 Features

- Upload d'image de couverture (1 image)
- Galerie de photos (max 10 images)
- Prévisualisation des images
- Suppression d'images
- Loading states
- Toast notifications

## 🚀 Déploiement

Lors du déploiement sur Vercel:
1. Le `BLOB_READ_WRITE_TOKEN` sera automatiquement disponible
2. Les images seront stockées sur le CDN Vercel
3. URLs générées automatiquement: `https://XXXXXX.public.blob.vercel-storage.com/...`

## 🆓 Limites gratuites

- **1 GB** de stockage
- **Bande passante illimitée** (CDN inclus)
- Parfait pour démarrer!

## 📚 Documentation

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [API Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
