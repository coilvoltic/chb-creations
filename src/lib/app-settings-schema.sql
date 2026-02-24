-- =====================================================
-- Table: app_settings
-- Purpose: Stores configurable application settings
-- =====================================================
-- Run this SQL in the Supabase SQL editor to create the table.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public READ: needed for client-side components (e.g. TimePickerBoutique uses anon key)
CREATE POLICY "App settings are viewable by everyone"
  ON app_settings FOR SELECT USING (true);

-- Only service_role can write (all mutations go through authenticated admin API routes)
CREATE POLICY "Service role can manage app_settings"
  ON app_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Seed default boutique hours for prestation henné
-- boutique_hours_default: global opening/closing hours (array of slots)
-- boutique_hours_exceptions: array of date-specific overrides
INSERT INTO app_settings (key, value) VALUES
  ('boutique_hours_default', '{"slots": [{"start": "08:00", "end": "20:00"}]}'::jsonb),
  ('boutique_hours_exceptions', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- If the table already exists with the old format, run this to migrate:
-- UPDATE app_settings
--   SET value = jsonb_build_object('slots', jsonb_build_array(value))
--   WHERE key = 'boutique_hours_default'
--     AND value ? 'start';  -- old format had 'start' at top level

-- =====================================================
-- Value formats (updated — supports multiple slots per day):
--
-- boutique_hours_default:
--   { "slots": [{ "start": "HH:MM", "end": "HH:MM" }, ...] }
--   Example (nuit + journée): { "slots": [{"start":"00:00","end":"03:00"},{"start":"07:00","end":"23:59"}] }
--
-- boutique_hours_exceptions (array):
--   [
--     { "date": "YYYY-MM-DD", "closed": true },
--     { "date": "YYYY-MM-DD", "slots": [{"start": "HH:MM", "end": "HH:MM"}, ...] }
--   ]
-- =====================================================
