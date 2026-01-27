# Migration vers les créneaux horaires fixes pour les prestations

## 🎯 Objectif

Remplacer la sélection libre d'heure par des **créneaux horaires fixes** pour les prestations (henné) :
- **LUNCH (Déjeuner)** : 12h à 15h30
- **AFTERNOON (Après-midi)** : 16h à 20h
- **EVENING (Soirée)** : 20h30 à 23h30

## ✅ Changements effectués (COMPLÉTÉS)

### 1. Base de données (`migrate-prestation-time-slots.sql`)

**Avant** :
```sql
prestation_items:
  - date (timestamp) : Date + heure libre
  - prestation_time (text) : Heure libre (ex: "14:00")
```

**Après** :
```sql
-- ENUM SQL créé
CREATE TYPE TimeSlot AS ENUM ('LUNCH', 'AFTERNOON', 'EVENING');

prestation_items:
  - prestation_date (date) : Date uniquement
  - time_slot (TimeSlot ENUM) : Créneau fixe ('LUNCH' | 'AFTERNOON' | 'EVENING')
```

**✅ Migration SQL complétée** - La colonne `date` a été supprimée et `time_slot` (ENUM) a été ajouté.

### 2. Types TypeScript

**Fichiers modifiés** :

#### `src/lib/supabase.ts` ✅
```typescript
// Type correspondant à l'ENUM SQL (en majuscules)
export type TimeSlot = 'LUNCH' | 'AFTERNOON' | 'EVENING'

// Mapping pour l'affichage en français
export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  LUNCH: '12h à 15h30',
  AFTERNOON: '16h à 20h',
  EVENING: '20h30 à 23h30',
}

// Tableau helper pour itération
export const TIME_SLOTS: TimeSlot[] = ['LUNCH', 'AFTERNOON', 'EVENING']

// Interface mise à jour
export interface PrestationItem {
  prestation_date?: string // Date only (YYYY-MM-DD)
  time_slot?: TimeSlot // Fixed time slot ENUM
  // ... autres champs
}
```

#### `src/lib/cart-types.ts` ✅
```typescript
// Type identique à src/lib/supabase.ts
export type TimeSlot = 'LUNCH' | 'AFTERNOON' | 'EVENING'

export interface CartItem {
  prestationDate?: Date // Date only
  prestationTimeSlot?: TimeSlot // Fixed time slot ENUM
  // ... autres champs
}
```

### 3. Nouveau composant ✅

**`src/components/TimeSlotPicker.tsx`** :
- Interface visuelle pour sélectionner un créneau
- 3 boutons radio stylisés (LUNCH, AFTERNOON, EVENING)
- Import des constantes depuis `@/lib/supabase`
- Validation intégrée
- Affichage en français via `TIME_SLOT_LABELS`

### 4. Documentation ✅

**`CLAUDE.md`** mis à jour :
- Documentation de la table `prestation_items` avec ENUM
- Ajout du composant `TimeSlotPicker`
- Mise à jour des types TimeSlot

## 📝 Étapes de migration

### ✅ Étape 1 : Migration SQL (COMPLÉTÉE)
- ENUM `TimeSlot` créé avec valeurs : LUNCH, AFTERNOON, EVENING
- Colonne `date` supprimée
- Colonne `prestation_date` (DATE) ajoutée
- Colonne `time_slot` (TimeSlot ENUM) ajoutée

### ✅ Étape 2 : Types TypeScript (COMPLÉTÉS)
- `src/lib/supabase.ts` : Type `TimeSlot` et constantes
- `src/lib/cart-types.ts` : Type `TimeSlot` synchronisé
- `src/components/TimeSlotPicker.tsx` : Composant créé

### 🔄 Étape 3 : Mettre à jour les fichiers existants

#### Fichiers à modifier :
1. **`src/components/PrestationDatePicker.tsx`** (si existant)
   - Retirer la sélection d'heure libre
   - Ajouter le `TimeSlotPicker`

2. **`src/app/api/reservations/create/route.ts`**
   - Changer `prestationTime` → `time_slot`
   - Utiliser les valeurs ENUM en majuscules : 'LUNCH', 'AFTERNOON', 'EVENING'
   - Exemple de payload à insérer :
   ```typescript
   {
     prestation_date: '2025-12-05', // Format YYYY-MM-DD
     time_slot: 'AFTERNOON', // Valeur ENUM
   }
   ```

3. **`src/app/panier/page.tsx`**
   - Afficher le créneau au lieu de l'heure libre
   - Utiliser `TIME_SLOT_LABELS[item.prestationTimeSlot]`

4. **`src/lib/email.tsx`** et **`src/lib/pdf-generator.tsx`**
   - Afficher le créneau horaire dans les emails/PDF
   - Format : "Date : 05/12/2025 - Créneau : 12h à 15h30"

5. **Pages de produits henné** (ex: `src/app/services/prestations/[subcategory]/[slug]/page.tsx`)
   - Intégrer le `TimeSlotPicker` au lieu d'un champ d'heure libre

### Étape 4 : Exemple d'utilisation du TimeSlotPicker

