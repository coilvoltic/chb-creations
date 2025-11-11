-- =============================================================================
-- RLS avec les rôles ANON et PUBLIC
-- =============================================================================
-- Le problème pourrait être que le client s'authentifie comme 'public'
-- et non comme 'anon' dans certains contextes

-- 1. Supprimer les politiques existantes
DROP POLICY IF EXISTS "Enable insert for anon users" ON reservations;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable insert for anon users" ON reservation_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON reservation_items;

-- 2. Créer des politiques qui acceptent ANON et PUBLIC
CREATE POLICY "anon_public_insert_reservations"
ON reservations
AS PERMISSIVE
FOR INSERT
TO anon, public
WITH CHECK (true);

CREATE POLICY "authenticated_all_reservations"
ON reservations
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_public_insert_reservation_items"
ON reservation_items
AS PERMISSIVE
FOR INSERT
TO anon, public
WITH CHECK (true);

CREATE POLICY "authenticated_all_reservation_items"
ON reservation_items
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Vérification
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
