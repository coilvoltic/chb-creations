-- Fonction pour récupérer TOUS les créneaux occupés bloquant la disponibilité des LOCATIONS
-- (retrait et restitution). Réutilise get_all_prestation_unavailabilities() qui contient déjà
-- tout ce dont on a besoin : les prestations henné confirmées + les blocs de 30 min de
-- retrait/restitution de toutes les locations confirmées (voir get_all_prestation_unavailabilities.sql).
--
-- Un nouveau retrait ou une nouvelle restitution de location (chacun bloquant 30 min, peu importe
-- le mode - boutique/livraison/point relais - et la quantité d'articles) doit être refusé s'il
-- chevauche l'une de ces fenêtres.
--
-- Simple wrapper (mêmes données, colonnes renommées pour rester lisible côté "locations") afin de
-- ne pas dupliquer la requête sous-jacente : toute évolution de get_all_prestation_unavailabilities()
-- se répercute automatiquement ici.

DROP FUNCTION IF EXISTS get_all_location_unavailabilities();

CREATE OR REPLACE FUNCTION get_all_location_unavailabilities()
RETURNS TABLE(
  window_start TIMESTAMP WITH TIME ZONE,
  window_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT prestation_start, prestation_end
  FROM get_all_prestation_unavailabilities();
$$;

-- Accorder les permissions d'exécution à tous les rôles
GRANT EXECUTE ON FUNCTION get_all_location_unavailabilities() TO anon, authenticated, service_role;

-- Exemple d'utilisation :
-- SELECT * FROM get_all_location_unavailabilities();
--
-- Résultat :
-- window_start               | window_end
-- ----------------------------|---------------------------
-- 2025-01-20 12:00:00+00     | 2025-01-20 15:30:00+00  (prestation henné)
-- 2025-01-22 09:00:00+00     | 2025-01-22 09:30:00+00  (retrait d'une autre location)
-- 2025-01-25 18:00:00+00     | 2025-01-25 18:30:00+00  (restitution d'une autre location)
