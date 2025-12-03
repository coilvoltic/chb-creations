-- =========================================
-- Fonction: get_prestation_unavailable_slots
-- =========================================
-- Retourne les créneaux horaires déjà réservés pour une date et un produit donnés
-- Cette fonction permet de vérifier la disponibilité des créneaux (LUNCH, AFTERNOON, EVENING)
-- pour empêcher les double-réservations de prestations

CREATE OR REPLACE FUNCTION get_prestation_unavailable_slots(
  product_id_param BIGINT,
  date_param DATE
)
RETURNS TABLE(time_slot TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT pi.time_slot::TEXT
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.product_id = product_id_param
    AND pi.prestation_date = date_param
    AND pi.time_slot IS NOT NULL
    -- Exclure les réservations annulées
    AND pr.reservation_status != 'CANCELLED'
  ORDER BY pi.time_slot::TEXT;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_prestation_unavailable_slots(BIGINT, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_prestation_unavailable_slots(BIGINT, DATE) TO authenticated;

-- Exemples d'utilisation :
--
-- Vérifier les créneaux réservés pour le produit 1 le 15 janvier 2025
-- SELECT * FROM get_prestation_unavailable_slots(1, '2025-01-15');
--
-- Résultat possible :
-- time_slot
-- -----------
-- AFTERNOON
-- EVENING
--
-- Cela signifie que seul le créneau LUNCH est disponible pour cette date
