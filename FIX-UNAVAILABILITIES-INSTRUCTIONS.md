# Correction du système d'unavailabilities

## Problèmes identifiés

1. **Tables obsolètes** : La fonction SQL `get_product_unavailabilities` interrogeait les anciennes tables `reservation_items` et `reservations` qui n'existent plus depuis la migration vers la nouvelle architecture hiérarchique.

2. **Conflit de signatures** : Plusieurs versions de la fonction existaient avec des types de paramètres différents (`bigint`, `integer`, `INT8`), causant une erreur d'ambiguïté.

### Ancienne structure (obsolète)
```
reservations
└── reservation_items
```

### Nouvelle structure (actuelle)
```
customer_orders
└── rental_reservations
    └── rental_items
```

## Solution

La fonction SQL a été corrigée pour :
1. **Supprimer les anciennes versions** avec `DROP FUNCTION IF EXISTS` pour éviter les conflits
2. **Utiliser les nouvelles tables** :
   - `rental_items` (au lieu de `reservation_items`)
   - `rental_reservations` (au lieu de `reservations`)
3. **Accorder les permissions** aux rôles `anon`, `authenticated`, et `service_role`

## Instructions de déploiement

### Option 1 : Via le SQL Editor de Supabase (recommandé)

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier [supabase/migrations/get_product_unavailabilities.sql](supabase/migrations/get_product_unavailabilities.sql)
5. Cliquez sur **Run**
6. Vérifiez que la fonction a été créée avec succès

### Option 2 : Via psql (si vous avez accès direct à la base de données)

```bash
# Récupérez votre DATABASE_URL depuis Supabase Dashboard > Project Settings > Database
psql "votre-database-url" -f supabase/migrations/get_product_unavailabilities.sql
```

## Vérification

Après avoir exécuté la migration, testez la fonction avec un product_id existant :

```sql
-- Remplacez 1 par un ID de produit réel dans votre base
SELECT * FROM get_product_unavailabilities(1);
```

Vous devriez voir les dates avec le nombre de produits réservés pour chaque date :

```
date        | reserved_products
------------|------------------
2025-12-10  | 2
2025-12-11  | 5
2025-12-12  | 3
```

## Impact

Une fois la fonction déployée, le calendrier de sélection de dates dans les pages produits affichera correctement :
- Les dates grisées lorsque le stock est insuffisant
- Les dates disponibles basées sur les réservations réelles
- La validation du stock pour la quantité demandée

## Fichiers modifiés

- ✅ [supabase/migrations/get_product_unavailabilities.sql](supabase/migrations/get_product_unavailabilities.sql) - Fonction SQL corrigée

## Notes techniques

La fonction :
- Utilise `generate_series` pour créer une entrée par jour entre `rental_start` et `rental_end`
- Exclut les réservations avec le statut `CANCELLED`
- Ne retourne que les dates futures (>= aujourd'hui)
- Somme les quantités réservées par date
- Est accessible par les rôles `anon`, `authenticated`, et `service_role`
