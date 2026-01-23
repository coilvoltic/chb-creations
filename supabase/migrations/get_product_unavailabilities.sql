-- Fonction pour calculer dynamiquement les unavailabilities d'un produit
-- Retourne pour chaque date le nombre total d'unités réservées (non annulées)

-- Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS get_product_unavailabilities(bigint);
DROP FUNCTION IF EXISTS get_product_unavailabilities(integer);
DROP FUNCTION IF EXISTS get_product_unavailabilities(INT8);

-- Créer la nouvelle version avec le bon type de paramètre
CREATE OR REPLACE FUNCTION get_product_unavailabilities(product_id_param INT8)
RETURNS TABLE(date TEXT, reserved_products BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    -- Générer toutes les dates entre rental_start et rental_end pour chaque réservation
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
      -- Exclure les réservations annulées
      AND rr.reservation_status IN ('CONFIRMED', 'DONE')
  )
  SELECT
    TO_CHAR(reservation_date, 'YYYY-MM-DD') AS date,
    SUM(quantity)::BIGINT AS reserved_products
  FROM date_series
  WHERE reservation_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date  -- Filtrer uniquement les dates futures (UTC)
  GROUP BY reservation_date
  ORDER BY reservation_date;
END;
$$;

-- Accorder les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INT8) TO anon, authenticated, service_role;

-- Exemple d'utilisation :
-- SELECT * FROM get_product_unavailabilities(1);
--
-- Résultat :
-- date        | reserved_products
-- ------------|------------------
-- 2025-01-15  | 10
-- 2025-01-16  | 15
-- 2025-01-17  | 5
