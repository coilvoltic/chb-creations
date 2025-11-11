-- Vérifier le statut RLS sur toutes les tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Vérifier les politiques sur reservation_items et reservations
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, cmd;
