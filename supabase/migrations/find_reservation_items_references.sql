-- =========================================
-- Script approfondi: Trouver toutes les références à "reservation_items"
-- =========================================
-- IMPORTANT: Exécutez chaque requête SÉPARÉMENT dans Supabase

-- REQUÊTE 1: Chercher dans toutes les fonctions (y compris les triggers functions)
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%reservation_items%'
    AND n.nspname = 'public';

-- REQUÊTE 2: Chercher tous les triggers sur rental_reservations avec leurs fonctions
SELECT
    t.tgname AS trigger_name,
    t.tgenabled AS is_enabled,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'rental_reservations'
    AND n.nspname = 'public'
    AND NOT t.tgisinternal;

-- REQUÊTE 3: Chercher dans les vues qui pourraient référencer reservation_items
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition ILIKE '%reservation_items%'
    AND schemaname = 'public';

-- REQUÊTE 4: Lister toutes les tables qui contiennent "reservation" dans le nom
SELECT
    tablename
FROM pg_tables
WHERE tablename LIKE '%reservation%'
    AND schemaname = 'public'
ORDER BY tablename;
