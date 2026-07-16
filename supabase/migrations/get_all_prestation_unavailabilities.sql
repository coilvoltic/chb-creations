-- Fonction pour récupérer TOUS les créneaux occupés bloquant la disponibilité des prestations
-- (prestations henné confirmées + créneaux de retrait/restitution des locations confirmées)
-- Retourne tous les créneaux avec date/heure de début et fin
-- Utilisé pour vérifier les disponibilités de manière centralisée
--
-- Depuis l'ajout du blocage lié aux locations : chaque retrait et chaque restitution
-- de location bloque un créneau fixe de 30 minutes, quel que soit le mode (boutique,
-- livraison, point relais) et quelle que soit la quantité d'articles de la réservation.
-- Aucun filtrage par produit n'est fait côté client (tous les créneaux, quelle que soit
-- leur origine, bloquent le planning henné dans son ensemble), donc la fonction ne
-- renvoie plus de product_id.

-- Supprimer la version existante si elle existe
DROP FUNCTION IF EXISTS get_all_prestation_unavailabilities();

-- Créer la nouvelle fonction
CREATE OR REPLACE FUNCTION get_all_prestation_unavailabilities()
RETURNS TABLE(
  prestation_start TIMESTAMP WITH TIME ZONE,
  prestation_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- 1) Créneaux de prestations henné confirmées
  SELECT
    pi.prestation_start,
    pi.prestation_end
  FROM prestation_items pi
  JOIN prestation_reservations pr ON pi.prestation_reservation_id = pr.id
  WHERE pi.prestation_start IS NOT NULL
    AND pi.prestation_end IS NOT NULL
    -- Exclure les réservations annulées
    AND pr.reservation_status IN ('CONFIRMED', 'DONE')
    -- Filtrer uniquement les créneaux futurs ou en cours
    AND pi.prestation_end >= NOW()

  UNION ALL

  -- 2) Créneaux de retrait des locations confirmées : 30 min bloquées par retrait,
  --    peu importe le mode (boutique/livraison/point relais) et la quantité d'articles
  SELECT DISTINCT
    ri.rental_start AS prestation_start,
    ri.rental_start + INTERVAL '30 minutes' AS prestation_end
  FROM rental_items ri
  JOIN rental_reservations rr ON ri.rental_reservation_id = rr.id
  WHERE ri.rental_start IS NOT NULL
    AND rr.reservation_status IN ('CONFIRMED', 'DONE')
    AND ri.rental_start + INTERVAL '30 minutes' >= NOW()

  UNION ALL

  -- 3) Créneaux de restitution des locations confirmées : 30 min bloquées par restitution,
  --    peu importe le mode (boutique/livraison/point relais) et la quantité d'articles
  SELECT DISTINCT
    ri.rental_end AS prestation_start,
    ri.rental_end + INTERVAL '30 minutes' AS prestation_end
  FROM rental_items ri
  JOIN rental_reservations rr ON ri.rental_reservation_id = rr.id
  WHERE ri.rental_end IS NOT NULL
    AND rr.reservation_status IN ('CONFIRMED', 'DONE')
    AND ri.rental_end + INTERVAL '30 minutes' >= NOW()

  ORDER BY prestation_start;
END;
$$;

-- Accorder les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION get_all_prestation_unavailabilities() TO anon, authenticated, service_role;

-- Fonction helper pour vérifier si un créneau est disponible
-- Retourne TRUE si le créneau est disponible, FALSE s'il y a un chevauchement
-- Réutilise get_all_prestation_unavailabilities() pour rester cohérente avec les
-- créneaux de retrait/restitution des locations (voir plus haut)
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
  -- Vérifier s'il existe des créneaux (prestations ou locations) qui se chevauchent
  SELECT COUNT(*)
  INTO conflict_count
  FROM get_all_prestation_unavailabilities() u
  -- Détection de chevauchement: les créneaux se chevauchent si
  -- le début du nouveau créneau est avant la fin d'un créneau existant
  -- ET la fin du nouveau créneau est après le début d'un créneau existant
  WHERE requested_start < u.prestation_end AND requested_end > u.prestation_start;

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
-- prestation_start           | prestation_end
-- ----------------------------|---------------------------
-- 2025-01-20 12:00:00+00     | 2025-01-20 15:30:00+00
-- 2025-01-20 16:00:00+00     | 2025-01-20 20:00:00+00
-- 2025-01-21 20:30:00+00     | 2025-01-21 23:30:00+00
-- 2025-01-22 09:00:00+00     | 2025-01-22 09:30:00+00  (retrait location)
-- 2025-01-25 18:00:00+00     | 2025-01-25 18:30:00+00  (restitution location)
--
-- 2. Vérifier si un créneau est disponible:
-- SELECT is_prestation_slot_available('2025-01-20 14:00:00+00', '2025-01-20 16:00:00+00');
--
-- Résultat : FALSE (car chevauche avec le créneau LUNCH 12h-15h30)
