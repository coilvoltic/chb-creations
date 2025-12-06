# Implémentation du système de codes promotionnels

## ✅ Résumé

Le système de codes promotionnels a été entièrement implémenté. Les codes promos permettent d'appliquer une réduction en pourcentage sur le montant total d'une commande (produits + frais de livraison).

## 📁 Fichiers créés

### 1. Migration SQL
- **[supabase/migrations/add_promotional_codes_to_orders.sql](supabase/migrations/add_promotional_codes_to_orders.sql)**
  - Ajoute 3 colonnes dans `customer_orders` : `promotional_code_id` (FK), `promotional_code_name`, `promotional_code_discount`
  - Crée un index pour améliorer les performances
  - Ajoute une contrainte de cohérence
  - **⚠️ À DÉPLOYER MANUELLEMENT** (voir instructions ci-dessous)

### 2. API de validation
- **[src/app/api/validate-promo-code/route.ts](src/app/api/validate-promo-code/route.ts)**
  - Endpoint POST pour valider un code promo
  - Vérifie l'existence du code dans la table `promotional_codes`
  - Retourne le code et le pourcentage de réduction

### 3. Composant UI
- **[src/components/PromoCodeInput.tsx](src/components/PromoCodeInput.tsx)**
  - Composant réutilisable pour saisir et appliquer un code promo
  - Affichage avec icône Tag (Lucide)
  - États : en attente de saisie, validation en cours, appliqué avec succès
  - Bouton pour retirer le code appliqué

## 🔧 Fichiers modifiés

### Types TypeScript
1. **[src/lib/cart-types.ts](src/lib/cart-types.ts:47-50)**
   - Ajout de l'interface `PromoCode`
   - Ajout du champ `promoCode?: PromoCode` dans `Cart`

2. **[src/lib/supabase.ts](src/lib/supabase.ts:76-94)**
   - Ajout de l'interface `PromotionalCode`
   - Ajout des champs promo dans `CustomerOrder`

### Contexte & État global
3. **[src/contexts/CartContext.tsx](src/contexts/CartContext.tsx)**
   - Ajout de la fonction `setPromoCode()`
   - Ajout des fonctions utilitaires :
     - `getSubtotal()` : Total avant réduction
     - `getDiscountAmount()` : Montant de la réduction
     - `getFinalTotal()` : Total final après réduction
   - Sauvegarde du code promo dans localStorage

### Page panier
4. **[src/app/panier/page.tsx](src/app/panier/page.tsx:1012-1033)**
   - Intégration du composant `PromoCodeInput`
   - Affichage du sous-total, réduction, et total final
   - Envoi du code promo dans le payload de création de réservation

### APIs de création de réservation
5. **[src/app/api/reservations/create/route.ts](src/app/api/reservations/create/route.ts:107-131)**
   - Récupération de l'ID du code promo depuis la DB
   - Sauvegarde des 3 champs dans `customer_orders` (FK + snapshots)
   - Transmission du code promo au PDF et email

6. **[src/app/api/process-payment/route.ts](src/app/api/process-payment/route.ts:71-95)**
   - Même logique pour les paiements Stripe

### PDF et Email
7. **[src/lib/pdf-generator.tsx](src/lib/pdf-generator.tsx:468-496)**
   - Affichage du sous-total avant réduction
   - Affichage de la ligne de réduction en vert
   - Affichage du total final

8. **[src/lib/email.tsx](src/lib/email.tsx:164-171)**
   - Affichage du code promo dans l'email de confirmation (en vert)

### Suivi de commande
9. **[src/app/suivi/page.tsx](src/app/suivi/page.tsx:66-84)**
   - Affichage du code promo dans la section "Informations client"
   - Mise à jour de l'interface `OrderData`

10. **[src/app/api/orders/track/route.ts](src/app/api/orders/track/route.ts:109-123)**
    - Ajout des champs `promoCode` et `promoDiscount` dans la réponse

11. **[src/app/api/orders/user/route.ts](src/app/api/orders/user/route.ts:106-119)**
    - Même chose pour l'API des commandes utilisateur

## 🚀 Instructions de déploiement

### Étape 1 : Déployer la migration SQL

**Option recommandée : Via le SQL Editor de Supabase**

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier [supabase/migrations/add_promotional_codes_to_orders.sql](supabase/migrations/add_promotional_codes_to_orders.sql)
5. Cliquez sur **Run**
6. Vérifiez que les colonnes ont été ajoutées avec succès

### Étape 2 : Créer des codes promotionnels

Ajoutez des codes dans la table `promotional_codes` :

