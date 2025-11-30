-- =========================================
-- RLS Policies for Prestation Tables
-- =========================================
-- This script adds RLS policies for prestation_reservations and prestation_items
-- following the same pattern as rental and purchase tables

-- ==========================================
-- DROP ALL EXISTING POLICIES (dynamically)
-- ==========================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on prestation_reservations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prestation_reservations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON prestation_reservations';
    END LOOP;

    -- Drop all policies on prestation_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prestation_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON prestation_items';
    END LOOP;
END $$;


-- ==========================================
-- 1. PRESTATION_RESERVATIONS TABLE
-- ==========================================

-- Enable RLS on prestation_reservations
ALTER TABLE prestation_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to prestation_reservations"
ON prestation_reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all prestation_reservations
CREATE POLICY "Authenticated users can view prestation_reservations"
ON prestation_reservations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Block direct access from anonymous clients
CREATE POLICY "Prevent public direct access to prestation_reservations"
ON prestation_reservations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);


-- ==========================================
-- 2. PRESTATION_ITEMS TABLE
-- ==========================================

-- Enable RLS on prestation_items
ALTER TABLE prestation_items ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to prestation_items"
ON prestation_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all prestation_items
CREATE POLICY "Authenticated users can view prestation_items"
ON prestation_items
FOR SELECT
TO authenticated
USING (true);

-- Policy: Anonymous users can READ prestation_items (needed for product unavailabilities if needed in the future)
-- This is safe because we only expose aggregate data (dates and quantities)
CREATE POLICY "Anonymous users can view prestation_items for availability"
ON prestation_items
FOR SELECT
TO anon
USING (true);

-- Policy: Block direct inserts from anonymous clients
CREATE POLICY "Prevent public inserts to prestation_items"
ON prestation_items
FOR INSERT
TO anon
WITH CHECK (false);

-- Policy: Block direct updates from anonymous clients
CREATE POLICY "Prevent public updates to prestation_items"
ON prestation_items
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Policy: Block direct deletes from anonymous clients
CREATE POLICY "Prevent public deletes from prestation_items"
ON prestation_items
FOR DELETE
TO anon
USING (false);


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check which tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('prestation_reservations', 'prestation_items');

-- Check policies for prestation tables:
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('prestation_reservations', 'prestation_items')
-- ORDER BY tablename, policyname;

-- Test as anonymous user (should be blocked):
-- SELECT * FROM prestation_reservations; -- Should return nothing (blocked by RLS)

-- Test as authenticated user (should work):
-- SELECT * FROM prestation_reservations; -- Should return data if authenticated
