-- =========================================
-- Fonction: get_prestation_all_unavailable_slots
-- =========================================
-- Retourne TOUS les créneaux horaires déjà réservés pour un produit
-- Utilisé pour charger les indisponibilités une seule fois (comme pour les locations)
-- Format: date (YYYY-MM-DD) et time_slot (LUNCH, AFTERNOON, EVENING)

CREATE OR REPLACE FUNCTION get_prestation_all_unavailable_slots(
  product_id_param BIGINT
)
RETURNS TABLE(date TEXT, time_slot TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(pi.prestation_date, 'YYYY-MM-DD') AS date,
    pi.time_slot::TEXT
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.product_id = product_id_param
    AND pi.prestation_date >= CURRENT_DATE  -- Seulement les dates futures
    AND pi.time_slot IS NOT NULL
    -- Exclure les réservations annulées
    AND pr.reservation_status != 'CANCELLED'
  ORDER BY pi.prestation_date, pi.time_slot::TEXT;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_prestation_all_unavailable_slots(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION get_prestation_all_unavailable_slots(BIGINT) TO authenticated;

-- Exemples d'utilisation :
--
-- Récupérer tous les créneaux réservés pour le produit 1
-- SELECT * FROM get_prestation_all_unavailable_slots(1);
--
-- Résultat possible :
-- date        | time_slot
-- ------------|----------
-- 2025-01-15  | AFTERNOON
-- 2025-01-15  | EVENING
-- 2025-01-16  | LUNCH
-- 2025-01-20  | AFTERNOON
--
-- Cela permet de savoir d'avance quels créneaux sont indisponibles
-- sans avoir à faire une requête à chaque changement de date
