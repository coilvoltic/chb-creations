-- =====================================================
-- SYSTÈME DE MAINTENANCE - CHB Créations
-- =====================================================
-- Ce fichier contient le SQL à exécuter dans Supabase
-- pour activer le mode maintenance du site.
--
-- Instructions:
-- 1. Allez sur app.supabase.com → Votre projet
-- 2. SQL Editor (dans le menu de gauche)
-- 3. Copiez-collez tout ce fichier
-- 4. Cliquez sur "Run"
-- =====================================================

-- Créer la table site_settings (paramètres globaux du site)
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT 'Le site est actuellement en maintenance. Nous revenons bientôt !',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,

  -- Contrainte pour n'avoir qu'une seule ligne
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insérer la ligne unique avec les valeurs par défaut
INSERT INTO site_settings (id, maintenance_mode, maintenance_message)
VALUES (1, false, 'Le site est actuellement en maintenance. Nous revenons bientôt !')
ON CONFLICT (id) DO NOTHING;

-- Créer un index pour la performance
CREATE INDEX IF NOT EXISTS idx_site_settings_maintenance
ON site_settings(maintenance_mode);

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (tout le monde peut lire)
CREATE POLICY "Public can read site settings"
ON site_settings FOR SELECT
TO public
USING (true);

-- Politique de mise à jour réservée aux admins authentifiés
CREATE POLICY "Only admins can update site settings"
ON site_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
  )
);

-- =====================================================
-- FONCTIONS SQL
-- =====================================================

-- Fonction pour récupérer l'état du mode maintenance (public)
CREATE OR REPLACE FUNCTION get_maintenance_status()
RETURNS TABLE (
  is_maintenance BOOLEAN,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT maintenance_mode, maintenance_message
  FROM site_settings
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour activer/désactiver le mode maintenance (admin only)
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(
  new_status BOOLEAN,
  new_message TEXT DEFAULT NULL,
  admin_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE email = admin_email
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can toggle maintenance mode';
  END IF;

  -- Mettre à jour le mode maintenance
  UPDATE site_settings
  SET
    maintenance_mode = new_status,
    maintenance_message = COALESCE(new_message, maintenance_message),
    updated_at = NOW(),
    updated_by = admin_email
  WHERE id = 1;

  RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER pour mettre à jour updated_at automatiquement
-- =====================================================

CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_timestamp();

-- =====================================================
-- COMMENTAIRES (documentation)
-- =====================================================

COMMENT ON TABLE site_settings IS 'Paramètres globaux du site (mode maintenance, etc.)';
COMMENT ON COLUMN site_settings.maintenance_mode IS 'Si true, le site affiche une page de maintenance';
COMMENT ON COLUMN site_settings.maintenance_message IS 'Message affiché sur la page de maintenance';
COMMENT ON COLUMN site_settings.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN site_settings.updated_by IS 'Email de l''admin qui a fait la dernière modification';

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher l'état actuel
SELECT * FROM site_settings;

-- Test de la fonction de récupération
SELECT * FROM get_maintenance_status();

-- =====================================================
-- SETUP TERMINÉ !
-- =====================================================
-- Vous pouvez maintenant :
-- 1. Activer le mode maintenance via l'interface admin
-- 2. Le site redirigera automatiquement vers /maintenance
-- 3. Les admins pourront toujours accéder au site
-- =====================================================
