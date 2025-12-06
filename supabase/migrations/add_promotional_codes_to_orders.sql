-- Migration: Ajouter les codes promotionnels aux commandes
-- Date: 2025-12-06
-- Description: Ajoute les colonnes promotional code dans customer_orders avec FK + snapshots

-- Étape 1: Ajouter les colonnes promotional code dans customer_orders
ALTER TABLE customer_orders
ADD COLUMN promotional_code_id INT8 REFERENCES promotional_codes(id) ON DELETE SET NULL,
ADD COLUMN promotional_code_name TEXT,
ADD COLUMN promotional_code_discount INT2;

-- Étape 2: Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_customer_orders_promotional_code
ON customer_orders(promotional_code_id);

-- Étape 3: Ajouter une contrainte de cohérence
-- Si promotional_code_id existe, alors name et discount doivent exister aussi
ALTER TABLE customer_orders
ADD CONSTRAINT check_promo_code_consistency
CHECK (
  (promotional_code_id IS NULL AND promotional_code_name IS NULL AND promotional_code_discount IS NULL) OR
  (promotional_code_id IS NOT NULL AND promotional_code_name IS NOT NULL AND promotional_code_discount IS NOT NULL)
);

-- Étape 4: Ajouter un commentaire pour documentation
COMMENT ON COLUMN customer_orders.promotional_code_id IS 'FK vers promotional_codes pour traçabilité et analytics';
COMMENT ON COLUMN customer_orders.promotional_code_name IS 'Snapshot du nom du code promo au moment de la commande (historique immuable)';
COMMENT ON COLUMN customer_orders.promotional_code_discount IS 'Snapshot du pourcentage de réduction (0-100) au moment de la commande';

-- Note: La table promotional_codes doit déjà exister avec les colonnes:
-- - id (bigint, primary key)
-- - name (text, nom du code promo, ex: "NOEL2024")
-- - discount (int2, pourcentage de réduction de 0 à 100)
