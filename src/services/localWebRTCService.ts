
import SimplePeer from 'simple-peer';

export interface LocalWebRTCConnection {
  id: string;
  peerId: string;
  peerName: string;
  peer: SimplePeer.Instance;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isInitiator: boolean;
  messages: Array<{
    id: string;
    text: string;
    timestamp: Date;
    isOwn: boolean;
  }>;
}

export class LocalWebRTCService {
  private connections = new Map<string, LocalWebRTCConnection>();
  private localPeerId: string;
  private onConnectionCallback?: (connection: LocalWebRTCConnection) => void;
  private onMessageCallback?: (peerId: string, message: string) => void;
  private onDisconnectCallback?: (peerId: string) => void;

  constructor(localPeerId: string) {
    this.localPeerId = localPeerId;
  }

  // Initier une connexion avec un pair
  async initiateConnection(peerId: string, peerName: string): Promise<LocalWebRTCConnection> {
    try {
      console.log(`🤝 Initiating connection to ${peerName} (${peerId})`);

      const peer = new SimplePeer({
        initiator: true,
        trickle: false, // Attendre que tous les candidats ICE soient collectés
        config: {
          iceServers: [] // Pas de serveur STUN/TURN pour le local
        }
      });

      const connection: LocalWebRTCConnection = {
        id: `${this.localPeerId}-${peerId}`,
        peerId,
        peerName,
        peer,
        status: 'connecting',
        isInitiator: true,
        messages: []
      };

      this.setupPeerEvents(connection);
      this.connections.set(peerId, connection);

      // Gérer la génération de l'offre
      peer.on('signal', async (data) => {
        try {
          await this.sendSignalingMessage(peerId, 'offer', data);
        } catch (error) {
          console.error('Error sending offer:', error);
          connection.status = 'error';
        }
      });

      // Écouter les réponses
      this.startListeningForSignals(connection);

      return connection;
    } catch (error) {
      console.error('Error initiating connection:', error);
      throw error;
    }
  }

  // Accepter une connexion entrante
  async acceptConnection(peerId: string, peerName: string, offerData: any): Promise<LocalWebRTCConnection> {
    try {
      console.log(`📞 Accepting connection from ${peerName} (${peerId})`);

      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: []
        }
      });

      const connection: LocalWebRTCConnection = {
        id: `${peerId}-${this.localPeerId}`,
        peerId,
        peerName,
        peer,
        status: 'connecting',
        isInitiator: false,
        messages: []
      };

      this.setupPeerEvents(connection);
      this.connections.set(peerId, connection);

      // Gérer la génération de la réponse
      peer.on('signal', async (data) => {
        try {
          await this.sendSignalingMessage(peerId, 'answer', data);
        } catch (error) {
          console.error('Error sending answer:', error);
          connection.status = 'error';
        }
      });

      // Traiter l'offre
      peer.signal(offerData);

      return connection;
    } catch (error) {
      console.error('Error accepting connection:', error);
      throw error;
    }
  }

  // Configurer les événements du peer
  private setupPeerEvents(connection: LocalWebRTCConnection) {
    const { peer, peerId, peerName } = connection;

    peer.on('connect', () => {
      console.log(`✅ Connected to ${peerName}`);
      connection.status = 'connected';
      if (this.onConnectionCallback) {
        this.onConnectionCallback(connection);
      }
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`💬 Message from ${peerName}:`, message.text);
        
        const messageObj = {
          id: message.id || Date.now().toString(),
          text: message.text,
          timestamp: new Date(message.timestamp || Date.now()),
          isOwn: false
        };
        
        connection.messages.push(messageObj);
        
        if (this.onMessageCallback) {
          this.onMessageCallback(peerId, message.text);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    peer.on('error', (error) => {
      console.error(`❌ Connection error with ${peerName}:`, error);
      connection.status = 'error';
    });

    peer.on('close', () => {
      console.log(`🔌 Connection closed with ${peerName}`);
      connection.status = 'disconnected';
      this.connections.delete(peerId);
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback(peerId);
      }
    });
  }

  // Envoyer un message de signaling via HTTP
  private async sendSignalingMessage(toPeerId: string, type: string, data: any) {
    try {
      const response = await fetch('http://localhost:3002/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.localPeerId,
          to: toPeerId,
          type,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send signaling message: ${response.status}`);
      }

      console.log(`📡 Sent ${type} to ${toPeerId}`);
    } catch (error) {
      console.error('Error sending signaling message:', error);
      throw error;
    }
  }

  // Écouter les messages de signaling
  private startListeningForSignals(connection: LocalWebRTCConnection) {
    const checkForSignals = async () => {
      try {
        const response = await fetch(`http://localhost:3002/signal/${this.localPeerId}`);
        if (!response.ok) return;

        const { messages } = await response.json();
        
        for (const message of messages) {
          if (message.from === connection.peerId) {
            console.log(`📡 Received ${message.type} from ${connection.peerName}`);
            
            if (message.type === 'answer' && connection.isInitiator) {
              connection.peer.signal(message.data);
            } else if (message.type === 'offer' && !connection.isInitiator) {
              connection.peer.signal(message.data);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for signals:', error);
      }
    };

    // Vérifier les signaux toutes les 2 secondes pendant la connexion
    const interval = setInterval(() => {
      if (connection.status === 'connected' || connection.status === 'disconnected') {
        clearInterval(interval);
        return;
      }
      checkForSignals();
    }, 2000);

    // Timeout après 30 secondes
    setTimeout(() => {
      if (connection.status === 'connecting') {
        clearInterval(interval);
        connection.status = 'error';
        console.error(`⏰ Connection timeout with ${connection.peerName}`);
      }
    }, 30000);
  }

  // Envoyer un message texte
  sendMessage(peerId: string, text: string): boolean {
    const connection = this.connections.get(peerId);
    if (!connection || connection.status !== 'connected') {
      console.error(`Cannot send message: no active connection to ${peerId}`);
      return false;
    }

    try {
      const message = {
        id: Date.now().toString(),
        text,
        timestamp: new Date().toISOString()
      };

      connection.peer.send(JSON.stringify(message));
      
      // Ajouter à l'historique local
      connection.messages.push({
        ...message,
        timestamp: new Date(message.timestamp),
        isOwn: true
      });

      console.log(`📤 Sent message to ${connection.peerName}: ${text}`);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Fermer une connexion
  closeConnection(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.connections.delete(peerId);
      console.log(`🔌 Closed connection to ${connection.peerName}`);
    }
  }

  // Fermer toutes les connexions
  closeAllConnections() {
    for (const [peerId] of this.connections) {
      this.closeConnection(peerId);
    }
  }

  // Getters
  getConnection(peerId: string): LocalWebRTCConnection | undefined {
    return this.connections.get(peerId);
  }

  getAllConnections(): LocalWebRTCConnection[] {
    return Array.from(this.connections.values());
  }

  getActiveConnectionsCount(): number {
    return Array.from(this.connections.values()).filter(c => c.status === 'connected').length;
  }

  // Event handlers
  onConnection(callback: (connection: LocalWebRTCConnection) => void) {
    this.onConnectionCallback = callback;
  }

  onMessage(callback: (peerId: string, message: string) => void) {
    this.onMessageCallback = callback;
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback;
  }
}
