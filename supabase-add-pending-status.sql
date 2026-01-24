-- Ajouter le statut PENDING aux enums de réservation

-- Pour rental_reservations
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'PENDING';

-- Note: Le statut PENDING sera utilisé pour les réservations créées avant paiement Stripe
-- Le webhook Stripe mettra à jour à CONFIRMED après paiement réussi
