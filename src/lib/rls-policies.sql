-- =========================================
-- RLS Policies for CHB Créations Database
-- =========================================

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
-- 4. PRODUCTS TABLE (if not already set)
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
