# Mode Maintenance - Guide d'installation

Ce guide vous explique comment activer le système de mode maintenance pour CHB Créations.

## 📋 Vue d'ensemble

Le mode maintenance permet de :
- ✅ Afficher une page de maintenance aux visiteurs
- ✅ Permettre aux administrateurs d'accéder au site normalement
- ✅ Activer/désactiver le mode depuis le dashboard admin
- ✅ Personnaliser le message affiché aux visiteurs

---

## 🗄️ Étape 1 : Configuration de la base de données Supabase

### 1.1 Accéder à Supabase
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet **CHB Créations**
3. Dans le menu de gauche, cliquez sur **SQL Editor**

### 1.2 Exécuter le script SQL
1. Cliquez sur **New query** (ou **+ New query**)
2. Ouvrez le fichier `supabase-maintenance-setup.sql` (à la racine du projet)
3. **Copiez tout le contenu du fichier**
4. **Collez-le** dans l'éditeur SQL de Supabase
5. Cliquez sur **Run** (bouton vert en bas à droite)
6. Attendez la confirmation : "Success. No rows returned"

### 1.3 Vérification
Dans le SQL Editor, exécutez cette requête pour vérifier que tout est OK :

```sql
SELECT * FROM site_settings;
```

Vous devriez voir :
```
| id | maintenance_mode | maintenance_message                                        | updated_at | updated_by |
|----|------------------|------------------------------------------------------------|------------|------------|
| 1  | false            | Le site est actuellement en maintenance. Nous revenons... | ...        | null       |
```

✅ **Si vous voyez cette ligne, la base de données est prête !**

---

## 💻 Étape 2 : Déploiement du code

### 2.1 Fichiers créés

Les fichiers suivants ont été ajoutés au projet :

**Base de données :**
- `supabase-maintenance-setup.sql` - Script SQL à exécuter

**Composants :**
- `src/components/MaintenanceToggle.tsx` - Toggle admin pour activer/désactiver
- `src/app/maintenance/page.tsx` - Page affichée aux visiteurs
- `src/middleware.ts` - Middleware mis à jour (gestion redirection)
- `src/app/admin/dashboard/page.tsx` - Dashboard mis à jour (avec toggle)

### 2.2 Commit et déploiement

```bash
# Ajouter tous les nouveaux fichiers
git add .

# Commit
git commit -m "Add maintenance mode feature"

# Push vers GitHub
git push
```

Vercel redéploiera automatiquement le site (1-2 minutes).

---

## 🎛️ Étape 3 : Utilisation

### 3.1 Activer le mode maintenance

1. Allez sur `https://chb-creations.com/admin/dashboard`
2. Connectez-vous avec vos identifiants admin
3. En haut de la page, vous verrez une card **"Mode Maintenance"**
4. Cliquez sur le **toggle** pour activer (il devient orange)
5. (Optionnel) Modifiez le message affiché aux visiteurs
6. Cliquez sur **"Mettre à jour le message"**

### 3.2 Ce qui se passe

**Pour les visiteurs normaux :**
- Toutes les pages redirigent vers `/maintenance`
- Affichage du message personnalisé
- Possibilité de contacter par email/téléphone

**Pour les administrateurs :**
- Accès complet au site (aucune restriction)
- Peuvent continuer à gérer les réservations
- Le toggle reste visible pour désactiver quand c'est prêt

### 3.3 Désactiver le mode maintenance

1. Allez sur le dashboard admin
2. Cliquez sur le toggle pour désactiver (il devient gris)
3. Le site redevient accessible à tous instantanément

---

## 🧪 Étape 4 : Tests

### Test 1 : Activation en tant qu'admin

1. Connectez-vous en admin
2. Activez le mode maintenance
3. Ouvrez une **fenêtre de navigation privée**
4. Allez sur `https://chb-creations.com`
5. ✅ Vous devriez voir la page de maintenance

### Test 2 : Accès admin maintenu

1. Le mode maintenance est activé
2. Dans votre session admin (fenêtre normale), naviguez sur le site
3. ✅ Vous devriez pouvoir accéder normalement à toutes les pages

### Test 3 : Désactivation

1. Désactivez le mode maintenance
2. Dans la fenêtre privée, rafraîchissez la page
3. ✅ Le site normal s'affiche

---

## 🔍 Dépannage

### Problème : Le toggle ne s'affiche pas dans le dashboard

**Solution :**
1. Vérifiez que vous avez bien exécuté le script SQL dans Supabase
2. Vérifiez que le fichier `src/components/MaintenanceToggle.tsx` existe
3. Redéployez le site si nécessaire

### Problème : Erreur "fonction get_maintenance_status n'existe pas"

**Solution :**
1. Retournez dans Supabase → SQL Editor
2. Ré-exécutez le script `supabase-maintenance-setup.sql` complet
3. La fonction sera créée

### Problème : Le site ne redirige pas vers /maintenance

**Solution :**
1. Vérifiez que le middleware a bien été mis à jour
2. Redéployez sur Vercel
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Problème : Les admins sont aussi bloqués

**Solution :**
1. Vérifiez que vous êtes bien connecté en tant qu'admin
2. Vérifiez que votre email est dans la table `admin_users`
3. Reconnectez-vous sur `/admin/login`

---

## 📊 Structure de la base de données

### Table : site_settings

| Colonne              | Type      | Description                                |
|----------------------|-----------|--------------------------------------------|
| id                   | bigint    | Toujours 1 (une seule ligne)              |
| maintenance_mode     | boolean   | true = maintenance activée                 |
| maintenance_message  | text      | Message affiché aux visiteurs              |
| updated_at           | timestamp | Date de dernière modification              |
| updated_by           | text      | Email de l'admin qui a modifié             |

### Fonctions SQL

**`get_maintenance_status()`**
- Accessible à tous (publique)
- Retourne l'état actuel du mode maintenance

**`toggle_maintenance_mode(new_status, new_message, admin_email)`**
- Réservée aux admins
- Active/désactive le mode maintenance
- Enregistre qui a fait la modification

---

## 🎨 Personnalisation

### Modifier l'apparence de la page de maintenance

Éditez le fichier `src/app/maintenance/page.tsx` :

- **Logo** : Ligne 19-24
- **Icône** : Ligne 27-42
- **Titre** : Ligne 45-47
- **Message** : Ligne 50-54
- **Contact** : Ligne 64-92

### Modifier le message par défaut

Dans le SQL `supabase-maintenance-setup.sql`, ligne 18 :

```sql
maintenance_message TEXT DEFAULT 'Votre message personnalisé ici',
```

---

## ✅ Checklist finale

Avant de mettre en production, vérifiez que :

- [ ] Le script SQL a été exécuté dans Supabase
- [ ] La table `site_settings` existe et contient une ligne
- [ ] Les fonctions `get_maintenance_status()` et `toggle_maintenance_mode()` existent
- [ ] Le code a été commité et pushé
- [ ] Vercel a redéployé le site
- [ ] Le toggle s'affiche dans le dashboard admin
- [ ] Un test complet a été effectué (activation + désactivation)
- [ ] Les admins peuvent toujours accéder même en mode maintenance
- [ ] La page de maintenance s'affiche correctement

---

**Système de maintenance opérationnel ! 🎉**

Pour toute question ou problème, consultez les logs dans :
- Vercel Dashboard → Functions → Logs
- Supabase Dashboard → Logs

Bonne maintenance ! 🔧
