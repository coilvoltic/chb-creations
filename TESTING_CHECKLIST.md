# Checklist de Tests Pré-Production - CHB Créations

Ce document liste tous les tests à effectuer avant et après la mise en production du site.

## 🎯 Objectif

Vérifier que toutes les fonctionnalités critiques du site fonctionnent correctement en production, notamment :
- Le parcours de réservation complet (locations, achats, prestations)
- Les paiements Stripe en mode LIVE
- L'envoi d'emails avec PDF
- Le calcul des frais de livraison
- L'accès administrateur

---

## 📋 Tests à effectuer sur l'URL temporaire Vercel

Avant de basculer le DNS, testez sur votre URL Vercel (ex: `https://chb-creations.vercel.app`)

### ✅ Test 1 : Navigation générale (5 min)

- [ ] La page d'accueil se charge correctement
- [ ] Les images du carousel promotionnel s'affichent
- [ ] La navigation (navbar) fonctionne
- [ ] Le mega menu "Services" s'affiche correctement
- [ ] Les liens du footer fonctionnent
- [ ] Les breadcrumbs s'affichent sur les pages produits
- [ ] Le responsive fonctionne (mobile, tablette, desktop)

### ✅ Test 2 : Catalogue produits (10 min)

#### Locations
- [ ] Page `/services/locations/art-de-table` affiche les produits
- [ ] Page `/services/locations/trones` affiche les produits
- [ ] Page `/services/locations/deco-et-accessoires` affiche les produits
- [ ] Les images produits s'affichent (vérifier URLs Supabase Storage)
- [ ] Le filtrage/tri fonctionne (si implémenté)

#### Accessoires Personnalisés
- [ ] Page `/services/accessoires-personnalises/bendir` affiche les produits
- [ ] Page `/services/accessoires-personnalises/bougies` affiche les produits
- [ ] Page `/services/accessoires-personnalises/certificats-mariage` affiche les produits
- [ ] Page `/services/accessoires-personnalises/coussins` affiche les produits
- [ ] Page `/services/accessoires-personnalises/faire-parts` affiche les produits
- [ ] Page `/services/accessoires-personnalises/oeufs` affiche les produits
- [ ] Page `/services/accessoires-personnalises/tableaux` affiche les produits
- [ ] Page `/services/accessoires-personnalises/textile` affiche les produits

#### Henné
- [ ] Page `/services/prestations/henne-seul` affiche les prestations
- [ ] Page `/services/prestations/pack-henne` affiche les packs

### ✅ Test 3 : Page produit individuelle (10 min)

Choisissez un produit de chaque type et testez :

#### Produit Location (ex: art de table)
- [ ] Le carousel d'images fonctionne (flèches, dots)
- [ ] Le prix s'affiche correctement
- [ ] Les onglets Description/FAQ fonctionnent
- [ ] Le sélecteur d'options fonctionne (si applicable)
- [ ] Le calculateur de frais d'options se met à jour
- [ ] La checkbox "Installation" fonctionne (si applicable)
- [ ] L'alerte d'acompte affiche le bon montant
- [ ] L'alerte de caution s'affiche
- [ ] Le sélecteur de quantité fonctionne (limité par le stock)
- [ ] Le date range picker s'affiche
- [ ] Les dates indisponibles sont bloquées
- [ ] Le sélecteur d'heure de début/fin fonctionne
- [ ] Le bouton "Ajouter au panier" fonctionne

#### Produit Achat (ex: bougie personnalisée)
- [ ] Même vérifications que ci-dessus
- [ ] Les champs de personnalisation s'affichent
- [ ] Les champs de personnalisation sont obligatoires
- [ ] Pas de date picker (normal pour les achats)
- [ ] Pas de caution (normal pour les achats)

#### Produit Prestation (ex: henné)
- [ ] Même vérifications que ci-dessus
- [ ] Le date picker affiche un seul jour (pas de plage)
- [ ] Le sélecteur de créneau horaire s'affiche (Lunch/Afternoon/Evening)
- [ ] Quantité = nombre de personnes

### ✅ Test 4 : Panier (15 min)

#### Ajout au panier
- [ ] Ajouter un produit location
- [ ] Ajouter un produit achat
- [ ] Ajouter une prestation henné
- [ ] Le badge du panier (navbar) affiche le bon nombre d'articles
- [ ] L'icône panier est cliquable

