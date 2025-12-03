# Système de disponibilité des créneaux pour les prestations

## 🎯 Objectif

Empêcher les réservations simultanées pour un même créneau horaire de prestation (henné) à une date donnée. Chaque produit ne peut être réservé qu'une seule fois par créneau et par jour.

## 📋 Fonctionnement

### 1. Architecture de base

Le système vérifie en temps réel la disponibilité des créneaux horaires pour une prestation donnée :
- **3 créneaux** : LUNCH (12h-15h30), AFTERNOON (16h-20h), EVENING (20h30-23h30)
- **Vérification par produit et par date** : Un créneau est indisponible si déjà réservé
- **Exclusion des réservations annulées** : Seules les réservations actives bloquent les créneaux

### 2. Composants du système

#### a) Fonction SQL (`get_prestation_unavailable_slots`)

**Fichier** : `supabase/migrations/get_prestation_unavailable_slots.sql`

```sql
CREATE OR REPLACE FUNCTION get_prestation_unavailable_slots(
  product_id_param BIGINT,
  date_param DATE
)
RETURNS TABLE(time_slot TEXT)
```

**Paramètres** :
- `product_id_param` : ID du produit (prestation)
- `date_param` : Date au format YYYY-MM-DD

**Retour** :
- Liste des créneaux déjà réservés pour cette date et ce produit
- Exclut automatiquement les réservations avec status 'CANCELLED'

**Exemple d'utilisation SQL** :
```sql
-- Vérifier les créneaux réservés pour le produit 5 le 15 janvier 2025
SELECT * FROM get_prestation_unavailable_slots(5, '2025-01-15');

-- Résultat possible :
-- time_slot
-- -----------
-- AFTERNOON
-- EVENING
-- (LUNCH est disponible)
```

#### b) API Route (`/api/prestation-unavailable-slots`)

**Fichier** : `src/app/api/prestation-unavailable-slots/route.ts`

**Méthode** : GET

**Paramètres de requête** :
- `productId` (required) : ID du produit
- `date` (required) : Date au format YYYY-MM-DD

**Exemple d'appel** :
```typescript
const response = await fetch(
  `/api/prestation-unavailable-slots?productId=5&date=2025-01-15`
)
const data = await response.json()
// { unavailableSlots: ['AFTERNOON', 'EVENING'] }
```

**Réponse** :
```json
{
  "unavailableSlots": ["AFTERNOON", "EVENING"]
}
```

#### c) Composant TimeSlotPicker

**Fichier** : `src/components/TimeSlotPicker.tsx`

**Props** :
```typescript
interface TimeSlotPickerProps {
  selectedSlot?: TimeSlot
  onSlotChange: (slot: TimeSlot) => void
  disabled?: boolean
  unavailableSlots?: TimeSlot[] // ← Nouveau prop
}
```

**Comportement** :
- Les créneaux indisponibles sont affichés avec un style rouge
- Impossible de sélectionner un créneau indisponible
- Label "Indisponible" affiché pour les créneaux réservés

**Exemple d'utilisation** :
```tsx
<TimeSlotPicker
  selectedSlot={prestationTimeSlot}
  onSlotChange={setPrestationTimeSlot}
  disabled={isInCart || loadingSlots}
  unavailableSlots={['AFTERNOON', 'EVENING']} // LUNCH est disponible
/>
```

#### d) Intégration dans ProductDetailPage

**Fichier** : `src/components/ProductDetailPage.tsx`

**États ajoutés** :
```typescript
const [unavailableSlots, setUnavailableSlots] = useState<TimeSlot[]>([])
const [loadingSlots, setLoadingSlots] = useState(false)
```

**useEffect de chargement** :
```typescript
useEffect(() => {
  async function loadUnavailableSlots() {
    if (!isPrestationProduct || !prestationDate || !product) {
      setUnavailableSlots([])
      return
    }

    setLoadingSlots(true)
    const dateStr = prestationDate.toISOString().split('T')[0]
    const response = await fetch(
      `/api/prestation-unavailable-slots?productId=${product.id}&date=${dateStr}`
    )

    if (response.ok) {
      const data = await response.json()
      setUnavailableSlots(data.unavailableSlots || [])

      // Désélectionner le créneau si maintenant indisponible
      if (prestationTimeSlot && data.unavailableSlots?.includes(prestationTimeSlot)) {
        setPrestationTimeSlot(undefined)
      }
    }
    setLoadingSlots(false)
  }

  loadUnavailableSlots()
}, [isPrestationProduct, prestationDate, product])
```

