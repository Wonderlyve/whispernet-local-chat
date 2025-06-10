
# Démarrage du Serveur ChatConnect Local

## Prérequis
- Node.js (version 14 ou plus récente)
- npm (installé avec Node.js)

## Démarrage Rapide

### Option 1: Script automatique (Linux/Mac)
```bash
cd server
chmod +x start.sh
./start.sh
```

### Option 2: Commandes manuelles
```bash
cd server
npm install
npm start
```

### Option 3: Mode développement (avec redémarrage automatique)
```bash
cd server
npm install
npm run dev
```

## Vérification du fonctionnement

Une fois le serveur démarré, vous devriez voir :
- ✅ Le serveur démarre sur le port 3002
- 📡 Le service mDNS est publié
- 🌐 Les endpoints API sont disponibles

Dans l'application React, le badge "Serveur local indisponible" devrait passer à "🟢 X pair(s) local".

## Troubleshooting

### Le serveur ne démarre pas
- Vérifiez que le port 3002 n'est pas utilisé par une autre application
- Assurez-vous d'avoir les permissions pour écouter sur le port
- Vérifiez les logs d'erreur dans la console

### L'application ne détecte pas le serveur
- Vérifiez que le serveur tourne bien sur `http://localhost:3002`
- Testez l'endpoint manually: `curl http://localhost:3002/status`
- Vérifiez que votre firewall n'bloque pas la connexion

### Pas de pairs détectés
- Assurez-vous que d'autres appareils sur le même réseau exécutent l'application
- Le protocole mDNS peut prendre quelques secondes pour découvrir les pairs
- Certains réseaux d'entreprise bloquent mDNS

## Architecture

Le serveur local utilise :
- **Express.js** pour l'API REST
- **Bonjour** pour la découverte mDNS
- **CORS** pour autoriser les requêtes cross-origin

Endpoints disponibles :
- `GET /peers` - Liste des pairs découverts
- `GET /status` - Statut du serveur
- `POST /signal` - Messages de signaling WebRTC
- `GET /signal/:peerId` - Récupération des messages
