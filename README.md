
# ChatConnect - Application de Chat et Appels en Temps Réel

Une application React moderne de chat et d'appels audio/vidéo avec support des modes en ligne et hors ligne.

## 🚀 Fonctionnalités

- **Chat en temps réel** avec WebSocket
- **Appels audio/vidéo** avec WebRTC
- **Mode en ligne** : communication via serveur distant
- **Mode local** : détection et communication peer-to-peer sur le même réseau Wi-Fi
- **Interface responsive** avec design moderne
- **Chiffrement des flux** WebRTC (SRTP)
- **WebSockets sécurisés**

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le design responsive
- **Shadcn/UI** pour les composants
- **WebRTC** pour les appels audio/vidéo
- **WebSocket/Socket.IO** pour le chat en temps réel

### Backend (à implémenter)
- **Node.js** avec Express
- **Socket.IO** pour la signalisation
- **mDNS/UDP broadcast** pour la découverte locale

## 🎨 Design

L'interface s'inspire des applications de communication modernes comme Discord avec :
- Palette de couleurs sombres avec accents bleus/violets
- Sidebar pour la liste des utilisateurs
- Interface de chat responsive
- Contrôles d'appels intuitifs
- Animations fluides et micro-interactions

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ et npm
- Navigateur moderne supportant WebRTC

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd chatconnect
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer en mode développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

### Production

1. **Construire l'application**
```bash
npm run build
```

2. **Servir les fichiers statiques**
```bash
npm run preview
```

## 📱 Utilisation

### Connexion
1. Entrez votre nom d'utilisateur
2. Choisissez le mode de connexion :
   - **En ligne** : via serveur distant
   - **Local** : réseau Wi-Fi local
3. Cliquez sur "Se connecter"

### Chat
- Tapez votre message dans la zone de saisie
- Appuyez sur Entrée ou cliquez sur le bouton d'envoi
- Les messages s'affichent en temps réel

### Appels
- Cliquez sur l'icône 📞 pour un appel audio
- Cliquez sur l'icône 📹 pour un appel vidéo
- Utilisez les contrôles pour couper/rétablir le micro/caméra
- Raccrochez avec le bouton rouge

## 🔧 Configuration Avancée

### Variables d'Environnement
Créez un fichier `.env.local` pour la configuration :

```env
VITE_WEBSOCKET_URL=ws://localhost:3001
VITE_STUN_SERVERS=stun:stun.l.google.com:19302
VITE_TURN_SERVERS=turn:your-turn-server.com:3478
```

### Serveurs STUN/TURN
Pour les appels WebRTC en production, configurez des serveurs STUN/TURN :
- **STUN** : pour la découverte d'adresses IP publiques
- **TURN** : pour relayer le trafic à travers les firewalls

## 🔒 Sécurité

### Chiffrement WebRTC
- Les flux audio/vidéo utilisent SRTP automatiquement
- Les métadonnées sont chiffrées avec DTLS

### WebSockets Sécurisés
- Utilisation de WSS en production
- Authentification des utilisateurs
- Validation des messages côté serveur

## 🌐 Architecture

### Mode En Ligne
```
Client ←→ WebSocket Server ←→ Client
     ↓                    ↓
   WebRTC Signaling
     ↓                    ↓
Client ←→ Direct P2P ←→ Client
```

### Mode Local
```
Client ←→ mDNS/UDP Broadcast ←→ Client
     ↓                        ↓
   Direct WebRTC Connection
     ↓                        ↓
Client ←→ Direct P2P ←→ Client
```

## 📊 État Actuel

✅ **Implémenté :**
- Interface utilisateur complète
- Simulation du chat et des appels
- Design responsive
- Gestion des états de connexion

🚧 **À implémenter :**
- Backend Node.js avec Socket.IO
- WebRTC signaling complet
- Découverte mDNS/UDP broadcast
- Serveurs STUN/TURN
- Chiffrement avancé

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Contactez l'équipe de développement

---

**ChatConnect** - Communication en temps réel, partout et en toute sécurité 🚀
