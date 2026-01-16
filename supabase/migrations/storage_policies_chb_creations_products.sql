-- =========================================
-- Storage Policies for chb-creations-products bucket
-- =========================================
-- Configure access policies for product images storage
-- Bucket name: "chb-creations-products" (without spaces)
-- Structure: {subcategory}/{timestamp}-{random}.{ext}

-- =========================================
-- 0. Supprimer les anciennes policies si elles existent
-- =========================================
-- Nettoie les policies existantes pour éviter les conflits

DROP POLICY IF EXISTS "Public Access - Select/Download Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users - Upload Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users - Update Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users - Delete Images" ON storage.objects;

-- =========================================
-- 1. Public Access for Reading/Downloading Images
-- =========================================
-- Allow anyone (including anonymous users) to view product images
-- This is necessary for displaying images on the public website

CREATE POLICY "Public Access - Select/Download Images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chb-creations-products');

-- =========================================
-- 2. Authenticated Users Can Upload Images
-- =========================================
-- Only authenticated admin users can upload new product images
-- This restricts upload access to logged-in admin users only

CREATE POLICY "Authenticated Users - Upload Images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chb-creations-products');

-- =========================================
-- 3. Authenticated Users Can Update Images
-- =========================================
-- Only authenticated admin users can update existing images
-- Useful for replacing or modifying product images

CREATE POLICY "Authenticated Users - Update Images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chb-creations-products')
WITH CHECK (bucket_id = 'chb-creations-products');

-- =========================================
-- 4. Authenticated Users Can Delete Images
-- =========================================
-- Only authenticated admin users can delete product images
-- Important for managing storage and removing obsolete images

CREATE POLICY "Authenticated Users - Delete Images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chb-creations-products');

-- =========================================
-- 5. Vérification des policies créées
-- =========================================
-- Affiche toutes les policies pour le bucket chb-creations-products

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%Images%';

-- =========================================
-- Notes:
-- =========================================
-- - Le bucket "chb-creations-products" doit être créé manuellement dans Supabase Dashboard
-- - Le bucket DOIT être configuré comme PUBLIC (pas privé) pour permettre l'accès public aux URLs d'images
-- - Les images sont organisées dans des sous-dossiers par sous-catégorie (ex: art-de-table/, deco-et-accessoires/)
-- - Les URLs publiques sont permanentes et n'expirent jamais (générées avec getPublicUrl())
-- - Seuls les utilisateurs authentifiés (admins) peuvent uploader/modifier/supprimer des images
-- - Les utilisateurs anonymes peuvent uniquement voir/télécharger les images (pour l'affichage sur le site public)
--
-- IMPORTANT: Exécutez ce script APRÈS avoir créé le bucket dans le Dashboard
-- IMPORTANT: Ce script supprime et recrée les policies, il peut donc être exécuté plusieurs fois sans problème
