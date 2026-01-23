-- =========================================
-- Script de débogage: Trouver le trigger problématique
-- =========================================
-- Ce script permet d'identifier le trigger ou la contrainte qui référence
-- la table inexistante "reservation_items" sur rental_reservations

-- 1. Trouver tous les triggers sur rental_reservations
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'rental_reservations';

-- 2. Trouver toutes les fonctions qui référencent "reservation_items"
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%reservation_items%'
    AND routine_schema = 'public';

-- 3. Trouver toutes les contraintes sur rental_reservations
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'rental_reservations'
    AND n.nspname = 'public';

-- 4. Chercher dans les politiques RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'rental_reservations';

-- =========================================
-- Une fois le trigger/fonction identifié, utilisez les commandes suivantes:
-- =========================================

-- Pour supprimer un trigger:
-- DROP TRIGGER IF EXISTS [nom_du_trigger] ON rental_reservations CASCADE;

-- Pour supprimer une fonction:
-- DROP FUNCTION IF EXISTS [nom_de_la_fonction]() CASCADE;

-- Pour supprimer une contrainte:
-- ALTER TABLE rental_reservations DROP CONSTRAINT IF EXISTS [nom_de_la_contrainte] CASCADE;
