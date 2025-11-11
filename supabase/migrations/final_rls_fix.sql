-- =============================================================================
-- FINAL RLS FIX - Comprehensive cleanup and proper configuration
-- =============================================================================
-- This script will completely reset and properly configure RLS policies
-- Execute this in Supabase SQL Editor

-- =============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- =============================================================================
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- =============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on reservations
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reservations'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reservations', r.policyname);
    END LOOP;

    -- Drop all policies on reservation_items
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reservation_items'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reservation_items', r.policyname);
    END LOOP;

    -- Drop all policies on products
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'products'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', r.policyname);
    END LOOP;
END $$;

-- =============================================================================
-- STEP 3: VERIFY TABLE OWNERSHIP AND GRANTS
-- =============================================================================
-- Ensure anon and authenticated roles have proper grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- STEP 4: RE-ENABLE RLS
-- =============================================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 5: CREATE PERMISSIVE POLICIES FOR RESERVATIONS
-- =============================================================================

-- Allow anyone (anon + authenticated) to INSERT reservations
CREATE POLICY "reservations_insert_policy"
ON reservations
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Allow only authenticated users to SELECT reservations
CREATE POLICY "reservations_select_policy"
ON reservations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Allow only authenticated users to UPDATE reservations
CREATE POLICY "reservations_update_policy"
ON reservations
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow only authenticated users to DELETE reservations
CREATE POLICY "reservations_delete_policy"
ON reservations
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- STEP 6: CREATE PERMISSIVE POLICIES FOR RESERVATION_ITEMS
-- =============================================================================

-- Allow anyone (anon + authenticated) to INSERT reservation_items
CREATE POLICY "reservation_items_insert_policy"
ON reservation_items
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- Allow only authenticated users to SELECT reservation_items
CREATE POLICY "reservation_items_select_policy"
ON reservation_items
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Allow only authenticated users to UPDATE reservation_items
CREATE POLICY "reservation_items_update_policy"
ON reservation_items
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow only authenticated users to DELETE reservation_items
CREATE POLICY "reservation_items_delete_policy"
ON reservation_items
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- STEP 7: CREATE PERMISSIVE POLICIES FOR PRODUCTS
-- =============================================================================

-- Allow everyone to SELECT products
CREATE POLICY "products_select_policy"
ON products
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Allow only authenticated users to INSERT products
CREATE POLICY "products_insert_policy"
ON products
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow only authenticated users to UPDATE products
CREATE POLICY "products_update_policy"
ON products
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow only authenticated users to DELETE products
CREATE POLICY "products_delete_policy"
ON products
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- STEP 8: GRANT EXECUTE ON FUNCTION
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INT8) TO anon, authenticated, public;

-- =============================================================================
-- STEP 9: VERIFICATION QUERIES
-- =============================================================================

-- Check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products')
ORDER BY tablename, cmd;

-- Check table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products');

-- Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('reservations', 'reservation_items', 'products');
