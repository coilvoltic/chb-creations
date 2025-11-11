-- Quick RLS fix for reservations and reservation_items
-- This allows anonymous users to create reservations

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow public to insert reservation_items" ON reservation_items;
DROP POLICY IF EXISTS "Allow public to read products" ON products;

-- Allow anonymous users to INSERT reservations
CREATE POLICY "Allow public to insert reservations"
ON reservations
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anonymous users to INSERT reservation_items
CREATE POLICY "Allow public to insert reservation_items"
ON reservation_items
FOR INSERT
TO public
WITH CHECK (true);

-- Allow everyone to read products
CREATE POLICY "Allow public to read products"
ON products
FOR SELECT
TO public
USING (true);

-- Grant execute on function
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INT8) TO anon, authenticated;
