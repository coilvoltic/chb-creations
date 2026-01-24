# 💳 Intégration Stripe - CHB Créations

## ✅ Ce qui a été fait

L'intégration complète de Stripe a été mise en place pour remplacer la simulation de paiement.

### Modifications principales

1. **✅ Variables d'environnement ajoutées**
   - `NEXT_PUBLIC_BASE_URL` : URL de base pour les redirections
   - `STRIPE_WEBHOOK_SECRET` : Clé pour valider les webhooks (à configurer)

2. **✅ Panier modifié** ([src/app/panier/page.tsx](src/app/panier/page.tsx))
   - Suppression de la modale de simulation
   - Redirection vers Stripe Checkout pour les paiements en ligne
   - Gestion de l'état de chargement pendant la redirection

3. **✅ Webhook Stripe créé** ([src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts))
   - Reçoit les confirmations de paiement depuis Stripe
   - Crée automatiquement les réservations
   - Génère et envoie les emails de confirmation
   - Vérifie la signature des webhooks pour la sécurité

4. **✅ Page de succès** ([src/app/panier/success/page.tsx](src/app/panier/success/page.tsx))
   - Déjà existante, prête à l'emploi
   - Affiche la confirmation après paiement

5. **✅ Documentation créée**
   - `STRIPE_SETUP.md` : Guide complet de configuration
   - `CHANGES_STRIPE.md` : Détail de toutes les modifications
   - `test-stripe.sh` : Script pour faciliter les tests

## 🚀 Comment tester (Développement)

### Étape 1 : Installer Stripe CLI

```bash
# Avec Homebrew (recommandé)
brew install stripe/stripe-cli/stripe

# Ou téléchargement manuel
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_macos.tar.gz | tar xz
```

### Étape 2 : Se connecter à Stripe

```bash
stripe login
```

### Étape 3 : Démarrer le serveur Next.js

```bash
npm run dev
```

### Étape 4 : Lancer l'écoute des webhooks

**Option A : Avec le script (recommandé)**
```bash
./test-stripe.sh
```

**Option B : Manuellement**
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### Étape 5 : Récupérer et configurer le secret webhook

La commande ci-dessus affichera :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
```

Copiez cette clé et ajoutez-la dans `.env.local` :
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

### Étape 6 : Tester un paiement

1. Ajoutez des produits au panier
2. Remplissez le formulaire de commande
3. Sélectionnez "Paiement en ligne"
4. Cliquez sur "Payer l'acompte"
5. Utilisez une carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future
   - CVC : N'importe quel code à 3 chiffres
6. Validez le paiement
7. Vous devriez être redirigé vers la page de succès

### Vérifications

✅ **Terminal Stripe CLI** : Doit afficher la réception du webhook `checkout.session.completed`
✅ **Terminal Next.js** : Doit afficher les logs de création de réservation
✅ **Email** : Doit être envoyé à l'adresse du client (actuellement `volticthedev@gmail.com` en test)
✅ **Base de données** : La réservation doit être créée avec le statut `CONFIRMED`

## 🌐 Déploiement en production

### Prérequis

1. **Passer aux clés de production Stripe**
   - Remplacer `STRIPE_SECRET_KEY` par la clé de production (commence par `sk_live_`)
   - Remplacer `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` par la clé publique de production (commence par `pk_live_`)

2. **Configurer le webhook sur Stripe Dashboard**
   - Aller sur [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Cliquer sur "Add endpoint"
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `checkout.session.completed`
   - Copier la "Signing secret" et l'ajouter dans `STRIPE_WEBHOOK_SECRET`

3. **Mettre à jour l'URL de base**
   ```bash
   NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
   ```

4. **Configurer Resend pour les emails**
   - Ajouter votre domaine sur [resend.com](https://resend.com)
   - Configurer les enregistrements DNS
   - Mettre à jour l'adresse d'envoi dans le code si nécessaire

### Variables d'environnement en production

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Base URL
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxx

# Google Places
GOOGLE_PLACES_API_KEY=AIzaxxxxxxxxxxxx
```

## 🔍 Monitoring et dépannage

### Dashboard Stripe
- **Paiements** : [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- **Webhooks** : [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- **Logs** : [https://dashboard.stripe.com/logs](https://dashboard.stripe.com/logs)

### Problèmes courants

#### Le webhook ne fonctionne pas
- ✅ Vérifier que `STRIPE_WEBHOOK_SECRET` est configurée
- ✅ Vérifier que le webhook est bien configuré sur le Dashboard Stripe
- ✅ Vérifier les logs du webhook sur Stripe Dashboard

#### Le paiement ne redirige pas
- ✅ Vérifier que `NEXT_PUBLIC_BASE_URL` est correcte
- ✅ Vérifier les logs dans la console navigateur

#### L'email n'est pas envoyé
- ✅ Vérifier `RESEND_API_KEY`
- ✅ Vérifier que le domaine est configuré sur Resend (en production)
- ✅ En test, l'email est envoyé à `volticthedev@gmail.com`

## 📊 Cartes de test Stripe

| Numéro de carte | Résultat |
|-----------------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte déclinée |
| `4000 0025 0000 3155` | Authentification 3D Secure requise |
| `4000 0000 0000 9995` | Fonds insuffisants |

**Note** : Pour toutes ces cartes de test :
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quel code à 3 chiffres
- Code postal : N'importe quel code postal valide

## 📚 Documentation supplémentaire

- 📖 **`STRIPE_SETUP.md`** : Guide détaillé de configuration
- 📋 **`CHANGES_STRIPE.md`** : Liste complète des modifications
- 🧪 **`test-stripe.sh`** : Script de test automatique

## 🔗 Liens utiles

- [Documentation Stripe](https://docs.stripe.com/)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Webhooks Stripe](https://docs.stripe.com/webhooks)
- [Cartes de test](https://docs.stripe.com/testing)
- [Resend Documentation](https://resend.com/docs)

## ✨ Fonctionnalités supportées

- ✅ Paiement par carte bancaire
- ✅ Authentification 3D Secure
- ✅ Apple Pay / Google Pay (automatique via Stripe)
- ✅ Gestion des erreurs de paiement
- ✅ Webhooks sécurisés
- ✅ Génération PDF automatique
- ✅ Email de confirmation avec PDF
- ✅ Support des codes promo
- ✅ Calcul automatique de l'acompte (50%)
- ✅ Gestion des frais de livraison

## 🎯 Prochaines étapes suggérées

1. **Tester en développement** avec des cartes de test
2. **Configurer le webhook de production** sur Stripe Dashboard
3. **Tester en mode test** sur le serveur de production
4. **Activer le mode live** Stripe une fois les tests validés
5. **Surveiller les premiers paiements** via le Dashboard Stripe

---

**Besoin d'aide ?**
- Consultez `STRIPE_SETUP.md` pour le guide détaillé
- Vérifiez les logs dans le terminal Next.js
- Consultez le Dashboard Stripe pour les événements webhook
