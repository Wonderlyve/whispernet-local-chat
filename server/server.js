
import express from 'express';
import cors from 'cors';
import bonjour from 'bonjour';
import os from 'os';

const app = express();
const PORT = 3002;

// Configuration CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Service Bonjour pour mDNS
const bonjourInstance = bonjour();
let discoveredPeers = new Map();
let signalingMessages = new Map(); // Stockage temporaire des messages de signaling

// Obtenir l'IP locale
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer les adresses loopback et non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();
const deviceName = os.hostname() || 'ChatConnect-Device';

console.log(`🌐 Local IP: ${localIP}`);
console.log(`📱 Device Name: ${deviceName}`);

// Publier notre service mDNS
const service = bonjourInstance.publish({
  name: deviceName,
  type: 'chat-peer',
  port: PORT,
  txt: {
    deviceName: deviceName,
    version: '1.0.0',
    ip: localIP
  }
});

console.log(`📡 Publishing mDNS service 'chat-peer' on ${localIP}:${PORT}`);

// Découvrir les autres services chat-peer
const browser = bonjourInstance.find({ type: 'chat-peer' });

browser.on('up', (service) => {
  const peerId = `${service.name}-${service.host}`;
  const peerInfo = {
    id: peerId,
    name: service.name,
    ip: service.addresses?.[0] || service.host,
    port: service.port,
    txt: service.txt || {},
    lastSeen: new Date().toISOString()
  };
  
  // Ne pas s'ajouter soi-même
  if (peerInfo.ip !== localIP) {
    discoveredPeers.set(peerId, peerInfo);
    console.log(`✅ Peer discovered: ${peerInfo.name} at ${peerInfo.ip}`);
  }
});

browser.on('down', (service) => {
  const peerId = `${service.name}-${service.host}`;
  if (discoveredPeers.has(peerId)) {
    discoveredPeers.delete(peerId);
    console.log(`❌ Peer disconnected: ${service.name}`);
  }
});

// Nettoyer les pairs obsolètes toutes les 30 secondes
setInterval(() => {
  const now = new Date();
  const timeout = 60000; // 1 minute timeout
  
  for (const [peerId, peer] of discoveredPeers.entries()) {
    const lastSeen = new Date(peer.lastSeen);
    if (now - lastSeen > timeout) {
      discoveredPeers.delete(peerId);
      console.log(`🗑️ Removed stale peer: ${peer.name}`);
    }
  }
}, 30000);

// Routes API

// GET /peers - Retourner la liste des pairs découverts
app.get('/peers', (req, res) => {
  const peers = Array.from(discoveredPeers.values()).map(peer => ({
    id: peer.id,
    name: peer.name,
    ip: peer.ip,
    port: peer.port,
    lastSeen: peer.lastSeen,
    isLocal: isLocalIP(peer.ip)
  }));
  
  res.json({
    localDevice: {
      name: deviceName,
      ip: localIP,
      port: PORT
    },
    peers: peers,
    count: peers.length
  });
});

// POST /signal - Échanger des messages de signaling WebRTC
app.post('/signal', (req, res) => {
  const { from, to, type, data } = req.body;
  
  if (!from || !to || !type) {
    return res.status(400).json({ error: 'Missing required fields: from, to, type' });
  }
  
  // Stocker le message pour le destinataire
  const messageId = `${Date.now()}-${Math.random()}`;
  const message = {
    id: messageId,
    from,
    to,
    type,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (!signalingMessages.has(to)) {
    signalingMessages.set(to, []);
  }
  
  signalingMessages.get(to).push(message);
  
  console.log(`📡 Signaling message from ${from} to ${to}: ${type}`);
  
  res.json({ success: true, messageId });
});

// GET /signal/:peerId - Récupérer les messages de signaling pour un pair
app.get('/signal/:peerId', (req, res) => {
  const peerId = req.params.peerId;
  const messages = signalingMessages.get(peerId) || [];
  
  // Vider les messages après les avoir récupérés
  signalingMessages.set(peerId, []);
  
  res.json({ messages });
});

// GET /status - Statut du serveur
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    localDevice: {
      name: deviceName,
      ip: localIP,
      port: PORT
    },
    peersCount: discoveredPeers.size,
    uptime: process.uptime()
  });
});

// Fonction utilitaire pour vérifier si une IP est locale
function isLocalIP(ip) {
  const localRanges = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^127\./,
    /^fe80:/i
  ];
  
  return localRanges.some(range => range.test(ip));
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  bonjourInstance.unpublishAll(() => {
    bonjourInstance.destroy();
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ChatConnect Local Server running on port ${PORT}`);
  console.log(`📡 mDNS service published as: ${deviceName}`);
  console.log(`🌐 API endpoints available at http://${localIP}:${PORT}`);
});