**Flux de données** :
1. L'utilisateur sélectionne une date
2. Le useEffect se déclenche automatiquement
3. Appel API pour récupérer les créneaux indisponibles
4. Mise à jour de l'état `unavailableSlots`
5. Le TimeSlotPicker affiche les créneaux avec leur disponibilité

## 🔄 Workflow utilisateur

### Scénario 1 : Tous les créneaux disponibles

1. Utilisateur sélectionne une date (ex: 15/01/2025)
2. API retourne : `{ unavailableSlots: [] }`
3. Les 3 créneaux (LUNCH, AFTERNOON, EVENING) sont disponibles
4. Utilisateur choisit un créneau et ajoute au panier

### Scénario 2 : Certains créneaux réservés

1. Utilisateur sélectionne une date (ex: 16/01/2025)
2. API retourne : `{ unavailableSlots: ['AFTERNOON', 'EVENING'] }`
3. Affichage :
   - ✅ LUNCH (12h-15h30) - Disponible
   - ❌ AFTERNOON (16h-20h) - Indisponible
   - ❌ EVENING (20h30-23h30) - Indisponible
4. Utilisateur peut uniquement sélectionner LUNCH

### Scénario 3 : Tous les créneaux réservés

1. Utilisateur sélectionne une date (ex: 17/01/2025)
2. API retourne : `{ unavailableSlots: ['LUNCH', 'AFTERNOON', 'EVENING'] }`
3. Tous les créneaux sont affichés en rouge/indisponible
4. Utilisateur doit choisir une autre date

### Scénario 4 : Changement de date avec créneau sélectionné

1. Utilisateur a sélectionné AFTERNOON le 15/01/2025
2. Utilisateur change la date pour le 16/01/2025
3. API retourne : `{ unavailableSlots: ['AFTERNOON'] }`
4. Le créneau AFTERNOON (sélectionné) est maintenant indisponible
5. **Automatique** : Le créneau AFTERNOON est désélectionné
6. Utilisateur doit choisir LUNCH ou EVENING

## 🎨 Design visuel

### Créneau disponible
```
┌─────────────────────────────────────┐
│ ○ 12h à 15h30                       │  ← Bordure grise
└─────────────────────────────────────┘
```

### Créneau sélectionné
```
┌═════════════════════════════════════┐
│ ● 12h à 15h30                       │  ← Bordure noire, fond gris clair
└═════════════════════════════════════┘
```

### Créneau indisponible
```
┌─────────────────────────────────────┐
│ ○ 16h à 20h          Indisponible   │  ← Bordure rouge, fond rouge clair
└─────────────────────────────────────┘
```

## 🔐 Sécurité et validation

### Côté client
- Les créneaux indisponibles sont désactivés visuellement
- Impossible de cliquer sur un créneau indisponible
- Vérification en temps réel à chaque changement de date

### Côté serveur
- La fonction SQL utilise `SECURITY DEFINER` pour un accès sécurisé
- Permissions accordées à `anon` et `authenticated`
- L'API `/api/reservations/create` doit également vérifier la disponibilité avant d'insérer

### ⚠️ Important : Validation côté serveur

**TODO** : Ajouter une validation dans `/api/reservations/create` pour vérifier que le créneau est disponible avant de créer la réservation. Cela empêche les courses conditions (2 utilisateurs réservant le même créneau simultanément).

**Exemple de validation à ajouter** :
```typescript
// Dans /api/reservations/create/route.ts

// Avant d'insérer prestation_items, vérifier la disponibilité
const { data: unavailableSlots } = await supabase.rpc('get_prestation_unavailable_slots', {
  product_id_param: item.productId,
  date_param: item.prestationDate,
})

if (unavailableSlots?.some((slot: { time_slot: string }) =>
  slot.time_slot === item.prestationTimeSlot
)) {
  return NextResponse.json(
    { error: 'Ce créneau n\'est plus disponible' },
    { status: 409 } // Conflict
  )
}
```

## 📝 Migration et déploiement

### Étapes pour activer cette fonctionnalité

1. **Exécuter la migration SQL** :
   ```bash
   # Dans Supabase SQL Editor, exécuter :
   supabase/migrations/get_prestation_unavailable_slots.sql
   ```

