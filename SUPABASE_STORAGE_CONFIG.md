# Configuration Supabase Storage - CHB Créations

Ce document explique comment configurer correctement le bucket Supabase Storage pour les images des produits.

## 📦 Configuration du Bucket

### Nom du bucket
```
chb-creations-products
```

### Statut de visibilité
**Public** ✅

Le bucket DOIT être configuré comme **public** pour permettre l'affichage des images produits sur le site sans authentification.

## 🔐 Politiques RLS (Row Level Security)

### Politique de lecture (SELECT)
```sql
-- Nom: Public read access
-- Opération: SELECT
-- Target roles: public, anon

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'chb-creations-products');
```

**Effet :** Tout le monde peut voir les images (nécessaire pour afficher les produits).

### Politique d'écriture (INSERT)
```sql
-- Nom: Authenticated users can upload
-- Opération: INSERT
-- Target roles: authenticated

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chb-creations-products');
```

**Effet :** Seuls les administrateurs authentifiés peuvent uploader des images.

### Politique de mise à jour (UPDATE)
```sql
-- Nom: Authenticated users can update
-- Opération: UPDATE
-- Target roles: authenticated

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chb-creations-products');
```

**Effet :** Seuls les administrateurs authentifiés peuvent modifier des images existantes.

### Politique de suppression (DELETE)
```sql
-- Nom: Authenticated users can delete
-- Opération: DELETE
-- Target roles: authenticated

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chb-creations-products');
```

**Effet :** Seuls les administrateurs authentifiés peuvent supprimer des images.

## 📁 Structure des dossiers

Les images sont organisées par sous-catégorie pour faciliter la gestion :

```
chb-creations-products/
├── art-de-table/
│   ├── 1234567890-abc123.jpg
│   ├── 1234567891-def456.jpg
│   └── ...
├── trones/
│   └── ...
├── deco-et-accessoires/
│   └── ...
├── bendir/
│   └── ...
├── bougies/
│   └── ...
├── certificats-mariage/
│   └── ...
├── coussins/
│   └── ...
├── faire-parts/
│   └── ...
├── oeufs/
│   └── ...
├── tableaux/
│   └── ...
├── textile/
│   └── ...
├── henne-seul/
│   └── ...
└── pack-henne/
    └── ...
```

### Convention de nommage
Format : `{timestamp}-{random}.{extension}`

Exemple : `1709123456789-a1b2c3d4.jpg`

- **timestamp** : Timestamp Unix en millisecondes (évite les collisions)
- **random** : Chaîne aléatoire (sécurité supplémentaire)
- **extension** : jpg, jpeg, png, webp

## 🔧 Configuration dans le Dashboard Supabase

### Étape 1 : Créer le bucket (si pas déjà créé)
1. Allez dans **Storage** → **Buckets**
2. Cliquez sur **New bucket**
3. Nom : `chb-creations-products`
4. **Cochez** "Public bucket"
5. Cliquez sur **Create bucket**

### Étape 2 : Configurer les politiques RLS
1. Sélectionnez le bucket `chb-creations-products`
2. Cliquez sur **Policies**
3. Si les politiques n'existent pas, créez-les avec les SQL ci-dessus
4. Vérifiez que :
   - ✅ Public read (anon) est activé
   - ✅ Authenticated write/update/delete sont activés

### Étape 3 : Vérifier la configuration
1. Cliquez sur **Configuration**
2. Vérifiez que **Public** est bien coché
3. Notez l'URL publique : `https://[votre-projet].supabase.co/storage/v1/object/public/chb-creations-products/`

## 📤 Upload d'images (via l'interface admin)

Le code d'upload est dans [src/app/admin/products/new/page.tsx](../src/app/admin/products/new/page.tsx).

### Processus d'upload
1. L'administrateur sélectionne des fichiers depuis son ordinateur
2. Le code génère un nom unique pour chaque fichier
3. Les fichiers sont uploadés dans le sous-dossier correspondant à la sous-catégorie
4. L'URL publique est générée via `getPublicUrl()`
5. Les URLs sont stockées dans la colonne `images` (array) de la table `products`

### Code d'upload (extrait)
```typescript
const filePath = `${subcategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('chb-creations-products')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

const { data: { publicUrl } } = supabase.storage
  .from('chb-creations-products')
  .getPublicUrl(filePath)
```

## 🌐 URLs publiques

Format des URLs :
```
https://[votre-projet].supabase.co/storage/v1/object/public/chb-creations-products/[subcategory]/[filename]
```

Exemple :
```
https://xyz123.supabase.co/storage/v1/object/public/chb-creations-products/art-de-table/1709123456789-a1b2c3d4.jpg
```

Ces URLs sont **permanentes** et **publiques** (pas d'expiration, pas d'authentification requise).

## ✅ Checklist de vérification

Avant de déployer en production, vérifiez que :

- [ ] Le bucket `chb-creations-products` existe
- [ ] Le bucket est configuré comme **Public**
- [ ] La politique de lecture publique (SELECT) est activée
- [ ] Les politiques d'écriture (INSERT/UPDATE/DELETE) sont réservées aux utilisateurs authentifiés
- [ ] Les images existantes sont accessibles via leurs URLs publiques
- [ ] L'interface admin permet bien l'upload de nouvelles images
- [ ] Les URLs des images sont correctement stockées dans la base de données

## 🔍 Dépannage

### Problème : Les images ne s'affichent pas sur le site
**Solution :**
1. Vérifiez que le bucket est **Public**
2. Vérifiez que la politique de lecture publique existe
3. Testez l'URL de l'image directement dans le navigateur
4. Vérifiez les URLs dans la table `products` (colonne `images`)

### Problème : Impossible d'uploader des images depuis l'admin
**Solution :**
1. Vérifiez que vous êtes authentifié (session Supabase valide)
2. Vérifiez que la politique INSERT pour les utilisateurs authentifiés existe
3. Vérifiez les logs dans le dashboard Supabase Storage

### Problème : Erreur 404 sur les images
**Solution :**
1. Vérifiez que le chemin du fichier est correct (subcategory/filename)
2. Vérifiez que le fichier existe bien dans le bucket
3. Vérifiez que l'URL utilise bien le format `object/public/` et non `object/authenticated/`

### Problème : Erreur CORS
**Solution :**
1. Dans Supabase → Settings → API → CORS
2. Ajoutez votre domaine de production : `https://votre-domaine.com`
3. En développement, `http://localhost:3000` devrait être autorisé par défaut

## 📊 Limites et quotas

### Plan gratuit Supabase
- **Stockage :** 1 GB
- **Bande passante :** 2 GB / mois
- **Taille max fichier :** 50 MB

### Recommandations
- Optimisez les images avant upload (compression JPEG/WebP)
- Taille recommandée : max 1920px de large
- Format recommandé : WebP (meilleur ratio qualité/poids)

## 🚀 En production

### Configuration supplémentaire
1. Vérifiez que le domaine de production est autorisé dans CORS
2. Considérez l'ajout d'un CDN (Cloudflare) devant les URLs Supabase pour améliorer les performances
3. Configurez une politique de cache appropriée (déjà défini à 3600s dans le code)

### Monitoring
- Surveillez l'utilisation du stockage dans le dashboard Supabase
- Surveillez la bande passante mensuelle
- Configurez des alertes si vous approchez des limites

---

**Dernière mise à jour :** 2024-02-09
