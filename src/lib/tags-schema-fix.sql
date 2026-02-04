-- ============================================================================
-- Migration pour corriger les contraintes UNIQUE sur reservation_tags
-- ============================================================================
-- Problème : NULLS NOT DISTINCT empêche d'associer le même tag à plusieurs réservations différentes
-- Solution : Recréer les contraintes sans NULLS NOT DISTINCT
-- ============================================================================

-- ÉTAPE 1 : Identifier les noms de contraintes existants
-- (Utile pour debug - vous pouvez décommenter si besoin)
-- SELECT constraint_name
-- FROM information_schema.table_constraints
-- WHERE table_name = 'reservation_tags'
--   AND constraint_type = 'UNIQUE';

-- ÉTAPE 2 : Supprimer les anciennes contraintes UNIQUE
-- Note: On utilise IF EXISTS pour éviter les erreurs si déjà supprimées
DO $$
BEGIN
  -- Contrainte pour rental_reservations
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_rental_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      DROP CONSTRAINT reservation_tags_tag_id_rental_reservation_id_key;
    RAISE NOTICE 'Contrainte rental supprimée';
  ELSE
    RAISE NOTICE 'Contrainte rental déjà absente';
  END IF;

  -- Contrainte pour purchase_reservations
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_purchase_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      DROP CONSTRAINT reservation_tags_tag_id_purchase_reservation_id_key;
    RAISE NOTICE 'Contrainte purchase supprimée';
  ELSE
    RAISE NOTICE 'Contrainte purchase déjà absente';
  END IF;

  -- Contrainte pour prestation_reservations
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_prestation_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      DROP CONSTRAINT reservation_tags_tag_id_prestation_reservation_id_key;
    RAISE NOTICE 'Contrainte prestation supprimée';
  ELSE
    RAISE NOTICE 'Contrainte prestation déjà absente';
  END IF;
END $$;

-- ÉTAPE 3 : Recréer les contraintes SANS "NULLS NOT DISTINCT"
-- Cela permet aux NULL d'être traités comme distincts
DO $$
BEGIN
  -- Contrainte pour rental_reservations
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_rental_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      ADD CONSTRAINT reservation_tags_tag_id_rental_reservation_id_key
      UNIQUE (tag_id, rental_reservation_id);
    RAISE NOTICE 'Contrainte rental recréée (sans NULLS NOT DISTINCT)';
  ELSE
    RAISE NOTICE 'Contrainte rental existe déjà';
  END IF;

  -- Contrainte pour purchase_reservations
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_purchase_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      ADD CONSTRAINT reservation_tags_tag_id_purchase_reservation_id_key
      UNIQUE (tag_id, purchase_reservation_id);
    RAISE NOTICE 'Contrainte purchase recréée (sans NULLS NOT DISTINCT)';
  ELSE
    RAISE NOTICE 'Contrainte purchase existe déjà';
  END IF;

  -- Contrainte pour prestation_reservations
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_tags_tag_id_prestation_reservation_id_key'
  ) THEN
    ALTER TABLE reservation_tags
      ADD CONSTRAINT reservation_tags_tag_id_prestation_reservation_id_key
      UNIQUE (tag_id, prestation_reservation_id);
    RAISE NOTICE 'Contrainte prestation recréée (sans NULLS NOT DISTINCT)';
  ELSE
    RAISE NOTICE 'Contrainte prestation existe déjà';
  END IF;
END $$;

-- ÉTAPE 4 : Vérification
-- Afficher les contraintes actuelles
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'reservation_tags'::regclass
  AND contype = 'u'
ORDER BY conname;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- ✅ Un tag peut être associé à PLUSIEURS réservations différentes
--    Exemple: Tag "Urgent" sur location #5, #7, #12
--
-- ✅ Un tag ne peut PAS être ajouté DEUX FOIS à la MÊME réservation
--    Exemple: Tag "Urgent" ne peut pas être sur location #5 deux fois
-- ============================================================================