#### Page panier `/panier`
- [ ] Les 3 articles s'affichent dans leurs catégories respectives
- [ ] Les images s'affichent
- [ ] Les dates/heures s'affichent correctement
- [ ] Les options sélectionnées s'affichent
- [ ] Les personnalisations s'affichent
- [ ] Le prix unitaire et total sont corrects
- [ ] Le bouton "Supprimer" fonctionne
- [ ] Le bouton "Modifier la quantité" fonctionne

#### Section Livraison (testez les 3 catégories)
**Location :**
- [ ] Sélecteur "Retrait en boutique" / "Livraison"
- [ ] En mode "Retrait", pas de champ adresse
- [ ] En mode "Livraison", l'autocomplete d'adresse fonctionne
- [ ] Taper une adresse affiche des suggestions
- [ ] Sélectionner une adresse calcule automatiquement les frais
- [ ] Les frais affichés = 70€ (base) + distance × 1€

**Achat :**
- [ ] Mêmes vérifications
- [ ] Les frais affichés = 15€ (base) + distance × 1€

**Prestation :**
- [ ] Mêmes vérifications
- [ ] Les frais affichés = 20€ (base) + distance × 1€

#### Récapitulatif financier
- [ ] Sous-total locations correct (produits + options + installation)
- [ ] Sous-total achats correct
- [ ] Sous-total prestations correct
- [ ] Frais de livraison corrects (par catégorie)
- [ ] **Acompte (50%)** = (total général) / 2
- [ ] **Caution (50%)** = (sous-total locations) / 2
- [ ] Total général correct
- [ ] Code promo fonctionne (si implémenté)

#### Formulaire client
- [ ] Champ Prénom requis
- [ ] Champ Nom requis
- [ ] Champ Email requis et validé (format email)
- [ ] Champ Téléphone requis
- [ ] Erreurs affichées si champs vides

#### Sélection paiement
- [ ] Radio button "Payer en boutique (espèces)"
- [ ] Radio button "Payer en ligne (carte bancaire)"
- [ ] La sélection change l'état du bouton

### ✅ Test 5 : Paiement en espèces (10 min)

- [ ] Remplir tous les champs du formulaire
- [ ] Choisir "Payer en boutique"
- [ ] Cliquer sur "Confirmer la réservation"
- [ ] Un loader s'affiche pendant la création
- [ ] Redirection vers `/panier/success`
- [ ] Le numéro de réservation s'affiche
- [ ] Le message de confirmation s'affiche
- [ ] Le panier est vidé (badge = 0)

#### Vérification email
- [ ] L'email est reçu sur l'adresse client (PAS volticthedev@gmail.com!)
- [ ] L'expéditeur est "CHB Créations"
- [ ] Le sujet contient le numéro de réservation
- [ ] Le corps de l'email est correct (HTML)
- [ ] Le PDF est attaché
- [ ] Le PDF contient tous les détails :
  - [ ] Numéro de réservation
  - [ ] Infos client
  - [ ] Liste des articles avec options
  - [ ] Dates et heures
  - [ ] Adresses de livraison
  - [ ] Frais de livraison
  - [ ] Acompte et caution
  - [ ] Total

#### Vérification base de données (Supabase)
- [ ] Une entrée dans `customer_orders` avec `order_number`
- [ ] Une entrée dans `rental_reservations` avec `reservation_status = 'PENDING'`
- [ ] Des entrées dans `rental_items` liées à la réservation
- [ ] Une entrée dans `purchase_reservations` (si applicable)
- [ ] Des entrées dans `purchase_items` (si applicable)
- [ ] Une entrée dans `prestation_reservations` (si applicable)
- [ ] Des entrées dans `prestation_items` (si applicable)
- [ ] Les options sont bien stockées dans le JSONB `options`
- [ ] Les personnalisations sont bien stockées dans le JSONB `personalizations`

### ✅ Test 6 : Paiement en ligne Stripe (20 min)

⚠️ **ATTENTION :** Ce test utilise de l'argent réel! Utilisez une carte de test Stripe ou une vraie carte.

#### Cartes de test Stripe (mode live - utilisez avec prudence)
Si Stripe est en mode test (pas recommandé en prod), utilisez :
- **Succès :** 4242 4242 4242 4242
- **Refus :** 4000 0000 0000 0002
- **3D Secure :** 4000 0027 6000 3184

