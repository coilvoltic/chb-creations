-- =============================================================================
-- Politique SELECT minimale pour anon (seulement pour récupérer l'ID après insert)
-- =============================================================================

-- D'abord, supprimer les anciennes politiques SELECT si elles existent
DROP POLICY IF EXISTS "anon_select_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_select_reservation_items" ON reservation_items;

-- Créer une politique SELECT très restrictive pour anon
-- Cette politique permet seulement de lire les données juste après insertion
-- En pratique, avec .select('id'), seul l'ID sera retourné
CREATE POLICY "anon_select_own_reservation"
ON reservations
AS PERMISSIVE
FOR SELECT
TO anon, public
USING (
  -- Permet de lire uniquement les réservations créées dans les 5 dernières secondes
  created_at >= NOW() - INTERVAL '5 seconds'
);

-- Pas besoin de politique SELECT pour reservation_items car on ne fait pas .select() dessus

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
