# Guide de Déploiement - CHB Créations

Ce guide vous accompagne étape par étape pour mettre votre site Next.js en production et remplacer l'ancien site 123site.com.

## 📋 Vue d'ensemble

**Durée estimée :** 2-3 heures
**Compétences requises :** Accès aux dashboards (Vercel, Stripe, Google Cloud, Registrar DNS)
**Coût :** Gratuit (Vercel Hobby) ou ~20€/mois (Vercel Pro)

---

## 🚀 Étape 1 : Hébergement sur Vercel (30 min)

### 1.1 Créer un compte Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Importez votre repository `chb-creations`

### 1.2 Configuration du projet
1. Dans les settings du projet :
   - **Framework Preset :** Next.js
   - **Build Command :** `npm run build`
   - **Output Directory :** `.next`
   - **Install Command :** `npm install`

2. Activer Turbopack (déjà configuré dans package.json)

### 1.3 Premier déploiement test
- Vercel va automatiquement déployer sur une URL temporaire (ex: `chb-creations.vercel.app`)
- **NE PAS** configurer le domaine principal maintenant
- Ce déploiement servira pour les tests

---

## 🔐 Étape 2 : Variables d'environnement (20 min)

Dans **Vercel → Settings → Environment Variables**, ajoutez :

### Variables Supabase (existantes)
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Variables Stripe (À METTRE À JOUR - voir Étape 3)
```
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXX
```
⚠️ **IMPORTANT :** Utilisez les clés **LIVE**, pas les clés de test !

### Variables Resend (existante)
```
RESEND_API_KEY=re_XXXXXXXXXXXXXXXX
```

### Variables Google APIs (existantes)
```
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
```

