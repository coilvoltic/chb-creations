-- Migration: Ajouter les colonnes pour le paiement et la livraison
-- Date: 2025-11-16
-- Description: Ajoute les colonnes delivery_option, delivery_fees et stripe_payment_id à la table reservations

-- Ajouter la colonne delivery_option
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup' CHECK (delivery_option IN ('pickup', 'delivery'));

-- Ajouter la colonne delivery_fees
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS delivery_fees NUMERIC DEFAULT 0;

-- Ajouter la colonne stripe_payment_id pour stocker l'ID du paiement Stripe
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN reservations.delivery_option IS 'Mode de récupération: pickup (retrait en boutique) ou delivery (livraison à domicile)';
COMMENT ON COLUMN reservations.delivery_fees IS 'Frais de livraison en euros';
COMMENT ON COLUMN reservations.stripe_payment_id IS 'ID du PaymentIntent Stripe si paiement en ligne effectué';
