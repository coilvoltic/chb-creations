-- =========================================
-- Recherche simplifiée du trigger problématique
-- =========================================

-- ÉTAPE 1: Lister tous les triggers sur rental_reservations
SELECT
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'rental_reservations'
    AND NOT t.tgisinternal;

-- ÉTAPE 2: Ensuite, pour chaque fonction trouvée, exécutez cette requête en remplaçant 'nom_de_la_fonction':
-- SELECT prosrc FROM pg_proc WHERE proname = 'nom_de_la_fonction';

-- ÉTAPE 3: Alternative - Chercher directement dans prosrc (code source des fonctions)
SELECT
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%reservation_items%'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
