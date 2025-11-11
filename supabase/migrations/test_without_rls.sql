-- =============================================================================
-- TEST: Désactiver temporairement RLS pour confirmer le diagnostic
-- =============================================================================
-- ⚠️ ATTENTION: Ceci désactive la sécurité RLS temporairement pour tester
-- Ne laissez PAS ceci en production!

ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items')
ORDER BY tablename;
