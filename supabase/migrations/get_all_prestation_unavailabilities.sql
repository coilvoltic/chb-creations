-- Fonction pour récupérer TOUS les créneaux de prestation occupés (tous produits confondus)
-- Retourne tous les créneaux réservés avec date/heure de début et fin
-- Utilisé pour vérifier les disponibilités de manière centralisée

-- Supprimer la version existante si elle existe
DROP FUNCTION IF EXISTS get_all_prestation_unavailabilities();

-- Créer la nouvelle fonction
CREATE OR REPLACE FUNCTION get_all_prestation_unavailabilities()
RETURNS TABLE(
  product_id BIGINT,
  prestation_start TIMESTAMP WITH TIME ZONE,
  prestation_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.product_id,
    pi.prestation_start,
    pi.prestation_end
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.prestation_start IS NOT NULL
    AND pi.prestation_end IS NOT NULL
    -- Exclure les réservations annulées
    AND pr.reservation_status IN ('CONFIRMED', 'DONE', 'PENDING')
    -- Filtrer uniquement les créneaux futurs ou en cours
    AND pi.prestation_end >= NOW()
  ORDER BY pi.prestation_start;
END;
$$;

-- Accorder les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION get_all_prestation_unavailabilities() TO anon, authenticated, service_role;

-- Fonction helper pour vérifier si un créneau est disponible
-- Retourne TRUE si le créneau est disponible, FALSE s'il y a un chevauchement
DROP FUNCTION IF EXISTS is_prestation_slot_available(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION is_prestation_slot_available(
  requested_start TIMESTAMP WITH TIME ZONE,
  requested_end TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Vérifier s'il existe des créneaux qui se chevauchent
  SELECT COUNT(*)
  INTO conflict_count
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.prestation_start IS NOT NULL
    AND pi.prestation_end IS NOT NULL
    AND pr.reservation_status IN ('CONFIRMED', 'DONE', 'PENDING')
    -- Détection de chevauchement: les créneaux se chevauchent si
    -- le début du nouveau créneau est avant la fin d'un créneau existant
    -- ET la fin du nouveau créneau est après le début d'un créneau existant
    AND (
      (requested_start < pi.prestation_end AND requested_end > pi.prestation_start)
    );

  -- Retourne TRUE si aucun conflit, FALSE sinon
  RETURN conflict_count = 0;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION is_prestation_slot_available(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon, authenticated, service_role;

-- Exemples d'utilisation :
--
-- 1. Récupérer tous les créneaux occupés:
-- SELECT * FROM get_all_prestation_unavailabilities();
--
-- Résultat :
-- product_id | prestation_start           | prestation_end
-- -----------|----------------------------|---------------------------
-- 5          | 2025-01-20 12:00:00+00     | 2025-01-20 15:30:00+00
-- 5          | 2025-01-20 16:00:00+00     | 2025-01-20 20:00:00+00
-- 7          | 2025-01-21 20:30:00+00     | 2025-01-21 23:30:00+00
--
-- 2. Vérifier si un créneau est disponible:
-- SELECT is_prestation_slot_available('2025-01-20 14:00:00+00', '2025-01-20 16:00:00+00');
--
-- Résultat : FALSE (car chevauche avec le créneau LUNCH 12h-15h30)
