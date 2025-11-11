-- =============================================================================
-- DEBUG RLS STATUS - Run this to check current state
-- =============================================================================

-- 1. Check if RLS is enabled on tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products')
ORDER BY tablename;

-- 2. List all current policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS "Command Type",
    qual AS "USING clause",
    with_check AS "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products')
ORDER BY tablename, cmd, policyname;

-- 3. Check table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products');

-- 4. Check grants on tables
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('reservations', 'reservation_items', 'products')
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY table_name, grantee, privilege_type;

-- 5. Check role memberships
SELECT
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'public', 'postgres')
ORDER BY r.rolname;

-- 6. Test if policies are actually enforced
-- This will tell us if RLS is blocking or allowing
DO $$
BEGIN
    RAISE NOTICE '=== RLS Configuration Check ===';
    RAISE NOTICE 'If you see policies above but still get RLS errors:';
    RAISE NOTICE '1. Check if the Supabase client is using the correct anon key';
    RAISE NOTICE '2. Verify the JWT token is valid';
    RAISE NOTICE '3. Check if there are restrictive policies in other schemas';
    RAISE NOTICE '4. Try temporarily disabling RLS to confirm it is the issue';
END $$;
