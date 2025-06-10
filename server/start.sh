
#!/bin/bash

echo "🚀 Démarrage du serveur ChatConnect Local..."
echo "📁 Répertoire: $(pwd)"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avec Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🌐 Démarrage du serveur sur le port 3002..."
echo "📡 Le service mDNS sera publié automatiquement"
echo "🛑 Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur
npm start
