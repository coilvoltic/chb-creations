-- =============================================================================
-- SOLUTION FINALE RLS - Configuration qui fonctionne avec Supabase
-- =============================================================================

-- 1. Réactiver RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "reservations_insert_anon" ON reservations;
DROP POLICY IF EXISTS "reservations_select_auth" ON reservations;
DROP POLICY IF EXISTS "reservation_items_insert_anon" ON reservation_items;
DROP POLICY IF EXISTS "reservation_items_select_auth" ON reservation_items;
DROP POLICY IF EXISTS "Allow public to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to read reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to update reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to delete reservations" ON reservations;
DROP POLICY IF EXISTS "Allow public to insert reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to read reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to update reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to delete reservation_items" ON reservation_items;

-- 3. Créer des politiques PERMISSIVES explicites pour le rôle ANON
-- IMPORTANT: Utiliser AS PERMISSIVE et cibler directement 'anon'

-- Permettre au rôle ANON d'insérer des réservations
CREATE POLICY "Enable insert for anon users"
ON reservations
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre au rôle AUTHENTICATED de tout faire sur les réservations
CREATE POLICY "Enable all for authenticated users"
ON reservations
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permettre au rôle ANON d'insérer des reservation_items
CREATE POLICY "Enable insert for anon users"
ON reservation_items
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Permettre au rôle AUTHENTICATED de tout faire sur reservation_items
CREATE POLICY "Enable all for authenticated users"
ON reservation_items
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Vérification finale
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  with_check IS NOT NULL as "has_WITH_CHECK"
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
