
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

# Vérifier si le port 3002 est libre
if command -v lsof &> /dev/null; then
    if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Le port 3002 est déjà utilisé. Tentative d'arrêt du processus..."
        lsof -ti:3002 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
fi

echo ""
echo "🌐 Démarrage du serveur sur le port 3002..."
echo "📡 Le service mDNS sera publié automatiquement"
echo "🔗 Test: http://localhost:3002/test"
echo "📊 Status: http://localhost:3002/status"
echo "🛑 Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur
npm start
