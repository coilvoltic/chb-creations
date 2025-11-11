-- Vérifier la date actuelle de la base de données
SELECT
    CURRENT_DATE as current_date,
    NOW() as current_timestamp,
    CURRENT_TIMESTAMP AT TIME ZONE 'UTC' as utc_timestamp;

-- Voir toutes les dates de réservation pour le produit 1 (sans filtre de date)
SELECT
    ri.product_id,
    ri.quantity,
    DATE(ri.rental_start) as rental_start_date,
    DATE(ri.rental_end) as rental_end_date,
    r.reservation_status
FROM reservation_items ri
JOIN reservations r ON ri.reservation_id = r.id
WHERE ri.product_id = 1
AND r.reservation_status != 'CANCELLED'
ORDER BY rental_start_date;

-- Tester la fonction SANS le filtre de date
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
    WHERE ri.product_id = 1
    AND r.reservation_status != 'CANCELLED'
) AS date_series
GROUP BY reservation_date
ORDER BY reservation_date;
