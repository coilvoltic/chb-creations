# Migration du bucket Supabase Storage

## Problème résolu

Les images ne s'affichaient pas car le nom du bucket "CHB Creation Products" contenait des espaces, ce qui causait des problèmes d'encodage d'URL.

## Solution appliquée

Le code a été mis à jour pour utiliser un nouveau bucket nommé `chb-creations-products` (sans espaces).

### Fichiers modifiés

1. **`/src/app/admin/products/new/page.tsx`**
   - Ligne 148: Bucket name changé de `'CHB Creation Products'` → `'chb-creations-products'`
   - Ligne 160: Bucket name changé de `'CHB Creation Products'` → `'chb-creations-products'`

2. **`/CLAUDE.md`**
   - Documentation mise à jour pour refléter le nouveau nom de bucket

3. **`/supabase/migrations/storage_policies_chb_creations_products.sql`**
   - Nouveau fichier créé avec les policies pour le nouveau bucket

## Étapes manuelles à effectuer dans Supabase Dashboard

### 1. Créer le nouveau bucket

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu latéral, allez à **Storage**
4. Cliquez sur **New bucket**
5. Nom du bucket: `chb-creations-products` (exactement ce nom, sans espaces)
6. **IMPORTANT**: Cochez la case **Public bucket** ✓
7. Cliquez sur **Create bucket**

### 2. Appliquer les policies de sécurité

1. Dans le menu Storage, cliquez sur **Policies**
2. Cliquez sur **New policy** pour le bucket `chb-creations-products`
3. Copiez et exécutez les commandes SQL du fichier `/supabase/migrations/storage_policies_chb_creations_products.sql`

Ou directement via l'interface SQL:
1. Allez dans **SQL Editor**
2. Collez le contenu du fichier `storage_policies_chb_creations_products.sql`
3. Cliquez sur **Run**

### 3. Créer les sous-dossiers (optionnel)

Les sous-dossiers seront créés automatiquement lors du premier upload dans chaque sous-catégorie. Vous n'avez rien à faire.

Structure prévue:
```
chb-creations-products/
├── art-de-table/
├── trones/
├── deco-et-accessoires/
├── bendir/
├── bougies/
├── certificats-mariage/
├── coussins/
├── faire-parts/
├── oeufs/
├── tableaux/
├── textile/
├── henne-seul/
└── pack-henne/
```

### 4. Migrer les images existantes (si nécessaire)

Si vous avez déjà des produits avec des images dans l'ancien bucket "CHB Creation Products":

**Option A: Migration manuelle** (recommandé pour peu d'images)
1. Téléchargez les images depuis l'ancien bucket
2. Créez de nouveaux produits via l'interface admin avec ces images

**Option B: Migration via Supabase Dashboard**
1. Dans Storage, ouvrez l'ancien bucket "CHB Creation Products"
2. Pour chaque sous-dossier:
   - Téléchargez toutes les images
   - Allez dans le nouveau bucket `chb-creations-products`
   - Créez le sous-dossier correspondant (même nom)
   - Uploadez les images (même nom de fichier)
3. Mettez à jour les URLs dans la table `products` via SQL Editor:
   - Allez dans **SQL Editor** de Supabase
   - Copiez et exécutez le contenu du fichier `/supabase/migrations/migrate_image_urls.sql`
   - Ce script gère automatiquement les signed URLs et public URLs
   - Il extrait le chemin du fichier et génère la nouvelle URL publique

**Note importante sur les URLs:**
- Les anciennes URLs utilisent `/object/sign/` avec des tokens (signed URLs)
- Les nouvelles URLs utilisent `/object/public/` sans token (public URLs permanentes)
- Le script SQL extrait le chemin du fichier (ex: `art-de-table/verreAPied_1.png`) et reconstruit l'URL

### 5. Supprimer l'ancien bucket (optionnel)

Une fois la migration terminée et testée:
1. Vérifiez que tous les produits affichent bien leurs images
2. Dans Storage, supprimez l'ancien bucket "CHB Creation Products"

## Vérification

Pour vérifier que tout fonctionne:

1. Allez sur `/admin/products/new`
2. Créez un nouveau produit test avec une image
3. Vérifiez que l'image s'upload correctement
4. Allez sur la page du produit créé
5. Vérifiez que l'image s'affiche correctement

## Autres fichiers à exécuter

### Fix de la séquence des IDs produits

Si vous rencontrez l'erreur "duplicate key value violates unique constraint", exécutez:

```bash
# Dans SQL Editor de Supabase
# Exécutez le contenu de: /supabase/migrations/fix_products_sequence.sql
```

Cela réinitialise la séquence auto-increment des IDs produits.

## Support

Si vous rencontrez des problèmes:
1. Vérifiez que le bucket est bien **Public**
2. Vérifiez que les policies sont bien appliquées
3. Vérifiez que le nom du bucket est exactement `chb-creations-products` (avec tirets, sans espaces)
4. Testez l'URL d'une image directement dans le navigateur
