# Référence rapide : Créneaux horaires (Time Slots)

## 📋 Valeurs ENUM

```typescript
type TimeSlot = 'LUNCH' | 'AFTERNOON' | 'EVENING'
```

| Valeur | Français | Horaires |
|--------|----------|----------|
| `LUNCH` | Déjeuner | 12h à 15h30 |
| `AFTERNOON` | Après-midi | 16h à 20h |
| `EVENING` | Soirée | 20h30 à 23h30 |

## 🔧 Imports nécessaires

```typescript
import { TimeSlot, TIME_SLOT_LABELS, TIME_SLOTS } from '@/lib/supabase'
```

## 💻 Exemples d'utilisation

### 1. Afficher un créneau en français
```typescript
const slot: TimeSlot = 'AFTERNOON'
const label = TIME_SLOT_LABELS[slot] // "16h à 20h"
```

### 2. Itérer sur tous les créneaux
```typescript
TIME_SLOTS.forEach(slot => {
  console.log(`${slot}: ${TIME_SLOT_LABELS[slot]}`)
})
// LUNCH: 12h à 15h30
// AFTERNOON: 16h à 20h
// EVENING: 20h30 à 23h30
```

### 3. Utiliser le composant TimeSlotPicker
```tsx
import TimeSlotPicker from '@/components/TimeSlotPicker'

<TimeSlotPicker
  selectedSlot={selectedSlot}
  onSlotChange={setSelectedSlot}
  disabled={false}
/>
```

### 4. Insertion en base de données
```typescript
await supabase.from('prestation_items').insert({
  prestation_date: '2025-12-05',
  time_slot: 'AFTERNOON', // Valeur ENUM
  // ...
})
```

### 5. Affichage dans le panier
```tsx
{item.prestationTimeSlot && (
  <p>Créneau : {TIME_SLOT_LABELS[item.prestationTimeSlot]}</p>
)}
```

## ⚠️ Points importants

1. **Toujours en MAJUSCULES** : `'LUNCH'` pas `'lunch'`
2. **Type-safe** : TypeScript vous alertera si vous utilisez une valeur invalide
3. **Validation SQL** : La base rejette automatiquement les valeurs non-ENUM
4. **Import depuis supabase.ts** : Utilisez toujours les constantes exportées

## 🐛 Erreurs communes

### ❌ Mauvais
```typescript
const slot = 'afternoon' // Minuscules - erreur TypeScript
time_slot: 'midi' // Valeur invalide - erreur SQL
```

### ✅ Correct
```typescript
const slot: TimeSlot = 'AFTERNOON' // Majuscules
time_slot: 'LUNCH' // Valeur ENUM valide
```

## 🔍 Vérification rapide

```sql
-- Lister les valeurs possibles de l'ENUM
SELECT enum_range(NULL::TimeSlot);
-- Résultat : {LUNCH,AFTERNOON,EVENING}
```
