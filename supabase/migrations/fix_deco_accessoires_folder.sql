-- =========================================
-- Correction du nom du dossier deco-accessoires → deco-et-accessoires
-- =========================================
-- Ce script met à jour toutes les URLs d'images dans la table products
-- pour corriger le nom du dossier de "deco-accessoires" vers "deco-et-accessoires"
--
-- IMPORTANT: Exécutez ce script APRÈS avoir déplacé les images dans Supabase Storage
-- depuis le dossier "deco-accessoires" vers "deco-et-accessoires"

-- =========================================
-- Étape 1: Vérifier les produits concernés (pour debug)
-- =========================================
-- Affiche tous les produits avec des images dans le mauvais dossier
-- Décommentez pour voir les produits avant la correction

-- SELECT
--   id,
--   name,
--   subcategory,
--   images
-- FROM products
-- WHERE images::text LIKE '%/deco-accessoires/%';

-- =========================================
-- Étape 2: Mettre à jour les URLs
-- =========================================
-- Remplace "deco-accessoires" par "deco-et-accessoires" dans toutes les URLs

UPDATE products
SET images = (
  SELECT array_agg(
    replace(
      url,
      '/deco-accessoires/',
      '/deco-et-accessoires/'
    )
  )
  FROM unnest(images) AS url
)
WHERE images IS NOT NULL
  AND images::text LIKE '%/deco-accessoires/%';

-- =========================================
-- Étape 3: Vérifier les résultats (pour debug)
-- =========================================
-- Affiche les produits mis à jour pour vérification
-- Décommentez pour voir les produits après la correction

-- SELECT
--   id,
--   name,
--   subcategory,
--   images
-- FROM products
-- WHERE subcategory = 'deco-et-accessoires';

-- =========================================
-- Étape 4: Compter les produits mis à jour
-- =========================================
-- Cette requête affiche le nombre de produits dont les URLs ont été corrigées

SELECT
  COUNT(*) as products_updated,
  'URLs corrigées de deco-accessoires vers deco-et-accessoires' as description
FROM products
WHERE images::text LIKE '%/deco-et-accessoires/%'
  AND subcategory = 'deco-et-accessoires';

-- =========================================
-- Vérifier qu'il ne reste plus de mauvaises URLs
-- =========================================
-- Cette requête doit retourner 0 si tout est corrigé

SELECT
  COUNT(*) as remaining_bad_urls,
  'URLs restantes avec deco-accessoires (devrait être 0)' as description
FROM products
WHERE images::text LIKE '%/deco-accessoires/%';

-- =========================================
-- Notes:
-- =========================================
-- 1. AVANT d'exécuter ce script, déplacez manuellement les images dans Supabase Storage:
--    - Allez dans Storage → chb-creations-products
--    - Téléchargez toutes les images du dossier "deco-accessoires"
--    - Créez le dossier "deco-et-accessoires" s'il n'existe pas
--    - Uploadez les images dans "deco-et-accessoires" (mêmes noms de fichiers)
--    - Supprimez le dossier "deco-accessoires"
--
-- 2. Ce script met à jour UNIQUEMENT les URLs dans la table products
--    Il ne déplace PAS les fichiers physiques dans le storage
--
-- 3. La correction s'applique à tous les produits ayant des images dans deco-accessoires
--    Pas seulement ceux de la sous-catégorie "deco-et-accessoires"
--
-- 4. Le script est idempotent : vous pouvez l'exécuter plusieurs fois sans problème