### Variable URL de production
```
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```
⚠️ Mettre votre vrai domaine (ex: https://chb-creations.fr)

### Environnements à configurer
- ✅ **Production** : Toutes les variables ci-dessus
- ✅ **Preview** : Mêmes variables (pour tester les PRs)
- ❌ **Development** : Utiliser le fichier `.env.local`

---

## 💳 Étape 3 : Configuration Stripe LIVE (30 min)

### 3.1 Activer le mode Live
1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Basculez le switch "Test mode" → "Live mode" (en haut à droite)
3. Vérifiez que votre compte est activé (vérification bancaire complète)

### 3.2 Récupérer les clés Live
1. Dans **Developers → API Keys** (mode Live activé)
2. Copiez :
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (cliquez "Reveal") → `STRIPE_SECRET_KEY`
3. Ajoutez-les dans Vercel (voir Étape 2)

### 3.3 Configurer le webhook
1. Dans **Developers → Webhooks**
2. Cliquez "Add endpoint"
3. URL : `https://votre-domaine.com/api/process-payment`
4. Événements à écouter :
   - `checkout.session.completed`
5. Copiez le **Signing secret** (commence par `whsec_`)
6. Ajoutez-le dans le code (voir modifications ci-dessous)

⚠️ **Action requise :** Le webhook secret doit être ajouté dans le code source (je vais le faire à l'étape suivante)

---

## 🗺️ Étape 4 : Configuration Google APIs (15 min)

### 4.1 Ajouter le domaine de production
1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Sélectionnez votre projet
3. Dans **APIs & Services → Credentials**
4. Pour chaque clé API utilisée :
   - Cliquez sur la clé `GOOGLE_PLACES_API_KEY`
   - Dans "Application restrictions" → "HTTP referrers"
   - Ajoutez :
     - `https://votre-domaine.com/*`
     - `https://www.votre-domaine.com/*`
     - `https://*.vercel.app/*` (pour les previews)

### 4.2 Vérifier les APIs activées
- ✅ **Places API** (autocomplete d'adresses)
- ✅ **Routes API** (calcul de distance)
- ✅ **Geocoding API** (si utilisée)

### 4.3 Vérifier la facturation
- Les APIs Google nécessitent une carte bancaire enregistrée
- Crédit gratuit : 200$/mois (largement suffisant)

---

## 📧 Étape 5 : Configuration Resend (5 min)

### 5.1 Vérifier le domaine (optionnel mais recommandé)
1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Ajoutez votre domaine (ex: `chb-creations.fr`)
3. Configurez les enregistrements DNS (SPF, DKIM, DMARC)
4. Cela améliore la délivrabilité des emails

### 5.2 Modifier l'adresse d'expédition
Dans le code source (je vais le faire), remplacez :
```typescript
from: 'onboarding@resend.dev' // Email par défaut
```
Par :
```typescript
from: 'contact@votre-domaine.com' // Votre email
```

---

## 🌐 Étape 6 : Configuration du domaine (45 min)

### 6.1 Ajouter le domaine dans Vercel
1. Dans **Vercel → Settings → Domains**
2. Cliquez "Add"
3. Entrez votre domaine (ex: `chb-creations.fr`)
4. Vercel vous donnera des enregistrements DNS à configurer

### 6.2 Configurer le DNS chez votre registrar

**Option A : DNS Vercel (recommandé)**
1. Vercel vous donne des nameservers (ex: `ns1.vercel-dns.com`)
2. Allez chez votre registrar (OVH, Gandi, etc.)
3. Remplacez les nameservers par ceux de Vercel
4. Attendez la propagation (15 min à 48h)

**Option B : Enregistrements A/CNAME**
Si vous ne pouvez pas changer les nameservers :
1. Ajoutez un enregistrement `A` pour `@` pointant vers l'IP Vercel
2. Ajoutez un enregistrement `CNAME` pour `www` pointant vers `cname.vercel-dns.com`

### 6.3 Configurer les redirections
1. Dans **Vercel → Settings → Domains**
2. Assurez-vous que `www.votre-domaine.com` redirige vers `votre-domaine.com` (ou l'inverse)

### 6.4 Activer le SSL
- Vercel active automatiquement le SSL avec Let's Encrypt
- Attendez quelques minutes après la configuration DNS

---

## 🗄️ Étape 7 : Configuration Supabase (10 min)

### 7.1 Ajouter le domaine aux URLs autorisées
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Dans **Authentication → URL Configuration**
4. Ajoutez dans "Site URL" : `https://votre-domaine.com`
5. Ajoutez dans "Redirect URLs" :
   - `https://votre-domaine.com/admin/dashboard`
   - `https://votre-domaine.com/panier/success`

### 7.2 Vérifier le bucket Storage
1. Dans **Storage → Buckets**
2. Sélectionnez `chb-creations-products`
3. Vérifiez que le bucket est **Public**
4. Dans **Policies**, assurez-vous que :
   - Lecture publique activée (pour afficher les images)
   - Écriture réservée aux utilisateurs authentifiés

### 7.3 Vérifier les politiques RLS
- Les politiques sont déjà configurées (voir `src/lib/rls-policies.sql`)
- Pas de modification nécessaire

---

## ✅ Étape 8 : Tests pré-production (30 min)

### 8.1 Test sur l'URL Vercel temporaire
Avant de basculer le DNS, testez sur `https://chb-creations.vercel.app` :

**Test 1 : Réservation Location**
1. ✅ Ajouter un produit de location au panier
2. ✅ Sélectionner des dates et options
3. ✅ Choisir la livraison (vérifier le calcul de distance)
4. ✅ Remplir les infos client
5. ✅ Payer avec Stripe (mode Live - utiliser une vraie carte)
6. ✅ Vérifier la réception de l'email avec PDF

**Test 2 : Réservation Achat**
1. ✅ Ajouter un accessoire personnalisé
2. ✅ Renseigner les personnalisations
3. ✅ Compléter la commande
4. ✅ Vérifier l'email

**Test 3 : Réservation Henné**
1. ✅ Ajouter une prestation henné
2. ✅ Choisir une date et un créneau horaire
3. ✅ Compléter la réservation
4. ✅ Vérifier l'email

**Test 4 : Administration**
1. ✅ Se connecter sur `/admin/login`
2. ✅ Voir les réservations
3. ✅ Générer un PDF de confirmation
4. ✅ Créer un nouveau produit avec images

### 8.2 Checklist de sécurité
- [ ] Les clés `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` ne sont pas dans le code source
- [ ] Le fichier `.env.local` est dans `.gitignore`
- [ ] Les webhooks Stripe utilisent la signature pour vérifier l'authenticité
- [ ] Les images produits sont publiques mais l'upload est protégé

---

## 🔄 Étape 9 : Bascule du domaine (1-48h)

### 9.1 Préparer la migration
1. ✅ Tous les tests sont passés
2. ✅ Le DNS est configuré chez le registrar
3. ✅ Prévenez vos clients (maintenance possible)

### 9.2 Vérifier la propagation DNS
Utilisez [dnschecker.org](https://dnschecker.org) pour vérifier que le domaine pointe bien vers Vercel.

### 9.3 Vérifier le site en production
1. Allez sur `https://votre-domaine.com`
2. Refaites les tests de l'Étape 8
3. Vérifiez les logs dans Vercel pour détecter d'éventuelles erreurs

---

## 🛡️ Étape 10 : Redirections depuis l'ancien site (optionnel)

Si vous avez des pages importantes sur l'ancien site 123site.com, configurez des redirections 301.

### 10.1 Dans `next.config.ts`
Ajoutez :
```typescript
async redirects() {
  return [
    {
      source: '/ancien-chemin',
      destination: '/nouveau-chemin',
      permanent: true,
    },
  ]
}
```

---

## 📊 Étape 11 : Monitoring post-déploiement

### 11.1 Vérifier les métriques Vercel
- Temps de chargement
- Erreurs serveur (500)
- Utilisation de la bande passante

### 11.2 Vérifier les logs Stripe
- Paiements réussis
- Webhooks reçus

### 11.3 Vérifier les emails Resend
- Taux de délivrabilité
- Emails en spam

---

## 🆘 Dépannage

### Problème : Les emails ne partent pas
- Vérifiez la clé `RESEND_API_KEY` dans Vercel
- Vérifiez que le domaine est vérifié dans Resend
- Consultez les logs dans Vercel

### Problème : Les paiements Stripe échouent
- Vérifiez que vous utilisez les clés **LIVE**
- Vérifiez que le webhook est configuré avec la bonne URL
- Consultez les logs dans Stripe Dashboard

### Problème : Les images ne s'affichent pas
- Vérifiez que le bucket Supabase est **Public**
- Vérifiez les URLs des images dans la base de données

### Problème : Google Maps ne fonctionne pas
- Vérifiez que le domaine est autorisé dans Google Cloud Console
- Vérifiez que la facturation est activée
- Vérifiez la clé API dans Vercel

---

## ✅ Checklist finale

- [ ] Site accessible sur le domaine principal
- [ ] SSL actif (cadenas vert)
- [ ] Tous les tests de réservation passent
- [ ] Emails reçus avec PDF
- [ ] Paiements Stripe fonctionnels
- [ ] Admin accessible
- [ ] Images produits affichées
- [ ] Google Maps et autocomplete fonctionnels
- [ ] Ancien site redirigé (si applicable)

---

## 📞 Support

- **Vercel :** [vercel.com/support](https://vercel.com/support)
- **Stripe :** [support.stripe.com](https://support.stripe.com)
- **Supabase :** [supabase.com/support](https://supabase.com/support)
- **Resend :** [resend.com/support](https://resend.com/support)

---

**Bon déploiement ! 🚀**
