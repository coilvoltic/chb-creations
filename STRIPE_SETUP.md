# Configuration de Stripe pour CHB Créations

## ✅ Ce qui est déjà configuré

1. **Clés API Stripe de TEST** dans `.env.local`:
   - ✅ `STRIPE_SECRET_KEY` : Clé secrète de test (`sk_test_...`)
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : Clé publique de test (`pk_test_...`)
   - 🎯 **Mode actuel** : TEST (pas de vrais paiements)

2. **Routes API créées**:
   - `/api/create-checkout-session` : Crée une session Stripe Checkout
   - `/api/process-payment` : Traite les paiements après confirmation
   - `/api/webhooks/stripe` : Reçoit les webhooks Stripe

3. **Flux de paiement**:
   - Le panier redirige vers Stripe Checkout pour le paiement en ligne
   - Après paiement, l'utilisateur revient sur `/panier/success`
   - Le webhook Stripe crée automatiquement la réservation

## 🔧 Configuration nécessaire

### 1. Installer Stripe CLI (pour écouter les webhooks en local)

Stripe CLI est nécessaire pour recevoir les webhooks sur votre machine locale pendant le développement.

**Option 1 : Téléchargement direct (Recommandé sans Homebrew)**

```bash
# Pour macOS
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_macos.tar.gz | tar xz

# Pour Linux
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz | tar xz

# Rendre exécutable et déplacer dans le PATH
chmod +x stripe
sudo mv stripe /usr/local/bin/
```

**Option 2 : Téléchargement manuel**

1. Allez sur https://github.com/stripe/stripe-cli/releases/latest
2. Téléchargez le fichier pour votre OS :
   - macOS : `stripe_macos.tar.gz`
   - Linux : `stripe_linux_x86_64.tar.gz`
   - Windows : `stripe_windows_x86_64.zip`
3. Extrayez l'archive
4. Déplacez l'exécutable `stripe` dans votre PATH

**Option 3 : Avec Docker (si vous avez Docker)**

```bash
docker run --rm -it stripe/stripe-cli listen --forward-to http://host.docker.internal:3000/api/webhooks/stripe
```

**Option 4 : Sans Stripe CLI (utiliser ngrok)**

Si vous ne pouvez/voulez pas installer Stripe CLI, utilisez ngrok :

```bash
# Installer ngrok
npm install -g ngrok

# Exposer localhost:3000 publiquement
npx ngrok http 3000
```

Puis configurez le webhook directement sur le Dashboard Stripe (mode Test) avec l'URL ngrok.

### 2. Configurer le webhook en développement

Une fois Stripe CLI installé :

1. **Se connecter à Stripe** :
   ```bash
   stripe login
   ```

2. **Démarrer le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Dans un autre terminal, écouter les webhooks** :

   **Si vous avez Stripe CLI** :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

   **Si vous n'avez pas Stripe CLI** (alternative avec ngrok) :
   ```bash
   # Terminal 1 : Démarrer le serveur
   npm run dev

   # Terminal 2 : Exposer localhost avec ngrok
   npx ngrok http 3000

   # Puis configurez le webhook sur le Dashboard Stripe (mode Test) avec l'URL ngrok
   # Example: https://abc123.ngrok.io/api/webhooks/stripe
   ```

4. **Récupérer la clé secrète du webhook** :

   **Avec Stripe CLI** : La commande ci-dessus affichera :
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
   ```

   **Avec ngrok** : Allez sur le Dashboard Stripe > Developers > Webhooks > Cliquez sur votre webhook > Copiez la "Signing secret"

5. **Ajouter la clé dans `.env.local`** :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

6. **Redémarrer le serveur Next.js** pour prendre en compte la nouvelle variable

7. **Tester le paiement** :
   - Utilisez une carte de test Stripe : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future (ex: 12/34)
   - CVC : n'importe quel code à 3 chiffres (ex: 123)
   - Code postal : n'importe quel code postal valide

### 3. Passer en mode production (quand vous serez prêt)

#### 3.1. Basculer vers les clés de production Stripe

1. **Sur le Dashboard Stripe**, basculez le toggle de "🧪 Test Data" vers "💰 Live Data" (en haut à droite)

2. **Allez dans Developers > API keys**

3. **Récupérez vos clés de production** :
   - Publishable key (commence par `pk_live_`)
   - Secret key (commence par `sk_live_`)

4. **Mettez à jour `.env.local`** (ou vos variables d'environnement de production) :
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   ```

#### 3.2. Configurer le webhook en production

1. **Sur le Dashboard Stripe** (toujours en mode "💰 Live Data")

2. **Allez dans Developers > Webhooks**

3. **Cliquez sur "Add endpoint"**

4. **Configurez l'endpoint** :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements à écouter : `checkout.session.completed`
   - Version API : Utiliser la dernière version

5. **Récupérez la clé secrète du webhook** :
   - Cliquez sur le webhook que vous venez de créer
   - Copiez la "Signing secret" (commence par `whsec_`)

6. **Ajoutez la clé dans les variables d'environnement de production** :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

#### 3.3. Mettre à jour `NEXT_PUBLIC_BASE_URL` en production

