-- =============================================================================
-- DIAGNOSTIC ET FIX RLS POUR RESERVATIONS
-- =============================================================================

-- 1. Désactiver temporairement RLS pour nettoyer
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reservations') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reservations', r.policyname);
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reservation_items') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reservation_items', r.policyname);
    END LOOP;
END $$;

-- 3. Réactiver RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques avec des noms uniques
CREATE POLICY "reservations_insert_anon"
ON reservations
FOR INSERT
TO anon, public
WITH CHECK (true);

CREATE POLICY "reservations_select_auth"
ON reservations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "reservation_items_insert_anon"
ON reservation_items
FOR INSERT
TO anon, public
WITH CHECK (true);

CREATE POLICY "reservation_items_select_auth"
ON reservation_items
FOR SELECT
TO authenticated
USING (true);

-- 5. Vérification finale
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
