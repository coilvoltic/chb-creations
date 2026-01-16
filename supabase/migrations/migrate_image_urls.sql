-- =========================================
-- Migration des URLs d'images vers le nouveau bucket
-- =========================================
-- Ce script met à jour toutes les URLs d'images dans la table products
-- pour pointer vers le nouveau bucket 'chb-creations-products'
--
-- IMPORTANT: Exécutez ce script APRÈS avoir copié toutes les images
-- de l'ancien bucket vers le nouveau bucket avec la même structure de dossiers

-- =========================================
-- Étape 1: Vérifier les URLs actuelles (pour debug)
-- =========================================
-- Décommentez pour voir les URLs actuelles avant la migration
-- SELECT id, name, images FROM products WHERE images IS NOT NULL;

-- =========================================
-- Étape 2: Mettre à jour les URLs
-- =========================================
-- Remplace les anciennes URLs (signed ou public) par les nouvelles URLs publiques

UPDATE products
SET images = (
  SELECT array_agg(
    CASE
      -- Si l'URL contient '/object/sign/' (signed URL)
      WHEN url LIKE '%/object/sign/CHB%20Creation%20Products/%'
      THEN
        'https://sqxlcbmntzpealuxxsya.supabase.co/storage/v1/object/public/chb-creations-products/' ||
        regexp_replace(
          url,
          '.*CHB%20Creation%20Products/(.*?)(\?token=.*)?$',
          '\1'
        )

      -- Si l'URL contient '/object/public/' (public URL)
      WHEN url LIKE '%/object/public/CHB%20Creation%20Products/%'
      THEN
        replace(
          url,
          '/object/public/CHB%20Creation%20Products/',
          '/object/public/chb-creations-products/'
        )

      -- Si l'URL contient les espaces encodés différemment
      WHEN url LIKE '%CHB Creation Products%'
      THEN
        replace(
          replace(url, 'CHB Creation Products', 'chb-creations-products'),
          '/object/sign/',
          '/object/public/'
        )

      -- Sinon, garde l'URL telle quelle
      ELSE url
    END
  )
  FROM unnest(images) AS url
)
WHERE images IS NOT NULL
  AND (
    images::text LIKE '%CHB%20Creation%20Products%' OR
    images::text LIKE '%CHB Creation Products%'
  );

-- =========================================
-- Étape 3: Vérifier les URLs après migration (pour debug)
-- =========================================
-- Décommentez pour voir les URLs après la migration
-- SELECT id, name, images FROM products WHERE images IS NOT NULL;

-- =========================================
-- Étape 4: Compter les produits mis à jour
-- =========================================
-- Cette requête affiche le nombre de produits dont les URLs ont été mises à jour
SELECT COUNT(*) as products_migrated
FROM products
WHERE images IS NOT NULL
  AND images::text LIKE '%chb-creations-products%';

-- =========================================
-- Notes:
-- =========================================
-- - Ce script gère les signed URLs (/object/sign/) et les public URLs (/object/public/)
-- - Il extrait le chemin du fichier (ex: art-de-table/verreAPied_1.png) et supprime le token
-- - Les nouvelles URLs utilisent /object/public/ (pas de token, pas d'expiration)
-- - IMPORTANT: Remplacez 'sqxlcbmntzpealuxxsya' par votre vrai project ID Supabase si différent
-- - Testez d'abord sur un produit avec:
--   UPDATE products SET images = [...] WHERE id = 1;