Dans vos variables d'environnement de production (Vercel, Netlify, etc.) :
```bash
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

#### 3.4. Configurer le domaine pour Resend

Pour que les emails fonctionnent en production avec un domaine personnalisé :

1. Aller sur [resend.com](https://resend.com)
2. Ajouter votre domaine (ex: `chb-creations.fr`)
3. Configurer les enregistrements DNS (SPF, DKIM, DMARC)
4. Mettre à jour l'adresse d'envoi dans le code :
   ```typescript
   from: 'CHB Créations <noreply@chb-creations.fr>'
   ```

## 🧪 Test du flux complet

### Test en développement

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Démarrer l'écoute des webhooks** (dans un autre terminal) :

   **Avec Stripe CLI** :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

   **Avec ngrok** :
   ```bash
   npx ngrok http 3000
   # Puis configurez le webhook sur Dashboard Stripe
   ```

3. **Effectuer un achat de test** :
   - Ajouter des produits au panier
   - Remplir le formulaire de commande
   - Choisir "Paiement en ligne"
   - Utiliser une carte de test : `4242 4242 4242 4242`
   - Compléter le paiement

4. **Vérifier** :
   - Le webhook doit être reçu (visible dans le terminal Stripe CLI ou Dashboard Stripe > Webhooks)
   - L'utilisateur doit être redirigé vers `/panier/success`
   - Un email de confirmation doit être envoyé
   - La réservation doit être créée en base de données avec le statut `CONFIRMED`

### Cartes de test Stripe

| Carte | Description |
|-------|-------------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte déclinée |
| `4000 0025 0000 3155` | Authentification 3D Secure requise |
| `4000 0000 0000 9995` | Fonds insuffisants |

Pour toutes ces cartes :
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quel code à 3 chiffres
- Code postal : N'importe quel code postal valide

## 📝 Notes importantes

### 1. Mode test vs production

- ✅ **ACTUELLEMENT EN MODE TEST** : Vous utilisez `pk_test_` et `sk_test_`
- 💡 Aucun vrai paiement ne sera effectué en mode test
- 💳 Utilisez uniquement des cartes de test (voir tableau ci-dessus)
- 🔄 Basculez vers `pk_live_` et `sk_live_` quand vous serez prêt pour la production
- ⚠️ N'oubliez pas de configurer le webhook en production également

### 2. Toggle sur le Dashboard Stripe

Le bouton en haut à droite du Dashboard Stripe permet de basculer entre :
- 🧪 **Test Data** : Clés `pk_test_` et `sk_test_` - Mode de développement (ACTUEL)
- 💰 **Live Data** : Clés `pk_live_` et `sk_live_` - Mode production
- Les deux environnements sont complètement isolés (données, clés, webhooks)

### 3. Sécurité

- ⚠️ Ne commitez JAMAIS les clés API dans git
- ✅ Vérifiez que `.env.local` est dans `.gitignore`
- 🔒 Utilisez des variables d'environnement sécurisées en production
- 🚫 Ne partagez jamais vos clés `sk_test_` ou `sk_live_`

### 4. Vérification des webhooks

- Le webhook vérifie la signature avec `stripe.webhooks.constructEvent()`
- ⚠️ Si `STRIPE_WEBHOOK_SECRET` n'est pas configurée, les webhooks seront rejetés
- 🔑 La `STRIPE_WEBHOOK_SECRET` est différente en test et en production
- 💡 Sans Stripe CLI, vous pouvez utiliser ngrok pour tester les webhooks

### 5. Traitement des paiements

- 🎯 Le **webhook** crée la réservation automatiquement après paiement confirmé
- 📧 Le webhook génère et envoie l'email de confirmation avec PDF
- ✅ Système sécurisé : seuls les paiements confirmés par Stripe créent des réservations
- 🔄 La page `/panier/success` appelle aussi `/api/process-payment` mais c'est le webhook qui fait le travail principal

## 🔍 Dépannage

### Le webhook ne fonctionne pas

1. Vérifier que `STRIPE_WEBHOOK_SECRET` est bien configurée dans `.env.local`
2. Vérifier que Stripe CLI est bien lancé (en dev avec Stripe CLI)
3. Vérifier les logs dans le terminal Stripe CLI ou Dashboard Stripe > Webhooks
4. Vérifier les logs de l'application Next.js
5. Si vous utilisez ngrok, vérifier que l'URL du webhook sur le Dashboard correspond à l'URL ngrok

### Le paiement ne redirige pas

1. Vérifier que `NEXT_PUBLIC_BASE_URL` est correctement configurée
2. Vérifier les URLs de success/cancel dans `/api/create-checkout-session`
3. Vérifier la console navigateur pour les erreurs JavaScript

### L'email n'est pas envoyé

1. Vérifier que `RESEND_API_KEY` est correcte
2. Vérifier que le domaine est configuré sur Resend (en production)
3. En test, les emails sont envoyés à l'adresse du client (vérifier les spams)
4. Vérifier les logs du webhook pour voir si l'envoi d'email a échoué

### Erreur "Signature invalide" sur le webhook

1. Vérifier que `STRIPE_WEBHOOK_SECRET` correspond à celle affichée par Stripe CLI
2. Si vous avez redémarré Stripe CLI, la clé a changé - récupérez la nouvelle
3. Redémarrer le serveur Next.js après avoir mis à jour `.env.local`

## 📚 Ressources

- [Documentation Stripe](https://docs.stripe.com/)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Webhooks Stripe](https://docs.stripe.com/webhooks)
- [Cartes de test Stripe](https://docs.stripe.com/testing)
- [Resend Documentation](https://resend.com/docs)
- [ngrok Documentation](https://ngrok.com/docs)
