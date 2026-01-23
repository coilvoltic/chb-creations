-- Fonction pour récupérer TOUS les créneaux de prestation indisponibles pour un produit
-- Retourne tous les créneaux réservés (date + time_slot) pour faciliter l'affichage côté client

-- Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS get_prestation_all_unavailable_slots(bigint);
DROP FUNCTION IF EXISTS get_prestation_all_unavailable_slots(integer);
DROP FUNCTION IF EXISTS get_prestation_all_unavailable_slots(INT8);

-- Créer la nouvelle version
CREATE OR REPLACE FUNCTION get_prestation_all_unavailable_slots(product_id_param INT8)
RETURNS TABLE(
  date TEXT,
  time_slot TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    TO_CHAR(DATE(pi.prestation_date), 'YYYY-MM-DD') AS date,
    pi.time_slot::TEXT AS time_slot
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.product_id = product_id_param
    AND pi.prestation_date IS NOT NULL
    AND pi.time_slot IS NOT NULL
    -- Exclure les réservations annulées et non confirmées
    AND pr.reservation_status IN ('CONFIRMED', 'DONE')
    -- Filtrer uniquement les dates futures
    AND DATE(pi.prestation_date) >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
  ORDER BY date, time_slot;
END;
$$;

-- Accorder les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION get_prestation_all_unavailable_slots(INT8) TO anon, authenticated, service_role;

-- Exemple d'utilisation :
-- SELECT * FROM get_prestation_all_unavailable_slots(5);
--
-- Résultat :
-- date        | time_slot
-- ------------|------------
-- 2025-01-20  | LUNCH
-- 2025-01-20  | AFTERNOON
-- 2025-01-21  | EVENING
-- 2025-01-22  | LUNCH
--
-- Explication :
-- - Cette fonction retourne TOUS les créneaux occupés pour un produit donné
-- - Seules les prestations avec statut CONFIRMED ou DONE sont comptées
-- - Les dates passées sont automatiquement exclues
-- - Utilisée pour afficher les disponibilités côté client
