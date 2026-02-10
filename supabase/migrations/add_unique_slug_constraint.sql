-- Migration pour ajouter une contrainte d'unicité sur la colonne slug de la table products
-- Cela empêchera la création de produits avec des slugs en double

-- Ajouter une contrainte UNIQUE sur la colonne slug
ALTER TABLE products
ADD CONSTRAINT products_slug_unique UNIQUE (slug);

-- Créer un index pour améliorer les performances des recherches par slug
-- (L'index unique est créé automatiquement avec la contrainte UNIQUE, mais on le documente ici)
-- CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug);

-- Commentaire pour documentation
COMMENT ON CONSTRAINT products_slug_unique ON products IS
'Garantit que chaque produit a un slug unique pour éviter les doublons dans les URLs';
