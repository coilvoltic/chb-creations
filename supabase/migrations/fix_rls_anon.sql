-- =============================================================================
-- FIX RLS - Cibler explicitement le rôle ANON
-- =============================================================================

-- 1. Désactiver RLS temporairement
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Allow public to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to read reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to update reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to delete reservations" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_anon" ON reservations;
DROP POLICY IF EXISTS "reservations_select_auth" ON reservations;

DROP POLICY IF EXISTS "Allow public to insert reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to read reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to update reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to delete reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "reservation_items_insert_anon" ON reservation_items;
DROP POLICY IF EXISTS "reservation_items_select_auth" ON reservation_items;

-- 3. Réactiver RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques ciblant ANON explicitement
CREATE POLICY "anon_insert_reservations"
ON reservations
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_all_reservations"
ON reservations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_insert_reservation_items"
ON reservation_items
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_all_reservation_items"
ON reservation_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Vérification
SELECT
  tablename,
  policyname,
  roles::text,
  cmd,
  qual IS NOT NULL as "has_USING",
  with_check IS NOT NULL as "has_WITH_CHECK"
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