2. **Vérifier les permissions** :
   ```sql
   -- Tester l'accès à la fonction
   SELECT * FROM get_prestation_unavailable_slots(1, '2025-01-15');
   ```

3. **Redémarrer le serveur Next.js** :
   ```bash
   npm run dev
   ```

4. **Tester le flux complet** :
   - Aller sur une page produit henné
   - Sélectionner une date
   - Vérifier que les créneaux se chargent
   - Créer une réservation test
   - Vérifier que le créneau devient indisponible

## 🧪 Tests à effectuer

### Test 1 : Affichage des créneaux disponibles
- [ ] Sélectionner une date future
- [ ] Vérifier que les 3 créneaux s'affichent
- [ ] Vérifier le message "Vérification des disponibilités..." pendant le chargement

### Test 2 : Créneaux indisponibles
- [ ] Créer une réservation pour AFTERNOON le 15/01/2025
- [ ] Sur la même page produit, sélectionner le 15/01/2025
- [ ] Vérifier que AFTERNOON est affiché en rouge avec "Indisponible"
- [ ] Vérifier qu'on ne peut pas cliquer sur AFTERNOON

### Test 3 : Changement de date avec créneau sélectionné
- [ ] Sélectionner AFTERNOON le 15/01/2025
- [ ] Créer une réservation pour AFTERNOON le 16/01/2025 (dans un autre onglet)
- [ ] Changer la date pour le 16/01/2025
- [ ] Vérifier que AFTERNOON est automatiquement désélectionné

### Test 4 : Exclusion des réservations annulées
- [ ] Créer une réservation pour EVENING le 17/01/2025
- [ ] Annuler cette réservation (status = 'CANCELLED')
- [ ] Sélectionner le 17/01/2025
- [ ] Vérifier que EVENING est disponible (pas indisponible)

### Test 5 : Multi-produits
- [ ] Créer une réservation pour le produit A, LUNCH le 18/01/2025
- [ ] Sur le produit B, sélectionner le 18/01/2025
- [ ] Vérifier que LUNCH est disponible (la réservation du produit A ne bloque pas le produit B)

## 🐛 Dépannage

### Problème : Les créneaux ne se chargent pas

**Symptômes** :
- Aucun créneau indisponible affiché même si réservations existent
- Erreur dans la console : "Failed to fetch unavailable slots"

**Solutions** :
1. Vérifier que la fonction SQL existe :
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_prestation_unavailable_slots';
   ```

2. Vérifier les permissions :
   ```sql
   SELECT has_function_privilege('anon', 'get_prestation_unavailable_slots(bigint, date)', 'EXECUTE');
   ```

3. Tester l'API manuellement :
   ```bash
   curl "http://localhost:3000/api/prestation-unavailable-slots?productId=1&date=2025-01-15"
   ```

### Problème : Tous les créneaux affichés comme indisponibles

**Causes possibles** :
- La fonction SQL retourne des valeurs incorrectes
- Le format de date est incorrect

**Solutions** :
1. Tester la fonction SQL directement :
   ```sql
   SELECT * FROM get_prestation_unavailable_slots(1, '2025-01-15');
   ```

2. Vérifier le format de date dans l'API :
   ```typescript
   console.log('Date param:', date) // Doit être 'YYYY-MM-DD'
   ```

### Problème : Double-réservation possible

**Cause** :
- Validation côté serveur manquante dans `/api/reservations/create`

**Solution** :
- Ajouter la validation mentionnée dans la section "Sécurité et validation"

## 📚 Ressources

- **Fonction SQL** : [supabase/migrations/get_prestation_unavailable_slots.sql](supabase/migrations/get_prestation_unavailable_slots.sql)
- **API Route** : [src/app/api/prestation-unavailable-slots/route.ts](src/app/api/prestation-unavailable-slots/route.ts)
- **Composant TimeSlotPicker** : [src/components/TimeSlotPicker.tsx](src/components/TimeSlotPicker.tsx)
- **Intégration** : [src/components/ProductDetailPage.tsx](src/components/ProductDetailPage.tsx) (lignes 55-56, 115-148, 699-709)
- **Référence créneaux** : [TIME-SLOTS-REFERENCE.md](TIME-SLOTS-REFERENCE.md)
- **Migration créneaux** : [MIGRATION-TIME-SLOTS.md](MIGRATION-TIME-SLOTS.md)
