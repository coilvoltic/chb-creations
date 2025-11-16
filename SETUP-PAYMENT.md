# Configuration du système de paiement et livraison

Ce guide explique comment configurer le système de paiement en ligne (Stripe) et de calcul des frais de livraison (Google APIs).

## 1. Configuration Supabase (Base de données)

### Exécuter la migration SQL

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL
3. Exécutez le script `database-migrations/add-payment-delivery-columns.sql`

Cela ajoutera les colonnes nécessaires à la table `reservations`:
- `delivery_option`: 'pickup' ou 'delivery'
- `delivery_fees`: montant des frais de livraison
- `stripe_payment_id`: ID du paiement Stripe

## 2. Configuration Stripe

### Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte ou connectez-vous
3. Activez le mode de test pour le développement

### Obtenir les clés API

1. Dans le Dashboard Stripe, allez dans **Développeurs** > **Clés API**
2. Copiez:
   - **Clé secrète** (sk_test_...) → `STRIPE_SECRET_KEY`
   - **Clé publiable** (pk_test_...) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Configurer les variables d'environnement

Ajoutez dans votre fichier `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publiable
```

### Configurer les URLs de redirection

Dans le code (`src/app/api/create-checkout-session/route.ts`), les URLs sont configurées comme suit:
- **Success URL**: `/panier/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel URL**: `/panier`

Assurez-vous que `NEXT_PUBLIC_BASE_URL` est correctement défini:
```env
# En développement
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# En production
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

### Activer Apple Pay et Google Pay (Optionnel)

1. Dans le Dashboard Stripe, allez dans **Paramètres** > **Méthodes de paiement**
2. Activez **Apple Pay** et **Google Pay**
3. Ces options apparaîtront automatiquement dans Stripe Checkout

## 3. Configuration Google APIs

### Créer un projet Google Cloud

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet ou sélectionnez un projet existant

### Activer les APIs nécessaires

Dans **APIs & Services** > **Bibliothèque**, activez:

1. **Places API (New)** - pour l'autocomplete d'adresses
2. **Routes API** - pour le calcul des distances et frais de livraison

### Créer une clé API

1. Allez dans **APIs & Services** > **Identifiants**
2. Cliquez sur **Créer des identifiants** > **Clé API**
3. Copiez la clé générée

### Restreindre la clé API (Recommandé)

Pour des raisons de sécurité:

1. Cliquez sur la clé API que vous venez de créer
2. Dans **Restrictions relatives aux applications**:
   - Sélectionnez "Adresses IP" pour le backend
   - Ou "Référents HTTP" pour le frontend (pas recommandé)
3. Dans **Restrictions relatives aux API**:
   - Sélectionnez "Limiter la clé"
   - Cochez: Places API (New) et Routes API

### Configurer la variable d'environnement

Ajoutez dans `.env.local`:

```env
GOOGLE_PLACES_API_KEY=votre_cle_api_google
```

## 4. Flux de paiement

### Option 1: Paiement en ligne (CB, Apple Pay, Google Pay)

1. Client saisit ses informations
2. Clique sur "Continuer vers le paiement"
3. Choisit "Payer l'acompte en ligne"
4. Clique sur "Valider"
5. **Redirection vers Stripe Checkout**
6. Client paie avec:
   - Carte bancaire
   - Apple Pay
   - Google Pay
7. **Retour sur `/panier/success`**
8. L'API `/api/process-payment` crée la réservation
9. Email de confirmation envoyé
10. Statut: `CONFIRMED` (acompte payé)

### Option 2: Réservation sans payer l'acompte

1. Client saisit ses informations
2. Clique sur "Continuer vers le paiement"
3. Choisit "Réserver sans payer l'acompte"
4. Clique sur "Valider"
5. **Pas de redirection Stripe**
6. L'API `/api/reservations/create` crée la réservation
7. Email de confirmation envoyé
8. Statut: `CONFIRMED_NO_DEPOSIT` (à payer en espèces)

## 5. Calcul des frais de livraison

### Fonctionnement

1. Client choisit "Livraison à domicile"
2. Commence à taper son adresse
3. **Google Places API** propose des suggestions
4. Client clique sur une suggestion
5. **Google Routes API** calcule automatiquement:
   - Distance en km
   - Durée estimée
   - Frais de livraison = Frais de base + (Distance × 1€/km)

### Configuration des frais de base

Les frais de base sont configurés dans le produit (colonne `base_delivery_fees`).

Pour modifier le coût par km, éditez:
```typescript
// src/app/api/calculate-delivery/route.ts
const COST_PER_KM = 1 // 1€ par km
```

## 6. Tests

### Tester Stripe

Utilisez les cartes de test Stripe:

- **Paiement réussi**: `4242 4242 4242 4242`
- **Paiement refusé**: `4000 0000 0000 0002`
- Date: n'importe quelle date future
- CVC: n'importe quels 3 chiffres

### Tester l'autocomplete

Tapez une adresse réelle en France dans le champ "Adresse de livraison".

### Tester le calcul des frais

1. Ajoutez un produit au panier qui a `base_delivery_fees > 0`
2. Choisissez "Livraison à domicile"
3. Sélectionnez une adresse dans l'autocomplete
4. Les frais se calculent automatiquement

## 7. Passage en production

### Stripe

1. Dans le Dashboard Stripe, passez en **Mode production**
2. Obtenez les nouvelles clés API (sk_live_... et pk_live_...)
3. Mettez à jour `.env.local` en production
4. Vérifiez les webhooks Stripe si nécessaire

### Google APIs

1. Vérifiez que les APIs sont bien activées
2. Configurez la facturation Google Cloud
3. Activez les quotas appropriés
4. Restreignez votre clé API pour la sécurité

### Variables d'environnement en production

Assurez-vous que toutes les variables sont configurées sur votre hébergeur (Vercel, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
GOOGLE_PLACES_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

## 8. Dépannage

### Erreur: "Routes API - PERMISSION_DENIED"

→ L'API Routes n'est pas activée. Allez dans Google Cloud Console > Bibliothèque > Activez Routes API

### Erreur: "Stripe key not found"

→ Vérifiez que `STRIPE_SECRET_KEY` est bien défini dans `.env.local`

### L'autocomplete ne fonctionne pas

→ Vérifiez que `GOOGLE_PLACES_API_KEY` est bien défini et que Places API (New) est activée

### Le paiement ne se finalise pas

→ Vérifiez les logs Stripe et assurez-vous que les URLs de redirection sont correctes

## Support

Pour toute question, consultez:
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Google Routes API](https://developers.google.com/maps/documentation/routes)
- [Documentation Google Places API](https://developers.google.com/maps/documentation/places/web-service/autocomplete)
