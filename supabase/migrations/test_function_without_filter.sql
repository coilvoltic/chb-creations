-- Créer une version TEST de la fonction SANS filtre de date
CREATE OR REPLACE FUNCTION get_product_unavailabilities_test(product_id_param INT8)
RETURNS TABLE(date TEXT, reserved_products BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT
      ri.product_id,
      ri.quantity,
      generate_series(
        DATE(ri.rental_start),
        DATE(ri.rental_end),
        '1 day'::interval
      )::date AS reservation_date,
      r.reservation_status
    FROM reservation_items ri
    JOIN reservations r ON ri.reservation_id = r.id
    WHERE ri.product_id = product_id_param
      AND r.reservation_status != 'CANCELLED'
  )
  SELECT
    TO_CHAR(reservation_date, 'YYYY-MM-DD') AS date,
    SUM(quantity)::BIGINT AS reserved_products
  FROM date_series
  -- PAS DE FILTRE DE DATE POUR TESTER
  GROUP BY reservation_date
  ORDER BY reservation_date;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_product_unavailabilities_test(INT8) TO anon, authenticated, public;

-- Tester la nouvelle fonction
SELECT * FROM get_product_unavailabilities_test(1);
