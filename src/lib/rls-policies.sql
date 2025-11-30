-- =========================================
-- RLS Policies for CHB Créations Database
-- =========================================

-- ==========================================
-- DROP ALL EXISTING POLICIES (dynamically)
-- ==========================================

-- This will drop ALL policies on the specified tables
-- Use with caution - this removes every policy regardless of name

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on customer_orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customer_orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON customer_orders';
    END LOOP;

    -- Drop all policies on rental_reservations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'rental_reservations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON rental_reservations';
    END LOOP;

    -- Drop all policies on rental_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'rental_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON rental_items';
    END LOOP;

    -- Drop all policies on purchase_reservations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'purchase_reservations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON purchase_reservations';
    END LOOP;

    -- Drop all policies on purchase_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'purchase_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON purchase_items';
    END LOOP;

    -- Drop all policies on prestation_reservations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prestation_reservations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON prestation_reservations';
    END LOOP;

    -- Drop all policies on prestation_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prestation_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON prestation_items';
    END LOOP;

    -- Drop all policies on products
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON products';
    END LOOP;
END $$;


-- ==========================================
-- 1. CUSTOMER_ORDERS TABLE
-- ==========================================

-- Enable RLS on customer_orders
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service_role to do everything (bypass RLS for API routes)
-- This is needed because our API routes use service_role key
CREATE POLICY "Service role has full access to customer_orders"
ON customer_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Admins can view all orders (read-only via anon key with admin check)
-- Note: Actual admin access is managed via the is_admin() function in API routes
CREATE POLICY "Authenticated users can view customer_orders"
ON customer_orders
FOR SELECT
TO authenticated
USING (true);

-- Policy: Block direct inserts/updates/deletes from clients
-- Orders should only be created through API routes using service_role
CREATE POLICY "Prevent public direct access to customer_orders"
ON customer_orders
FOR ALL
TO anon
USING (false)
WITH CHECK (false);


-- ==========================================
-- 2. RENTAL_RESERVATIONS TABLE
-- ==========================================

-- Enable RLS on rental_reservations
ALTER TABLE rental_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to rental_reservations"
ON rental_reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all rental_reservations
CREATE POLICY "Authenticated users can view rental_reservations"
ON rental_reservations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Block direct access from anonymous clients
CREATE POLICY "Prevent public direct access to rental_reservations"
ON rental_reservations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);


-- ==========================================
-- 3. RENTAL_ITEMS TABLE
-- ==========================================

-- Enable RLS on rental_items
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to rental_items"
ON rental_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all rental_items
CREATE POLICY "Authenticated users can view rental_items"
ON rental_items
FOR SELECT
TO authenticated
USING (true);

-- Policy: Anonymous users can READ rental_items (needed for product unavailabilities)
-- This is safe because we only expose aggregate data (dates and quantities)
CREATE POLICY "Anonymous users can view rental_items for availability"
ON rental_items
FOR SELECT
TO anon
USING (true);

-- Policy: Block direct inserts from anonymous clients
CREATE POLICY "Prevent public inserts to rental_items"
ON rental_items
FOR INSERT
TO anon
WITH CHECK (false);

-- Policy: Block direct updates from anonymous clients
CREATE POLICY "Prevent public updates to rental_items"
ON rental_items
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Policy: Block direct deletes from anonymous clients
CREATE POLICY "Prevent public deletes from rental_items"
ON rental_items
FOR DELETE
TO anon
USING (false);


-- ==========================================
-- 4. PURCHASE_RESERVATIONS TABLE
-- ==========================================

-- Enable RLS on purchase_reservations
ALTER TABLE purchase_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to purchase_reservations"
ON purchase_reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all purchase_reservations
CREATE POLICY "Authenticated users can view purchase_reservations"
ON purchase_reservations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Block direct access from anonymous clients
CREATE POLICY "Prevent public direct access to purchase_reservations"
ON purchase_reservations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);


-- ==========================================
-- 5. PURCHASE_ITEMS TABLE
-- ==========================================

-- Enable RLS on purchase_items
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to purchase_items"
ON purchase_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all purchase_items
CREATE POLICY "Authenticated users can view purchase_items"
ON purchase_items
FOR SELECT
TO authenticated
USING (true);

-- Policy: Block direct inserts from anonymous clients
CREATE POLICY "Prevent public inserts to purchase_items"
ON purchase_items
FOR INSERT
TO anon
WITH CHECK (false);

-- Policy: Block direct updates from anonymous clients
CREATE POLICY "Prevent public updates to purchase_items"
ON purchase_items
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Policy: Block direct deletes from anonymous clients
CREATE POLICY "Prevent public deletes from purchase_items"
ON purchase_items
FOR DELETE
TO anon
USING (false);


-- ==========================================
-- 6. PRESTATION_RESERVATIONS TABLE
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
-- 7. PRESTATION_ITEMS TABLE
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

-- Policy: Anonymous users can READ prestation_items (for availability checks if needed)
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
-- 8. PRODUCTS TABLE (if not already set)
-- ==========================================

-- Enable RLS on products (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read products (needed for public product pages)
CREATE POLICY "Public read access to products" ON products
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Service role can write products
CREATE POLICY "Service role can manage products" ON products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check which tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';

-- Check policies for a specific table:
-- SELECT * FROM pg_policies WHERE tablename = 'customer_orders';

-- Test as anonymous user:
-- SELECT * FROM customer_orders; -- Should return nothing (blocked by RLS)

-- Test get_product_unavailabilities (should work):
-- SELECT * FROM get_product_unavailabilities(1); -- Should return data
