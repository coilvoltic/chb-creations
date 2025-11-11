-- =============================================================================
-- RLS Policies for CHB Créations Reservation System
-- =============================================================================
-- This script sets up Row Level Security policies for tables:
-- - reservations
-- - reservation_items
-- - products
--
-- Security model:
-- - Public (anonymous) users can:
--   * Read products
--   * Create reservations and reservation items
--   * Call get_product_unavailabilities function
-- - Authenticated users (admins) can:
--   * Do everything public users can do
--   * Read, update, delete reservations and items
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RESERVATIONS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to read reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to update reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated to delete reservations" ON reservations;

-- Allow anonymous users to create reservations
CREATE POLICY "Allow public to insert reservations"
ON reservations
FOR INSERT
TO public
WITH CHECK (true);

-- Block anonymous read, allow authenticated users to read
CREATE POLICY "Allow authenticated to read reservations"
ON reservations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users (admins) to update reservations
CREATE POLICY "Allow authenticated to update reservations"
ON reservations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users (admins) to delete reservations
CREATE POLICY "Allow authenticated to delete reservations"
ON reservations
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- RESERVATION_ITEMS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to insert reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to read reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to update reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow authenticated to delete reservation_items" ON reservation_items;

-- Allow anonymous users to create reservation items
CREATE POLICY "Allow public to insert reservation_items"
ON reservation_items
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to read reservation items
CREATE POLICY "Allow authenticated to read reservation_items"
ON reservation_items
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update reservation items
CREATE POLICY "Allow authenticated to update reservation_items"
ON reservation_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete reservation items
CREATE POLICY "Allow authenticated to delete reservation_items"
ON reservation_items
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- PRODUCTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated to delete products" ON products;

-- Allow everyone (public + authenticated) to read products
CREATE POLICY "Allow public to read products"
ON products
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create products
CREATE POLICY "Allow authenticated to insert products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "Allow authenticated to update products"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "Allow authenticated to delete products"
ON products
FOR DELETE
TO authenticated
USING (true);

-- =============================================================================
-- GRANT EXECUTE ON get_product_unavailabilities FUNCTION
-- =============================================================================

-- Allow public (anonymous) users to call the unavailabilities function
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INT8) TO anon, authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- To verify policies are correctly set up, run these queries:
--
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('reservations', 'reservation_items', 'products')
-- ORDER BY tablename, cmd;
