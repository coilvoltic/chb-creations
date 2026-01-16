-- =========================================
-- Fix products table sequence
-- =========================================
-- This script resets the auto-increment sequence for the products table
-- to the correct value based on the maximum existing ID

-- Reset the sequence to the max ID + 1
SELECT setval(
  pg_get_serial_sequence('products', 'id'),
  COALESCE((SELECT MAX(id) FROM products), 0) + 1,
  false
);

-- Verify the sequence value
-- SELECT currval(pg_get_serial_sequence('products', 'id'));
