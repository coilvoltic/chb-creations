-- Migration: Modifier la structure de prestation_items pour supporter les horaires flexibles
-- Date: 2026-02-01
-- Description: Remplace prestation_date + time_slot par prestation_start + prestation_end

-- Étape 1: Ajouter les nouvelles colonnes
ALTER TABLE prestation_items
ADD COLUMN prestation_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN prestation_end TIMESTAMP WITH TIME ZONE;

-- Étape 2: Migrer les données existantes
-- Convertir time_slot en horaires réels
UPDATE prestation_items
SET
  prestation_start = CASE
    WHEN time_slot = 'LUNCH' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '12 hours')
    WHEN time_slot = 'AFTERNOON' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '16 hours')
    WHEN time_slot = 'EVENING' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '20 hours 30 minutes')
    ELSE NULL
  END,
  prestation_end = CASE
    WHEN time_slot = 'LUNCH' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '15 hours 30 minutes')
    WHEN time_slot = 'AFTERNOON' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '20 hours')
    WHEN time_slot = 'EVENING' THEN
      (prestation_date AT TIME ZONE 'Europe/Paris' + INTERVAL '23 hours 30 minutes')
    ELSE NULL
  END
WHERE prestation_date IS NOT NULL AND time_slot IS NOT NULL;

-- Étape 3: Supprimer les anciennes colonnes
ALTER TABLE prestation_items
DROP COLUMN IF EXISTS prestation_date,
DROP COLUMN IF EXISTS time_slot;

-- Étape 4: Supprimer l'ENUM TimeSlot (si aucune autre table ne l'utilise)
DROP TYPE IF EXISTS TimeSlot CASCADE;

-- Étape 5: Créer un index pour optimiser les recherches de chevauchements
CREATE INDEX IF NOT EXISTS idx_prestation_items_times
ON prestation_items(prestation_start, prestation_end);

-- Note: Les nouvelles colonnes restent NULL par défaut car certaines prestations
-- peuvent ne pas avoir de date/heure assignée (réservation en attente de confirmation)
