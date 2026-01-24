#!/bin/bash

# Script pour tester l'intégration Stripe en développement

echo "🚀 Démarrage du test Stripe pour CHB Créations"
echo ""

# Vérifier que Stripe CLI est installé
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI n'est pas installé."
    echo "📥 Installation avec Homebrew:"
    echo "   brew install stripe/stripe-cli/stripe"
    echo ""
    echo "📥 Ou téléchargement manuel:"
    echo "   curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_macos.tar.gz | tar xz"
    exit 1
fi

echo "✅ Stripe CLI détecté"
echo ""

# Vérifier si l'utilisateur est connecté
if ! stripe config --list &> /dev/null
then
    echo "🔐 Connexion à Stripe nécessaire..."
    stripe login
    echo ""
fi

echo "✅ Connecté à Stripe"
echo ""

# Vérifier que le serveur Next.js tourne
if ! curl -s http://localhost:3000 > /dev/null
then
    echo "⚠️  Le serveur Next.js ne semble pas tourner sur http://localhost:3000"
    echo "📝 Démarrez-le avec: npm run dev"
    echo ""
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

echo "📡 Démarrage de l'écoute des webhooks Stripe..."
echo ""
echo "⚡ Les événements webhook seront transférés vers http://localhost:3000/api/webhooks/stripe"
echo ""
echo "🔑 IMPORTANT: Copiez la 'webhook signing secret' (whsec_...) dans votre .env.local"
echo "   Ajoutez: STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx"
echo ""
echo "💳 Pour tester, utilisez la carte: 4242 4242 4242 4242"
echo "   Date: n'importe quelle date future"
echo "   CVC: n'importe quel code à 3 chiffres"
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Lancer l'écoute des webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