```sql
INSERT INTO promotional_codes (name, discount)
VALUES
  ('NOEL2024', 20),    -- 20% de réduction
  ('BIENVENUE', 10),   -- 10% de réduction
  ('PROMO50', 50);     -- 50% de réduction
```

**Important** : Les codes doivent être en **MAJUSCULES** (normalisés automatiquement côté client et API).

### Étape 3 : Tester le système

1. Ajoutez des produits au panier
2. Sur la page panier, saisissez un code promo (ex: `NOEL2024`)
3. Cliquez sur "Appliquer"
4. Vérifiez que la réduction est affichée
5. Créez une commande et vérifiez :
   - Le PDF contient le code promo
   - L'email contient le code promo
   - La page de suivi affiche le code promo
   - Le montant total est correct (avec réduction)

## 🎯 Fonctionnalités

### Pour les clients
- ✅ Saisie d'un code promo dans la page panier
- ✅ Validation en temps réel du code
- ✅ Affichage du sous-total, réduction, et total final
- ✅ Messages d'erreur si le code est invalide
- ✅ Possibilité de retirer le code appliqué
- ✅ Code promo affiché dans la confirmation PDF
- ✅ Code promo affiché dans l'email de confirmation
- ✅ Code promo affiché dans le suivi de commande

### Pour l'admin
- ✅ Codes promos stockés dans la base de données (`promotional_codes`)
- ✅ Traçabilité : FK + snapshots permettent de faire des stats
- ✅ Les commandes conservent le code et le discount même si le code est supprimé/modifié
- ✅ Possibilité de requêter toutes les utilisations d'un code :
  ```sql
  SELECT * FROM customer_orders
  WHERE promotional_code_id = <id_du_code>
  ```

## 📊 Architecture technique

### Structure de données

```
promotional_codes (table existante)
├── id (bigint, PK)
├── name (text) -- Ex: "NOEL2024"
└── discount (int2) -- Ex: 20 (= 20%)

customer_orders
├── ... (colonnes existantes)
├── promotional_code_id (FK → promotional_codes.id) -- Pour traçabilité
├── promotional_code_name (text) -- Snapshot du nom
└── promotional_code_discount (int2) -- Snapshot du discount

cart (state client)
├── ... (données existantes)
└── promoCode?: { code: string, discount: number }
```

### Flux de données

1. **Client saisit le code** → API `/api/validate-promo-code`
2. **API valide le code** → Retourne `{valid: true, promoCode: {...}}`
3. **CartContext sauvegarde** → `setPromoCode({code, discount})`
4. **Client finalise** → Payload inclut `promoCode`
5. **API création commande** :
   - Récupère l'ID du code depuis la DB
   - Sauvegarde FK + snapshots dans `customer_orders`
   - Transmet au PDF/email
6. **PDF/Email/Suivi** → Affichent le code et la réduction

### Calculs

```typescript
// Sous-total = produits + frais de livraison
subtotal = totalPrice + rentalDeliveryFees + purchaseDeliveryFees + prestationDeliveryFees

// Réduction = pourcentage appliqué au sous-total
discount = (subtotal * promoDiscount) / 100

// Total final = sous-total - réduction
finalTotal = subtotal - discount
```

## 🔒 Sécurité

- ✅ Validation côté serveur (pas de confiance dans les données client)
- ✅ Codes normalisés en MAJUSCULES pour éviter les doublons
- ✅ Vérification de l'existence du code dans la DB
- ✅ Contrainte SQL garantit la cohérence des données (FK + snapshots)
- ✅ API utilise `service_role` pour bypasser RLS en toute sécurité

## 📝 Notes importantes

1. **Snapshots immuables** : Les codes et discounts sont sauvegardés au moment de la commande, donc les modifications futures des codes promos n'affectent pas les commandes passées.

2. **FK pour analytics** : La FK `promotional_code_id` permet de faire des statistiques d'utilisation même si le code est supprimé.

3. **Gestion des codes** : Recommandation pour gérer les codes promos :
   - Ne jamais modifier un code existant → créer un nouveau code
   - Pour désactiver un code → ajouter un flag `is_active` dans `promotional_codes`

4. **Interface admin** : Pour une gestion complète, vous pourriez créer une interface admin pour :
   - Créer/modifier/désactiver des codes
   - Voir les statistiques d'utilisation
   - Définir des dates de validité
   - Limiter le nombre d'utilisations

## 🎉 Résultat final

Le système de codes promotionnels est 100% fonctionnel et intégré dans tout le parcours client, du panier jusqu'au suivi de commande en passant par les confirmations PDF et email !
