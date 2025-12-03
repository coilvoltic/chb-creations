-- =========================================
-- Migration: Prestation Time Slots (COMPLETED)
-- =========================================
-- This migration has been executed in the database
-- The table prestation_items now uses:
-- - prestation_date (DATE) instead of date (TIMESTAMP)
-- - time_slot (ENUM TimeSlot) with values: LUNCH, AFTERNOON, EVENING

-- ✅ COMPLETED CHANGES:
-- 1. Dropped column 'date' (was TIMESTAMP)
-- 2. Added column 'prestation_date' (DATE)
-- 3. Created ENUM type 'TimeSlot' with values: LUNCH, AFTERNOON, EVENING
-- 4. Added column 'time_slot' (TimeSlot ENUM)

-- Current structure:
-- prestation_items:
--   - id (bigint)
--   - prestation_reservation_id (bigint FK)
--   - product_id (bigint FK)
--   - quantity (integer)
--   - prestation_date (date) ← NEW
--   - time_slot (TimeSlot ENUM: LUNCH, AFTERNOON, EVENING) ← NEW
--   - options (jsonb)
--   - personalizations (jsonb)

-- ENUM definition in database:
-- CREATE TYPE TimeSlot AS ENUM ('LUNCH', 'AFTERNOON', 'EVENING');

-- Recommended index (if not already created):
CREATE INDEX IF NOT EXISTS idx_prestation_items_date_slot
ON prestation_items(prestation_date, time_slot);

-- Add comments for documentation (optional)
COMMENT ON COLUMN prestation_items.prestation_date IS 'Date of the prestation appointment (date only, no time)';
COMMENT ON COLUMN prestation_items.time_slot IS 'Time slot ENUM: LUNCH (12h-15h30), AFTERNOON (16h-20h), EVENING (20h30-23h30)';

-- Verification query:
-- SELECT * FROM prestation_items LIMIT 1;
