# Système de gestion des tags pour les réservations

## Vue d'ensemble

Le système de tags permet d'organiser et de filtrer les sous-réservations (locations, achats, prestations) dans l'interface admin. Chaque tag possède un nom et une couleur, et peut être associé à plusieurs réservations.

## Architecture de la base de données

### Table `tags`
Stocke les tags disponibles :
- `id` (int, primary key)
- `name` (text, unique) - Nom du tag
- `color` (text) - Couleur au format hexadécimal (#RRGGBB)
- `created_at` (timestamp)

### Table `reservation_tags` (table de liaison many-to-many)
Associe les tags aux réservations :
- `id` (int, primary key)
- `tag_id` (int, FK → tags.id)
- `rental_reservation_id` (int, nullable, FK → rental_reservations.id)
- `purchase_reservation_id` (int, nullable, FK → purchase_reservations.id)
- `prestation_reservation_id` (int, nullable, FK → prestation_reservations.id)
- `created_at` (timestamp)

**Contraintes** :
- Exactement UN des trois FK doit être non-null
- Pas de doublon : un tag ne peut être associé qu'une seule fois à une réservation donnée
- `ON DELETE CASCADE` : si un tag est supprimé, toutes ses associations sont supprimées
- **Important** : Les contraintes UNIQUE utilisent le comportement par défaut (sans `NULLS NOT DISTINCT`), ce qui permet d'associer le même tag à plusieurs réservations différentes tout en empêchant les doublons sur une même réservation

### Exécution du SQL

Pour créer les tables, exécutez le fichier SQL dans Supabase :
```bash
# Copiez le contenu de src/lib/tags-schema.sql
# Puis exécutez-le dans l'éditeur SQL de Supabase
```

## Fonctionnalités

### 1. Gestion des tags (Dashboard Admin)

**Accès** : Dashboard Admin > Onglet "Tags"

**Actions disponibles** :
- ✅ Créer un nouveau tag avec nom et couleur (palette de 20 couleurs prédéfinies)
- ✅ Modifier un tag existant (nom et/ou couleur)
- ✅ Supprimer un tag (retire également toutes les associations)
- ✅ Visualiser tous les tags existants en grille

**Sélection de couleur** :
- Palette de **6 couleurs essentielles** (Rouge, Vert, Bleu, Violet, Rose, Ambre)
- Menu déroulant compact avec grille 3×2
- Cercles de couleur (40×40px) pour un affichage optimal
- Aperçu de la couleur sélectionnée avec son nom
- Pas de scroll nécessaire - toutes les couleurs visibles
- Hover avec scale 110% et ring subtil

**Composants** :
- `TagManagement.tsx` - Interface de gestion
- `src/lib/tag-colors.ts` - Palette de couleurs

### 2. Attribution des tags aux réservations

**Deux méthodes disponibles** :

#### 2A. Depuis la vue Calendrier (⚡ Méthode rapide)

**Accès** : Dashboard Admin > Vue Calendrier

**Utilisation** :
1. Survolez une carte d'événement dans le calendrier
2. Cliquez sur le bouton **"+"** qui apparaît en haut à droite
3. Un modal s'ouvre avec tous les tags disponibles en grille 2 colonnes
4. Cliquez sur un tag pour l'ajouter/retirer (toggle)
5. Les tags sélectionnés s'affichent avec une ✓ et une bordure colorée
6. Fermez le modal - les tags sont automatiquement sauvegardés

**Composant** : `QuickTagModal.tsx`

**Avantages** :
- ⚡ Accès rapide sans quitter la vue calendrier
- 👁️ Vision immédiate des changements sur la carte
- 🎯 Idéal pour une gestion quotidienne
- 🔄 Interface toggle intuitive

#### 2B. Depuis la page de détail (📋 Méthode détaillée)

**Accès** : Page de détail d'une réservation (`/admin/reservations/[id]`)

**Localisation** : Sections "Locations", "Achats", et "Prestations" dans les détails financiers

**Actions** :
- ➕ Ajouter un tag à une sous-réservation (dropdown avec tags disponibles)
- ➖ Retirer un tag en cliquant dessus
- 👁️ Visualiser les tags actuellement associés

**Composant** : `ReservationTagSelector.tsx`

**Avantages** :
- 📋 Contexte complet de la réservation
- 🔍 Idéal pour la revue détaillée

### 3. Affichage et filtrage dans le calendrier

**Accès** : Dashboard Admin > Vue Calendrier

**Filtrage** :
- 🔍 Barre de filtres en haut du calendrier
- Cliquez sur un tag pour filtrer les événements
- Sélection multiple possible
- "Réinitialiser" pour effacer les filtres

**Affichage** :
- Les tags apparaissent comme des badges colorés sur chaque événement du calendrier
- Même style que les badges "Payé" / "En attente" mais avec les couleurs personnalisées

**Composant** : `ReservationCalendar.tsx` (mis à jour)

## API Routes

### Tags CRUD

**GET** `/api/admin/tags`
- Récupère tous les tags
- Réponse : `{ tags: Tag[] }`

**POST** `/api/admin/tags`
- Crée un nouveau tag
- Body : `{ name: string, color: string }`
- Réponse : `{ tag: Tag }`

**PATCH** `/api/admin/tags/[id]`
- Modifie un tag existant
- Body : `{ name?: string, color?: string }`
- Réponse : `{ tag: Tag }`

**DELETE** `/api/admin/tags/[id]`
- Supprime un tag et ses associations
- Réponse : `{ success: true }`

### Associations tags-réservations

**POST** `/api/admin/reservation-tags`
- Associe un tag à une réservation
- Body :
  ```json
  {
    "tag_id": number,
    "rental_reservation_id"?: number,
    "purchase_reservation_id"?: number,
    "prestation_reservation_id"?: number
  }
  ```
- Réponse : `{ reservationTag: ReservationTag }`

**DELETE** `/api/admin/reservation-tags/by-params`
- Supprime une association tag-réservation
- Query params : `tag_id`, `reservation_type`, `reservation_id`
- Réponse : `{ success: true }`

## Types TypeScript

Les types sont définis dans `src/types/database.ts` et exportés via `src/types/index.ts` :

```typescript
interface Tag {
  id: number
  name: string
  color: string // Format hexadécimal #RRGGBB
  created_at: string
}

interface ReservationTag {
  id: number
  tag_id: number
  rental_reservation_id?: number
  purchase_reservation_id?: number
  prestation_reservation_id?: number
  created_at: string
  tag?: Tag // Relation virtuelle
}

// Les interfaces de réservations incluent maintenant :
interface RentalReservation {
  // ... autres champs
  tags?: Tag[]
}
```

## Exemples d'utilisation

### Créer des tags par défaut

Quelques tags sont créés automatiquement lors de l'exécution du SQL :
- 🔴 Urgent (#EF4444)
- 🟢 Payé (#10B981)
- 🟡 En attente (#F59E0B)
- 🟣 VIP (#8B5CF6)
- 🔵 Confirmé (#3B82F6)
- ⚫ Annulé (#6B7280)

### Workflow recommandé

1. **Créer vos tags** : Allez dans Dashboard > Tags et créez les tags dont vous avez besoin
2. **Associer aux réservations** : Depuis la page de détail de chaque réservation, ajoutez les tags pertinents
3. **Filtrer dans le calendrier** : Utilisez les filtres pour afficher uniquement les réservations avec certains tags

### Cas d'usage

- **Priorité** : Tags "Urgent", "Normal", "Faible priorité"
- **Statut de préparation** : "Préparé", "En cours", "En attente"
- **Client** : "VIP", "Client régulier", "Nouveau client"
- **Équipe** : "Équipe A", "Équipe B", "Externe"
- **Spécificité** : "Installation complexe", "Fragile", "Grande quantité"

## Sécurité (RLS)

Les politiques Row Level Security sont configurées :
- **Lecture** : Accessible à tous (anon et authenticated)
- **Écriture** : Uniquement les utilisateurs authentifiés (admins)
- Les API routes utilisent le `service_role_key` pour bypasser RLS de manière sécurisée

## Performance

- **Index** créés sur les FK de `reservation_tags` pour optimiser les jointures
- **Contraintes** pour garantir l'intégrité des données
- **Cascade delete** pour éviter les orphelins

## Migration depuis l'ancien système

Si vous aviez des tags codés en dur dans le code, vous pouvez :
1. Créer les tags correspondants via l'interface
2. Migrer les anciennes associations manuellement ou via un script SQL
3. Supprimer l'ancien code

## Support et questions

Pour toute question sur l'utilisation du système de tags, référez-vous à ce document ou contactez l'équipe de développement.