#### Processus de paiement
- [ ] Remplir le formulaire client
- [ ] Choisir "Payer en ligne"
- [ ] Cliquer sur "Payer maintenant"
- [ ] Redirection vers Stripe Checkout
- [ ] La page Stripe affiche :
  - [ ] Logo/nom CHB Créations
  - [ ] Montant = acompte (50% du total)
  - [ ] Description claire
- [ ] Entrer les informations de carte
- [ ] Cliquer sur "Payer"
- [ ] Si 3D Secure : compléter la vérification
- [ ] Redirection vers `/panier/success` avec `?session_id=...`
- [ ] Le numéro de réservation s'affiche
- [ ] Le message de confirmation s'affiche

#### Vérification Stripe Dashboard
- [ ] Aller sur [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] Dans **Payments**, trouver le paiement
- [ ] Statut : "Succeeded"
- [ ] Montant : acompte (50%)
- [ ] Métadonnées contiennent les infos de réservation

#### Vérification webhook
- [ ] Dans **Developers → Webhooks**, cliquer sur votre endpoint
- [ ] Vérifier qu'un événement `checkout.session.completed` a été reçu
- [ ] Statut : "Success" (200)
- [ ] Pas d'erreur dans les logs

#### Vérification email
- [ ] Mêmes vérifications que pour le paiement espèces
- [ ] L'email confirme le paiement de l'acompte

#### Vérification base de données
- [ ] Réservation créée avec `reservation_status = 'CONFIRMED'`
- [ ] Toutes les tables renseignées correctement

### ✅ Test 7 : Administration (15 min)

#### Connexion admin
- [ ] Aller sur `/admin/login`
- [ ] Entrer les identifiants Supabase
- [ ] Connexion réussie
- [ ] Redirection vers `/admin/dashboard`

#### Dashboard
- [ ] Liste des réservations s'affiche
- [ ] Filtres par statut fonctionnent (Pending, Confirmed, Done, Cancelled)
- [ ] Filtres par type fonctionnent (Locations, Achats, Prestations)
- [ ] Recherche par numéro de réservation fonctionne
- [ ] Les informations affichées sont correctes :
  - [ ] Numéro de réservation
  - [ ] Nom client
  - [ ] Email client
  - [ ] Téléphone client
  - [ ] Date de réservation
  - [ ] Montant total
  - [ ] Statut

#### Détail d'une réservation
- [ ] Cliquer sur une réservation
- [ ] Redirection vers `/admin/reservations/[id]`
- [ ] Toutes les infos s'affichent :
  - [ ] Infos client
  - [ ] Liste des articles avec détails
  - [ ] Dates et heures
  - [ ] Options et personnalisations
  - [ ] Adresses de livraison
  - [ ] Frais de livraison
  - [ ] Acompte et caution
  - [ ] Total

#### Modification du statut
- [ ] Changer le statut (dropdown)
- [ ] Cliquer sur "Mettre à jour"
- [ ] Le statut est mis à jour dans la BDD
- [ ] Confirmation visuelle (toast/message)

#### Génération PDF
- [ ] Cliquer sur "Télécharger PDF"
- [ ] Le PDF se télécharge automatiquement
- [ ] Ouvrir le PDF et vérifier qu'il contient toutes les infos

