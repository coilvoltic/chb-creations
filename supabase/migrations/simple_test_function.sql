-- Créer une fonction ULTRA SIMPLE pour tester
CREATE OR REPLACE FUNCTION test_simple(product_id_param INT8)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(row_to_json(t))
    INTO result
    FROM (
        SELECT
            TO_CHAR(reservation_date, 'YYYY-MM-DD') AS date,
            SUM(quantity)::BIGINT AS reserved_products
        FROM (
            SELECT
                ri.quantity,
                generate_series(
                    DATE(ri.rental_start),
                    DATE(ri.rental_end),
                    '1 day'::interval
                )::date AS reservation_date
            FROM reservation_items ri
            JOIN reservations r ON ri.reservation_id = r.id
            WHERE ri.product_id = product_id_param
            AND r.reservation_status != 'CANCELLED'
        ) AS date_series
        GROUP BY reservation_date
        ORDER BY reservation_date
    ) t;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION test_simple(INT8) TO anon, authenticated, public;

-- Tester
SELECT test_simple(1);
