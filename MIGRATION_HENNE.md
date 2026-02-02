# Migration du système de créneaux henné

## 📋 Résumé des changements

Le système de réservation henné a été migré pour supporter :
- ✅ **Disponibilités centralisées** : Les créneaux occupés sont partagés entre tous les produits henné
- ✅ **Sélection d'heure libre** : Pour le henné en boutique, le client choisit une heure précise
- ✅ **Durée dynamique** : La durée de la prestation est définie dans les options du produit

---

## 🗄️ Changements en base de données

### 1. Table `prestation_items`

**AVANT** :
```sql
prestation_date DATE         -- Date uniquement
time_slot TimeSlot           -- ENUM: 'LUNCH' | 'AFTERNOON' | 'EVENING'
```

**APRÈS** :
```sql
prestation_start TIMESTAMP WITH TIME ZONE  -- Date + heure de début
prestation_end TIMESTAMP WITH TIME ZONE    -- Date + heure de fin
```

### 2. Nouvelles fonctions SQL

#### `get_all_prestation_unavailabilities()`
Retourne TOUS les créneaux occupés (tous produits confondus) :
```sql
SELECT * FROM get_all_prestation_unavailabilities();
-- Résultat :
-- product_id | prestation_start           | prestation_end
-- -----------|----------------------------|---------------------------
-- 5          | 2025-01-20 12:00:00+00     | 2025-01-20 15:30:00+00
-- 5          | 2025-01-20 16:00:00+00     | 2025-01-20 20:00:00+00
-- 7          | 2025-01-21 14:30:00+00     | 2025-01-21 16:30:00+00
```

#### `is_prestation_slot_available(start, end)`
Vérifie si un créneau est disponible (pas de chevauchement) :
```sql
SELECT is_prestation_slot_available(
  '2025-01-20 14:00:00+00',
  '2025-01-20 16:00:00+00'
);
-- Résultat : FALSE (chevauche avec 12h-15h30)
```

---

## 📝 Configuration des produits henné

### Structure des options avec durée

Pour activer la sélection d'heure libre, ajoutez le champ `duration` dans les options du produit :

```json
{
  "options": [
    {
      "option_type_name": "Type de henné",
      "options": [
        {
          "name": "Henné simple",
          "description": "Motifs traditionnels",
          "additional_fee": 0,
          "duration": 60
        },
        {
          "name": "Henné complet",
          "description": "Designs élaborés",
          "additional_fee": 20,
          "duration": 120
        },
        {
          "name": "Henné VIP",
          "description": "Designs premium avec détails fins",
          "additional_fee": 50,
          "duration": 180
        }
      ]
    }
  ]
}
```

**Important** :
- `duration` est en **minutes** (60 = 1h, 120 = 2h, etc.)
- Si aucune durée n'est spécifiée, la durée par défaut est **60 minutes**
- Le système calcule automatiquement l'heure de fin : `heure_fin = heure_début + duration`

---

## 🎨 Interface utilisateur

### Sélection d'heure pour le client

Le nouveau composant `TimePickerBoutique` permet :
- Sélection d'une date (calendrier)
- Sélection d'une heure de début (menu déroulant : 9h à 21h, par tranches de 30 min)
- Affichage automatique de l'heure de fin calculée
- **Détection de conflits en temps réel** : avertissement si le créneau chevauche une réservation existante

### Exemple d'affichage

```
📅 Date de la prestation
[Calendrier interactif]

🕐 Heure de la prestation
Heure de début : [14:30 ▼]

┌──────────────────────────────────────┐
│ Durée : 120 minutes                  │
│ Heure de fin : 16:30                 │
└──────────────────────────────────────┘

⚠️ Créneau indisponible : chevauchement avec une autre réservation
```

---

## 🔄 Migration des données

### Exécuter la migration

```bash
# 1. Modifier la structure de prestation_items
psql -U postgres -d chb_creations -f supabase/migrations/migrate_prestation_times.sql

# 2. Créer les fonctions SQL centralisées
psql -U postgres -d chb_creations -f supabase/migrations/get_all_prestation_unavailabilities.sql
```

### Conversion automatique des données existantes

La migration convertit automatiquement les anciens créneaux :

