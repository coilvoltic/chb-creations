-- =========================================
-- FIX: get_product_unavailabilities function
-- =========================================

-- 1. Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_product_unavailabilities(bigint);
DROP FUNCTION IF EXISTS get_product_unavailabilities(integer);

-- 2. Create the correct version using new schema
CREATE OR REPLACE FUNCTION get_product_unavailabilities(product_id_param INTEGER)
RETURNS TABLE(date TEXT, reserved_products BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    -- Generate all dates between rental_start and rental_end for each reservation
    SELECT
      ri.product_id,
      ri.quantity,
      generate_series(
        DATE(ri.rental_start),
        DATE(ri.rental_end),
        '1 day'::interval
      )::date AS reservation_date,
      rr.reservation_status
    FROM rental_items ri
    JOIN rental_reservations rr ON ri.rental_reservation_id = rr.id
    WHERE ri.product_id = product_id_param
      -- Exclude cancelled reservations
      AND rr.reservation_status IN ('CONFIRMED', 'DONE')
  )
  SELECT
    TO_CHAR(reservation_date, 'YYYY-MM-DD') AS date,
    SUM(quantity)::BIGINT AS reserved_products
  FROM date_series
  WHERE reservation_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date  -- Only future dates (UTC)
  GROUP BY reservation_date
  ORDER BY reservation_date;
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INTEGER) TO anon, authenticated, service_role;

-- 4. Test the function
-- SELECT * FROM get_product_unavailabilities(1);
