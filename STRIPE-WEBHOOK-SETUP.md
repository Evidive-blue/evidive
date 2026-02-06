# 🔗 Configuration Stripe Webhook - EviDive

## 📋 Vue d'ensemble

Les webhooks Stripe permettent de recevoir automatiquement des notifications lorsque des événements se produisent sur votre compte Stripe (paiement réussi, remboursement, etc.).

**⚠️ IMPORTANT** : Sans webhook configuré, les paiements ne seront JAMAIS enregistrés dans la base de données !

## 🔄 Flux de paiement

```
Client paie via Stripe Checkout
    ↓
Stripe traite le paiement
    ↓
Stripe envoie un événement au webhook
    ↓
Votre API /api/stripe/webhook reçoit l'événement
    ↓
Booking mis à jour en BDD (status PAID, commission créée, notification envoyée)
```

## 🛠️ Configuration Développement Local

### 1. Installer Stripe CLI

```bash
# Linux/WSL
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe
```

### 2. Se connecter à Stripe

```bash
stripe login
```

→ Suivez le lien dans le terminal pour autoriser l'accès

### 3. Lancer le forwarding

**Terminal 1** : Serveur Next.js
```bash
npm run dev
```

**Terminal 2** : Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Récupérer le webhook secret

La commande `stripe listen` affiche :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Ajouter dans .env.local

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 6. Redémarrer le serveur Next.js

```bash
# Ctrl+C dans le terminal 1, puis :
npm run dev
```

✅ **C'est prêt !** Les webhooks fonctionnent en local.

---

## 🌐 Configuration Production (Vercel + Stripe Dashboard)

### 1. Accéder au Dashboard Stripe

- URL : https://dashboard.stripe.com/webhooks
- Mode : **Production** (toggle en haut à droite)

### 2. Créer un endpoint webhook

1. Cliquez sur **"Add endpoint"**
2. **Endpoint URL** : `https://evidive.blue/api/stripe/webhook`
3. **Description** : `EviDive Production Webhook`
4. **Events to send** :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Cliquez sur **"Add endpoint"**

### 3. Récupérer le signing secret

1. Cliquez sur le webhook que vous venez de créer
2. Section **"Signing secret"**
3. Cliquez sur **"Reveal"**
4. Copiez le secret (commence par `whsec_...`)

### 4. Ajouter dans Vercel

**Via Dashboard Vercel :**
1. https://vercel.com/thieu83s-projects/evidive/settings/environment-variables
2. Ajoutez la variable :
   - **Key** : `STRIPE_WEBHOOK_SECRET`
   - **Value** : `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Environments** : Production ✅

**Via CLI Vercel :**
```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Collez le secret quand demandé
```

### 5. Redéployer l'application

```bash
git push origin main
# ou
vercel --prod
```

---

## 🔍 Tester les webhooks

### En développement

```bash
# Terminal 1 : Next.js dev
npm run dev

# Terminal 2 : Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3 : Déclencher un événement test
stripe trigger checkout.session.completed
```

### En production

1. Dashboard Stripe → Webhooks
2. Cliquez sur votre endpoint
3. Onglet **"Send test webhook"**
4. Sélectionnez `checkout.session.completed`
5. Cliquez **"Send test webhook"**

---

## 📊 Événements traités

| Événement Stripe | Action dans EviDive |
|------------------|---------------------|
| `checkout.session.completed` | Marque le booking PAID + CONFIRMED, crée la commission, envoie la notification |
| `payment_intent.succeeded` | Backup si checkout.session non reçu |
| `payment_intent.payment_failed` | Marque le booking CANCELLED |
| `charge.refunded` | Marque le booking REFUNDED, annule la commission |

---

## 🐛 Dépannage

### Le webhook ne fonctionne pas en local

**Vérifiez :**
1. Stripe CLI est bien lancé : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Le webhook secret est dans `.env.local`
3. Le serveur Next.js est redémarré après ajout du secret
4. Les deux processus tournent simultanément

### Le webhook ne fonctionne pas en production

**Vérifiez :**
1. L'URL webhook est correcte : `https://evidive.blue/api/stripe/webhook`
2. Le webhook secret est bien configuré dans Vercel
3. L'app a été redéployée après ajout de la variable
4. Dashboard Stripe → Webhooks → Voir les tentatives et erreurs

### Les paiements ne se mettent pas à jour

**Vérifiez :**
1. Le webhook secret est défini
2. Les logs Stripe montrent une réponse 200 OK
3. La base de données est accessible
4. Pas d'erreurs dans les logs Vercel

**Corriger manuellement un booking :**
```bash
npx tsx scripts/fix-booking-status.ts <BOOKING_REFERENCE>
```

---

## 📁 Fichiers concernés

- **Webhook handler** : `app/api/stripe/webhook/route.ts`
- **Checkout création** : `app/api/stripe/checkout/route.ts`
- **Config Stripe** : `lib/stripe.ts`
- **Variables env** : `.env.local` (dev) / Vercel (prod)
- **Script de correction** : `scripts/fix-booking-status.ts`

---

## 🔐 Sécurité

- ✅ Le webhook secret valide que les événements viennent bien de Stripe
- ✅ Signature cryptographique vérifiée avant traitement
- ✅ Sans le secret, les webhooks sont rejetés (status 400)
- ⚠️ Ne jamais commiter le webhook secret dans git
- ⚠️ Utilisez des secrets différents pour dev/test/prod

---

## 📚 Documentation officielle

- Webhooks Stripe : https://stripe.com/docs/webhooks
- Stripe CLI : https://stripe.com/docs/stripe-cli
- Événements : https://stripe.com/docs/api/events/types
- Testing : https://stripe.com/docs/webhooks/test

---

**Dernière mise à jour** : 6 février 2026