#### Création de produit
- [ ] Cliquer sur "Nouveau produit"
- [ ] Redirection vers `/admin/products/new`
- [ ] Remplir tous les champs :
  - [ ] Nom
  - [ ] Slug (auto-généré)
  - [ ] Prix
  - [ ] Prix promo (optionnel)
  - [ ] Catégorie (dropdown)
  - [ ] Sous-catégorie (dropdown)
  - [ ] Stock
  - [ ] Description
  - [ ] Images (upload multiple)
  - [ ] Options (groupes d'options)
  - [ ] FAQ
  - [ ] Installation fees (optionnel)
  - [ ] Personnalisations (array)
  - [ ] En rupture de stock (checkbox)
- [ ] Upload 2-3 images
- [ ] Preview des images fonctionne
- [ ] Cliquer sur "Créer le produit"
- [ ] Le produit est créé dans la BDD
- [ ] Les images sont uploadées dans Supabase Storage
- [ ] Redirection vers le dashboard

#### Vérification du nouveau produit
- [ ] Aller sur la page de la catégorie
- [ ] Le nouveau produit s'affiche
- [ ] Les images s'affichent correctement
- [ ] Cliquer sur le produit
- [ ] Toutes les infos sont correctes

### ✅ Test 8 : Performance et SEO (10 min)

#### Test de vitesse
- [ ] Ouvrir [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Tester l'URL de production
- [ ] Score mobile > 70
- [ ] Score desktop > 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s

#### SEO
- [ ] Les balises `<title>` sont présentes et pertinentes
- [ ] Les balises `<meta description>` sont présentes
- [ ] Les images ont des attributs `alt`
- [ ] Le sitemap.xml existe (si implémenté)
- [ ] Le robots.txt existe (si implémenté)
- [ ] Les URLs sont SEO-friendly (pas de caractères spéciaux)

#### Responsive
- [ ] Tester sur mobile (Chrome DevTools)
- [ ] Tester sur tablette
- [ ] Tester sur desktop
- [ ] Aucun débordement horizontal
- [ ] Les textes sont lisibles sans zoom
- [ ] Les boutons sont facilement cliquables

### ✅ Test 9 : Sécurité (5 min)

- [ ] Le certificat SSL est valide (cadenas vert)
- [ ] HTTPS forcé (pas d'accès HTTP)
- [ ] Les clés secrètes ne sont PAS dans le code source (vérifier avec Grep)
- [ ] Les routes API ne renvoient pas d'erreurs sensibles
- [ ] L'accès admin nécessite une authentification
- [ ] Les utilisateurs non authentifiés ne peuvent pas créer de produits

### ✅ Test 10 : Gestion des erreurs (10 min)

#### Erreur 404
- [ ] Taper une URL inexistante (ex: `/page-qui-nexiste-pas`)
- [ ] Page 404 personnalisée s'affiche (si implémentée)
- [ ] Lien de retour à l'accueil fonctionne

#### Erreur réseau
- [ ] Couper le wifi
- [ ] Essayer de charger une page
- [ ] Message d'erreur approprié
- [ ] Rétablir le wifi
- [ ] La page se recharge correctement

#### Erreur Stripe
- [ ] Utiliser une carte refusée (4000 0000 0000 0002)
- [ ] Stripe affiche une erreur claire
- [ ] Retour au panier sans perte de données

#### Erreur base de données
- [ ] Simuler une erreur (ex: désactiver temporairement Supabase)
- [ ] Message d'erreur approprié (pas de stack trace exposée)

---

## 📊 Récapitulatif des tests

### Tests critiques (bloquants)
Ces tests DOIVENT passer avant de mettre en production :
- ✅ Paiement Stripe en mode LIVE
- ✅ Envoi d'emails aux vrais clients
- ✅ Calcul de livraison avec Google APIs
- ✅ Création de réservations dans la BDD
- ✅ Accès admin et génération de PDF

### Tests importants (à corriger rapidement)
Ces tests doivent passer mais peuvent être corrigés après la mise en prod :
- ✅ Performance (PageSpeed)
- ✅ SEO basique
- ✅ Responsive mobile

### Tests bonus (nice to have)
Ces tests sont optionnels mais améliorent l'expérience :
- ✅ Page 404 personnalisée
- ✅ Messages d'erreur friendly
- ✅ Animations et transitions

---

## 🛠️ En cas de problème

### Template de rapport de bug
```
**URL testée :**
**Navigateur :**
**Étape :**
**Comportement attendu :**
**Comportement observé :**
**Screenshot/Logs :**
```

### Logs à consulter
- **Vercel :** Dashboard → Functions → Logs
- **Stripe :** Dashboard → Developers → Logs
- **Supabase :** Dashboard → Logs
- **Resend :** Dashboard → Logs
- **Google Cloud :** Console → Logging

---

## ✅ Validation finale

Avant de basculer le DNS :
- [ ] Tous les tests critiques sont passés
- [ ] Les emails sont reçus aux bonnes adresses
- [ ] Les paiements Stripe fonctionnent en mode LIVE
- [ ] L'admin peut gérer les réservations
- [ ] Aucune erreur dans les logs de production

Après la bascule DNS :
- [ ] Refaire tous les tests sur le domaine principal
- [ ] Vérifier que l'ancien site est bien inaccessible (ou redirigé)
- [ ] Monitorer les logs pendant 24-48h

---

**Bon courage pour les tests ! 🧪**
