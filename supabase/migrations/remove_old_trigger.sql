-- =========================================
-- Suppression du trigger et fonction obsolètes
-- =========================================
-- Cette fonction référence l'ancienne table "reservation_items" qui n'existe plus
-- et empêche les UPDATE sur rental_reservations

-- 1. Trouver et supprimer le trigger qui utilise cette fonction
DROP TRIGGER IF EXISTS check_reservation_status_trigger ON rental_reservations CASCADE;
DROP TRIGGER IF EXISTS update_reservation_status ON rental_reservations CASCADE;
DROP TRIGGER IF EXISTS set_reservation_done ON rental_reservations CASCADE;

-- 2. Supprimer la fonction obsolète
DROP FUNCTION IF EXISTS check_reservation_status() CASCADE;

-- Vérification : cette requête ne devrait plus rien retourner
SELECT
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%reservation_items%'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