| Ancien format | Nouveau format |
|--------------|----------------|
| `prestation_date: 2025-01-20` + `time_slot: LUNCH` | `prestation_start: 2025-01-20 12:00:00+00` <br> `prestation_end: 2025-01-20 15:30:00+00` |
| `prestation_date: 2025-01-20` + `time_slot: AFTERNOON` | `prestation_start: 2025-01-20 16:00:00+00` <br> `prestation_end: 2025-01-20 20:00:00+00` |
| `prestation_date: 2025-01-20` + `time_slot: EVENING` | `prestation_start: 2025-01-20 20:30:00+00` <br> `prestation_end: 2025-01-20 23:30:00+00` |

---

## 🧪 Tests recommandés

### 1. Tester la sélection d'heure
- Créer un produit henné avec des options ayant différentes durées
- Ajouter au panier et vérifier que l'heure de fin est correctement calculée

### 2. Tester la centralisation des disponibilités
- Créer une réservation pour le produit "Henné à domicile" le 20/01/2025 à 14h-16h
- Vérifier que ce créneau est marqué comme indisponible dans "Henné en boutique" également

### 3. Tester la détection de chevauchement
- Essayer de réserver 15h-17h alors qu'un créneau 14h-16h existe déjà
- Vérifier que l'avertissement s'affiche : ⚠️ Créneau indisponible

---

## 📦 Fichiers modifiés

### Migrations SQL
- `supabase/migrations/migrate_prestation_times.sql` : Migration de la structure
- `supabase/migrations/get_all_prestation_unavailabilities.sql` : Fonctions de disponibilité

### TypeScript
- `src/lib/supabase.ts` : Mise à jour des interfaces (`PrestationItem`, `PrestationUnavailableSlot`, `ProductOption`)
- `src/lib/cart-types.ts` : Mise à jour `CartItem` et `SelectedOption`

### Composants
- `src/components/TimePickerBoutique.tsx` : **NOUVEAU** - Sélection d'heure avec détection de conflits
- `src/components/ProductDetailPage.tsx` : Utilise le nouveau picker
- `src/contexts/CartContext.tsx` : Support de `prestationStart` et `prestationEnd`

### API
- `src/app/api/reservations/create/route.ts` : Insère `prestation_start` et `prestation_end` au lieu de `prestation_date` et `time_slot`
- `src/actions/products.ts` : Appelle `get_all_prestation_unavailabilities()` (centralisé)

### Email & PDF
- `src/lib/email.tsx` : Affiche les horaires au lieu des créneaux fixes
- `src/lib/pdf-generator.tsx` : Formatte `DD/MM/YYYY de HH:MM à HH:MM`

### Pages
- `src/app/panier/page.tsx` : Affiche les horaires de prestation

---

## ⚡ Avantages du nouveau système

✅ **Flexibilité** : Le client choisit son heure exacte
✅ **Centralisation** : Plus de conflit entre différents types de henné
✅ **Durée variable** : Chaque option peut avoir sa propre durée
✅ **Temps réel** : Détection instantanée des chevauchements
✅ **Évolutif** : Facile d'ajouter de nouveaux types de prestations

---

## 🛠️ Maintenance

### Ajouter un nouveau produit henné

1. Créer le produit dans la base de données avec `category: 'prestations'`
2. Ajouter les options avec le champ `duration` (en minutes)
3. Aucune autre configuration nécessaire ! Le système centralisé gère automatiquement les disponibilités

### Ajuster les horaires disponibles

Modifier `TimePickerBoutique.tsx` ligne 52 :
```typescript
// Actuellement : 9h à 21h
for (let hour = 9; hour <= 21; hour++) {
  // ...
}

// Pour changer (ex: 10h à 22h) :
for (let hour = 10; hour <= 22; hour++) {
  // ...
}
```

---

## ❓ FAQ

**Q : Puis-je encore utiliser des créneaux fixes ?**
R : Non, l'ancien système (LUNCH/AFTERNOON/EVENING) a été supprimé. Toutes les prestations utilisent maintenant des horaires libres.

**Q : Que se passe-t-il si je ne mets pas de durée dans les options ?**
R : La durée par défaut de 60 minutes sera utilisée.

**Q : Les anciennes réservations sont-elles conservées ?**
R : Oui, elles sont automatiquement converties lors de la migration SQL.

**Q : Comment bloquer manuellement un créneau ?**
R : Créer une réservation manuelle dans `prestation_reservations` + `prestation_items` avec les heures souhaitées.

---

**Date de migration** : 2026-02-01
**Auteur** : Claude Sonnet 4.5
