-- Fix update_past_reservations_to_done function to use new prestation_start/prestation_end fields
-- This function automatically marks reservations as DONE when their dates have passed

-- Drop the old version
DROP FUNCTION IF EXISTS update_past_reservations_to_done();

-- Recreate the function with updated logic for prestations
CREATE OR REPLACE FUNCTION update_past_reservations_to_done()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update rental reservations to DONE if all rental items have ended
  UPDATE rental_reservations rr
  SET reservation_status = 'DONE'
  WHERE rr.reservation_status IN ('CONFIRMED', 'PENDING')
    AND NOT EXISTS (
      SELECT 1
      FROM rental_items ri
      WHERE ri.rental_reservation_id = rr.id
        AND ri.rental_end > NOW()
    );

  -- Update purchase reservations to DONE (no date logic needed, manual management)
  -- Purchases don't auto-transition to DONE

  -- Update prestation reservations to DONE if all prestation items have ended
  UPDATE prestation_reservations pr
  SET reservation_status = 'DONE'
  WHERE pr.reservation_status IN ('CONFIRMED', 'PENDING')
    AND NOT EXISTS (
      SELECT 1
      FROM prestation_items pi
      WHERE pi.prestation_reservation_id = pr.id
        AND pi.prestation_end > NOW()
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_past_reservations_to_done() TO authenticated;
GRANT EXECUTE ON FUNCTION update_past_reservations_to_done() TO service_role;
