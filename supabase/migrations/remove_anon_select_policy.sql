-- =============================================================================
-- Retirer l'accès SELECT pour anon (sécurité)
-- =============================================================================
-- Maintenant que le code utilise .select('id') au lieu de .select(),
-- on peut retirer les politiques SELECT pour anon et protéger les données

-- Supprimer les politiques SELECT pour anon
DROP POLICY IF EXISTS "anon_select_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_select_reservation_items" ON reservation_items;

-- Vérification finale : seuls INSERT pour anon, ALL pour authenticated
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
