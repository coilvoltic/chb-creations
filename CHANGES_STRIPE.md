# Modifications Stripe - Intégration Réelle

## 📝 Résumé des changements

Remplacement complet de la simulation de paiement par une vraie intégration Stripe.

## 🗑️ Fichiers supprimés

- `src/components/PaymentSimulationModal.tsx` - Composant de simulation supprimé

## ✏️ Fichiers modifiés

### 1. `.env.local`
**Ajouts** :
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000` - URL de base pour les redirects
- `STRIPE_WEBHOOK_SECRET=` - Clé secrète du webhook (à remplir)

### 2. `src/app/panier/page.tsx`
**Changements** :
- ❌ Suppression de l'import `PaymentSimulationModal`
- ❌ Suppression de l'état `showPaymentModal`
- ✅ Ajout de l'état `isProcessingPayment`
- ✅ Ajout de la fonction `handleStripeCheckout()` qui :
  - Prépare les données de réservation
  - Appelle `/api/create-checkout-session`
  - Redirige vers Stripe Checkout avec `window.location.href = data.url`
- ✅ Modification de `handleValidateOrder()` pour appeler `handleStripeCheckout()` au lieu d'ouvrir la modale
- ✅ Mise à jour du bouton de validation pour afficher l'état de redirection
- ❌ Suppression du rendu de `PaymentSimulationModal`

## ➕ Fichiers créés

### 1. `src/app/api/webhooks/stripe/route.ts` (NEW)
**Rôle** : Recevoir et traiter les webhooks Stripe

**Fonctionnalités** :
- Vérifie la signature du webhook avec `stripe.webhooks.constructEvent()`
- Écoute l'événement `checkout.session.completed`
- Crée automatiquement la réservation après paiement confirmé :
  - Création de `customer_orders`
  - Création de `rental_reservations`, `purchase_reservations`, `prestation_reservations`
  - Insertion des items correspondants
  - Génération du PDF de confirmation
  - Envoi de l'email avec le PDF
- Gère les codes promo
- Rollback en cas d'erreur

**Sécurité** :
- Vérifie que `STRIPE_WEBHOOK_SECRET` est configurée
- Rejette les requêtes avec signature invalide
- Vérifie que `payment_status === 'paid'`

### 2. `STRIPE_SETUP.md` (NEW)
Guide complet de configuration Stripe avec :
- Instructions pour le développement (Stripe CLI)
- Instructions pour la production
- Liste des cartes de test
- Section de dépannage
- Ressources utiles

### 3. `test-stripe.sh` (NEW)
Script bash pour faciliter les tests en développement :
- Vérifie l'installation de Stripe CLI
- Lance automatiquement l'écoute des webhooks
- Affiche les instructions pour tester
- Rappelle d'ajouter `STRIPE_WEBHOOK_SECRET`

## 🔄 Flux de paiement (avant vs après)

### ❌ AVANT (Simulation)
1. Utilisateur clique sur "Payer l'acompte"
2. Modale de simulation s'ouvre
3. Utilisateur choisit un mode de paiement fictif
4. Simulation de traitement (2 secondes)
5. Création immédiate de la réservation
6. Affichage du modal de succès

### ✅ APRÈS (Stripe Checkout Réel)
1. Utilisateur clique sur "Payer l'acompte"
2. Appel à `/api/create-checkout-session`
3. **Redirection vers Stripe Checkout** (page hébergée par Stripe)
4. Utilisateur entre ses informations de carte
5. Stripe traite le paiement
6. **Webhook Stripe** reçu par `/api/webhooks/stripe`
7. Création automatique de la réservation + email
8. Redirection vers `/panier/success` avec `session_id`
9. Appel à `/api/process-payment` pour récupérer les détails
10. Affichage de la confirmation

## 🔐 Sécurité

### Points forts :
- ✅ Pas de manipulation de données de carte côté serveur
- ✅ Paiement géré 100% par Stripe (PCI-DSS compliant)
- ✅ Vérification de signature des webhooks
- ✅ Clés API jamais exposées au client
- ✅ Rollback automatique en cas d'erreur

### Points d'attention :
- ⚠️ Bien configurer `STRIPE_WEBHOOK_SECRET` en production
- ⚠️ Utiliser HTTPS en production pour les webhooks
- ⚠️ Ne pas commiter les clés API dans git

## 📋 Checklist de déploiement

### Développement
- [x] Clés Stripe configurées dans `.env.local`
- [ ] Stripe CLI installé
- [ ] `STRIPE_WEBHOOK_SECRET` obtenue via `stripe listen`
- [ ] Test avec carte `4242 4242 4242 4242`

### Production
- [ ] Clés de production Stripe configurées
- [ ] Webhook configuré sur Dashboard Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` de production ajoutée
- [ ] `NEXT_PUBLIC_BASE_URL` avec le vrai domaine
- [ ] Domaine configuré sur Resend pour les emails
- [ ] Test avec vraie carte bancaire (mode test d'abord)
- [ ] Vérification des logs de webhooks sur Dashboard Stripe

## 🧪 Comment tester

### Option 1 : Script automatique
```bash
./test-stripe.sh
```

### Option 2 : Manuel
1. Terminal 1 - Démarrer le serveur :
   ```bash
   npm run dev
   ```

2. Terminal 2 - Écouter les webhooks :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

3. Copier la `webhook signing secret` dans `.env.local`

4. Effectuer un achat de test avec la carte `4242 4242 4242 4242`

## 📊 Monitoring

### Vérifier que tout fonctionne :
1. **Dashboard Stripe** : [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
   - Vérifier que les paiements apparaissent
   - Vérifier les webhooks dans la section Developers > Webhooks

2. **Base de données Supabase** :
   - Vérifier que les réservations sont créées avec statut `CONFIRMED`
   - Vérifier les `customer_orders`, `rental_reservations`, etc.

3. **Emails** :
   - Vérifier que les emails sont envoyés avec le PDF
   - En test : vérifier sur `volticthedev@gmail.com`

## 🐛 Problèmes connus et solutions

### Le webhook ne reçoit rien
**Solution** : Vérifier que :
- Stripe CLI est bien lancé
- L'URL est correcte : `http://localhost:3000/api/webhooks/stripe`
- Le serveur Next.js tourne

### Erreur "Signature invalide"
**Solution** : Vérifier que `STRIPE_WEBHOOK_SECRET` est bien configurée et correspond à celle affichée par Stripe CLI

### La réservation n'est pas créée
**Solution** : Vérifier les logs dans :
- Terminal où tourne `npm run dev`
- Dashboard Stripe > Webhooks > Événements

### L'email n'est pas envoyé
**Solution** : Vérifier que `RESEND_API_KEY` est correcte et que le domaine est configuré (en production)

## 📚 Documentation complète

Voir `STRIPE_SETUP.md` pour le guide détaillé de configuration.