```tsx
'use client'

import { useState } from 'react'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import { TimeSlot, TIME_SLOT_LABELS } from '@/lib/supabase'

function PrestationBooking() {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>()

  return (
    <div>
      <TimeSlotPicker
        selectedSlot={selectedSlot}
        onSlotChange={setSelectedSlot}
      />

      {selectedSlot && (
        <p className="mt-2 text-sm text-gray-600">
          Créneau sélectionné : {TIME_SLOT_LABELS[selectedSlot]}
        </p>
      )}
    </div>
  )
}
```

**Note importante** : Les valeurs du TimeSlot sont en **MAJUSCULES** : `'LUNCH'`, `'AFTERNOON'`, `'EVENING'`

### Étape 5 : Affichage dans le panier

```tsx
// src/app/panier/page.tsx
import { TIME_SLOT_LABELS } from '@/lib/supabase'

// Dans le rendu de l'item
{item.prestationTimeSlot && (
  <p className="text-sm text-gray-600">
    <span className="font-medium">Créneau :</span> {TIME_SLOT_LABELS[item.prestationTimeSlot]}
  </p>
)}

// Exemple complet pour un item henné dans le panier :
{item.category === 'henne' && (
  <div className="text-sm text-gray-600 space-y-1">
    <p>
      <span className="font-medium">Date :</span>{' '}
      {item.prestationDate ? format(item.prestationDate, 'dd/MM/yyyy', { locale: fr }) : '-'}
    </p>
    {item.prestationTimeSlot && (
      <p>
        <span className="font-medium">Créneau :</span> {TIME_SLOT_LABELS[item.prestationTimeSlot]}
      </p>
    )}
  </div>
)}
```

### Étape 6 : Création de réservation (API)

```typescript
// src/app/api/reservations/create/route.ts
import { format } from 'date-fns'

const prestationItemData = {
  prestation_reservation_id: prestationReservation.id,
  product_id: item.productId,
  prestation_date: item.prestationDate
    ? format(new Date(item.prestationDate), 'yyyy-MM-dd')
    : null,
  time_slot: item.prestationTimeSlot, // Type-safe: 'LUNCH' | 'AFTERNOON' | 'EVENING'
  quantity: item.quantity,
  options: item.selectedOptions,
  personalizations: item.personalizations,
}

// Insérer dans la base de données
const { data, error } = await supabase
  .from('prestation_items')
  .insert([prestationItemData])
```

## 🔍 Tests à effectuer

### Tests de migration :

1. ✅ **Base de données** : Vérifier la structure de la table `prestation_items`
   ```sql
   SELECT column_name, data_type, udt_name
   FROM information_schema.columns
   WHERE table_name = 'prestation_items';
   ```

2. ⏳ **Sélection de créneau** : Tester le `TimeSlotPicker` sur une page produit henné
3. ⏳ **Affichage panier** : Vérifier que le créneau s'affiche correctement
4. ⏳ **Création réservation** : Créer une réservation de test avec un créneau
5. ⏳ **Email confirmation** : Vérifier l'affichage du créneau dans l'email
6. ⏳ **PDF confirmation** : Vérifier l'affichage du créneau dans le PDF
7. ⏳ **Dashboard admin** : Tester l'affichage des créneaux dans l'admin

### Validation des valeurs ENUM :

```sql
-- Vérifier les valeurs de l'ENUM
SELECT enum_range(NULL::TimeSlot);
-- Résultat attendu : {LUNCH,AFTERNOON,EVENING}

-- Test d'insertion (doit réussir)
INSERT INTO prestation_items (prestation_date, time_slot)
VALUES ('2025-12-05', 'AFTERNOON');

-- Test d'insertion invalide (doit échouer)
INSERT INTO prestation_items (prestation_date, time_slot)
VALUES ('2025-12-05', 'invalid'); -- ❌ Erreur attendue
```

## 🎨 Avantages de cette approche

1. **Type Safety** : ENUM SQL + TypeScript = validation à tous les niveaux
2. **Clarté** : Les créneaux sont explicites (LUNCH, AFTERNOON, EVENING)
3. **Validation automatique** : La base de données rejette les valeurs invalides
4. **Performance** : Index sur (prestation_date, time_slot) pour requêtes rapides
5. **UX améliorée** : 3 boutons clairs au lieu d'un time picker complexe
6. **Maintenance** : Un seul point de vérité pour les créneaux (ENUM SQL)

## 🚨 Points d'attention

- ⚠️ **Migration des données existantes** : Si vous avez déjà des réservations avec l'ancien format, vous devrez les migrer manuellement
- ⚠️ **Compatibilité** : Assurez-vous que tous les endroits utilisant `prestationTime` sont mis à jour
- ⚠️ **Emails** : Vérifiez que les templates d'email affichent correctement les créneaux

## 📚 Ressources

- **SQL de migration** : `migrate-prestation-time-slots.sql`
- **Composant** : `src/components/TimeSlotPicker.tsx`
- **Types** : `src/lib/supabase.ts` et `src/lib/cart-types.ts`
- **Documentation** : `CLAUDE.md` (section Database Architecture)
