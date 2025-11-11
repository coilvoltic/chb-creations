-- =============================================================================
-- Ajouter politique SELECT pour anon (nécessaire pour .select() après .insert())
-- =============================================================================

-- Permettre au rôle ANON de lire les réservations
-- (nécessaire pour récupérer la ligne après insertion avec .select())
CREATE POLICY "anon_select_reservations"
ON reservations
AS PERMISSIVE
FOR SELECT
TO anon, public
USING (true);

-- Permettre au rôle ANON de lire les reservation_items
CREATE POLICY "anon_select_reservation_items"
ON reservation_items
AS PERMISSIVE
FOR SELECT
TO anon, public
USING (true);

-- Vérification
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
