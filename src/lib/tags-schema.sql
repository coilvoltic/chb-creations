-- Table des tags
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL, -- Format hexadécimal #RRGGBB
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison many-to-many pour associer tags aux réservations
CREATE TABLE IF NOT EXISTS reservation_tags (
  id SERIAL PRIMARY KEY,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  rental_reservation_id INTEGER REFERENCES rental_reservations(id) ON DELETE CASCADE,
  purchase_reservation_id INTEGER REFERENCES purchase_reservations(id) ON DELETE CASCADE,
  prestation_reservation_id INTEGER REFERENCES prestation_reservations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : au moins un des trois FK doit être non-null
  CONSTRAINT check_at_least_one_reservation CHECK (
    (rental_reservation_id IS NOT NULL)::integer +
    (purchase_reservation_id IS NOT NULL)::integer +
    (prestation_reservation_id IS NOT NULL)::integer = 1
  ),

  -- Empêcher les doublons (un tag ne peut être associé qu'une seule fois à une réservation)
  -- Note: Pas de NULLS NOT DISTINCT pour permettre le même tag sur plusieurs réservations
  UNIQUE (tag_id, rental_reservation_id),
  UNIQUE (tag_id, purchase_reservation_id),
  UNIQUE (tag_id, prestation_reservation_id)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_reservation_tags_tag_id ON reservation_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_reservation_tags_rental ON reservation_tags(rental_reservation_id) WHERE rental_reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservation_tags_purchase ON reservation_tags(purchase_reservation_id) WHERE purchase_reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservation_tags_prestation ON reservation_tags(prestation_reservation_id) WHERE prestation_reservation_id IS NOT NULL;

-- RLS Policies pour la table tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Les tags sont publics en lecture (anon peut lire), mais seuls les admins peuvent les modifier
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update tags" ON tags
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete tags" ON tags
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies pour la table reservation_tags
ALTER TABLE reservation_tags ENABLE ROW LEVEL SECURITY;

-- Les associations sont publiques en lecture, mais seuls les admins peuvent les modifier
CREATE POLICY "Reservation tags are viewable by everyone" ON reservation_tags
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert reservation tags" ON reservation_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update reservation tags" ON reservation_tags
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete reservation tags" ON reservation_tags
  FOR DELETE USING (auth.role() = 'authenticated');
