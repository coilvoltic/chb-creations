-- Accorder les permissions d'exécution sur la fonction à tous les rôles
GRANT EXECUTE ON FUNCTION get_product_unavailabilities(INT8) TO anon, authenticated, public;

-- Vérifier les permissions
SELECT
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_product_unavailabilities';

-- Vérifier les grants
SELECT
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name = 'get_product_unavailabilities';
