# Système de Réservation - Documentation

## Architecture de la base de données

### Tables

#### 1. `products`
Contient le catalogue statique des produits.

**Colonnes importantes :**
- `id` (int8, primary key)
- `name`, `slug`, `price`, `images`, `description`, `features`
- `category`, `subcategory`
- `stock` (int) - Stock total disponible
- ❌ Plus de colonne `unavailabilities` - calculée dynamiquement

#### 2. `reservations`
Contient les informations de chaque réservation client.

**Colonnes :**
- `id` (int8, primary key)
- `created_at` (timestamp)
- `customer_infos` (jsonb) - Contient: `{ firstName, lastName, email, phone }`
- `deposit` (float4) - Acompte payé (50% par défaut)
- `caution` (float4) - Montant de la caution
- `reservation_status` (enum) - `DONE`, `CANCELLED`, `CONFIRMED`, `CONFIRMED_NO_DEPOSIT`
- `total_price` (float4) - Prix total de la réservation

#### 3. `reservation_items`
Table de liaison entre reservations et products (plusieurs produits par réservation).

**Colonnes :**
- `id` (int8, primary key)
- `reservation_id` (int8, foreign key → reservations.id)
- `product_id` (int8, foreign key → products.id)
- `quantity` (int2)
- `rental_start` (timestamp) - Date + heure de début de location
- `rental_end` (timestamp) - Date + heure de fin de location

---

## Fonction SQL : `get_product_unavailabilities`

**Objectif :** Calculer dynamiquement les dates indisponibles pour un produit donné.

**Localisation :** `/supabase/migrations/get_product_unavailabilities.sql`

**Utilisation :**
```sql
SELECT * FROM get_product_unavailabilities(42);
```

**Résultat :**
```
date        | reserved_products
------------|------------------
2025-01-15  | 10
2025-01-16  | 15
2025-01-17  | 5
```

**Logique :**
1. Pour un `product_id` donné, récupère tous les `reservation_items` associés
2. Exclut les réservations `CANCELLED`
3. Génère toutes les dates entre `rental_start` et `rental_end`
4. Somme les quantités réservées par date
5. Retourne les dates avec le nombre total d'unités réservées

---

## API Routes

### POST `/api/reservations/create`

Crée une nouvelle réservation avec ses items.

**Payload :**
```json
{
  "customerInfo": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "0612345678"
  },
  "items": [
    {
      "productId": 1,
      "productName": "Assiettes dorées",
      "quantity": 10,
      "pricePerUnit": 5.5,
      "rentalStart": "2025-01-15T09:00:00.000Z",
      "rentalEnd": "2025-01-17T18:00:00.000Z"
    }
  ],
  "deposit": 55.0,
  "caution": 100.0,
  "notes": ""
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "reservationId": 12345,
  "message": "Réservation créée avec succès"
}
```

**Logique :**
1. Validation des données
2. Calcul du prix total
3. Création d'une ligne dans `reservations`
4. Création de N lignes dans `reservation_items` (une par produit du panier)
5. En cas d'erreur sur les items → rollback (suppression de la réservation)

---

## Frontend

### Page panier (`/src/app/panier/page.tsx`)

**Fonctionnalités :**
1. Affiche les articles du panier (lecture seule)
2. Affiche le récapitulatif avec :
   - Prix total
   - Acompte (50%)
   - Caution (100€ fixe)
3. Formulaire de validation :
   - Prénom, Nom, Email, Téléphone (requis)
   - Validation email
4. Envoi des données à `/api/reservations/create`
5. Vidage du panier après succès
6. Redirection vers la page d'accueil

### Pages produits

**Calcul dynamique des unavailabilities :**

Le fichier `/src/actions/products.ts` contient la fonction `getProductBySlug()` qui :
1. Récupère le produit depuis Supabase
2. Appelle `get_product_unavailabilities(product.id)` via `.rpc()`
3. Attache les unavailabilities au produit
4. Retourne le produit avec les dates indisponibles calculées en temps réel

**Workflow utilisateur :**
1. Sélectionne quantité
2. Choisit dates de location (calendrier désactive les dates indisponibles)
3. Choisit horaires de retrait/dépôt
4. Ajoute au panier
5. Le calendrier recalcule les unavailabilities si la quantité change

---

## Types TypeScript (`/src/lib/supabase.ts`)

### Nouveaux types ajoutés :

```typescript
export type ReservationStatus = 'DONE' | 'CANCELLED' | 'CONFIRMED' | 'CONFIRMED_NO_DEPOSIT'

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Reservation {
  id: number
  created_at: string
  customer_first_name: string
  customer_infos: CustomerInfo
  deposit: number
  caution: number
  reservation_status: ReservationStatus
  total_price?: number
  notes?: string
}

export interface ReservationItem {
  id: number
  reservation_id: number
  product_id: number
  rental_start: string // ISO timestamp
  rental_end: string // ISO timestamp
  quantity: number
}
```

### Fonction helper :

```typescript
export async function getProductUnavailabilities(productId: number): Promise<UnavailabilityEntry[]>
```

---

## Configuration requise

### Variables d'environnement (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Migration Supabase

Exécutez le fichier SQL :
```bash
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/get_product_unavailabilities.sql
```

Ou via l'interface Supabase : SQL Editor → coller le contenu du fichier → Run.

---

## Prochaines étapes recommandées

### 1. Interface admin

Créer une page admin pour :
- Visualiser toutes les réservations
- Filtrer par statut / date
- Voir le planning produit (quelles dates sont réservées pour chaque produit)
- Modifier le statut d'une réservation
- Voir les informations client

### 2. Paiement

Intégrer Stripe ou autre solution de paiement pour :
- Payer l'acompte en ligne
- Générer un reçu
- Mettre à jour automatiquement `deposit` et `reservation_status`

### 3. Notifications

- Email de confirmation au client (avec résumé)
- Email de notification à l'admin
- SMS de rappel avant la location

### 4. Gestion des stocks

- Vérifier la disponibilité avant validation finale
- Gérer les conflits (deux clients réservent en même temps)
- Utiliser des transactions PostgreSQL pour éviter les doubles réservations

### 5. Optimisations

- Mettre en cache les unavailabilities (Redis)
- Ajouter un index sur `reservation_items(product_id, rental_start, rental_end)`
- Paginer les listes de réservations

---

## Résumé du workflow complet

```
1. Client visite la page produit
   ↓
2. Le calendrier charge les unavailabilities via get_product_unavailabilities()
   ↓
3. Client sélectionne dates/quantité/horaires
   ↓
4. Ajoute au panier (stocké dans localStorage)
   ↓
5. Client va sur /panier
   ↓
6. Clique sur "Valider la commande"
   ↓
7. Remplit le formulaire (nom, email, téléphone)
   ↓
8. Clique sur "Confirmer la réservation"
   ↓
9. POST /api/reservations/create
   ↓
10. Insertion dans reservations + reservation_items
   ↓
11. Succès → vidage panier + redirection
   ↓
12. Les prochains clients verront les dates réservées comme indisponibles
```

---

**Date de création :** 2025-01-10
**Version :** 1.0
