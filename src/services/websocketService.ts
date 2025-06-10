
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'call-start' | 'call-end';
}

export interface ConnectedUser {
  id: string;
  username: string;
  isOnline: boolean;
  isLocal?: boolean;
  lastSeen?: Date;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  
  private onMessageCallback?: (message: ChatMessage) => void;
  private onUserJoinCallback?: (user: ConnectedUser) => void;
  private onUserLeaveCallback?: (userId: string) => void;
  private onUsersUpdateCallback?: (users: ConnectedUser[]) => void;
  private onConnectionStatusCallback?: (connected: boolean) => void;

  constructor(private serverUrl: string) {}

  connect(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // En mode local, simuler une connexion
        if (this.serverUrl.includes('localhost') || this.serverUrl.includes('local')) {
          this.simulateLocalConnection(username);
          resolve();
          return;
        }

        this.socket = new WebSocket(this.serverUrl);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Envoyer les informations d'authentification
          this.sendMessage({
            type: 'join',
            username,
            timestamp: new Date()
          });

          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(true);
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(false);
          }
          this.attemptReconnect(username);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private simulateLocalConnection(username: string) {
    console.log('Simulating local WebSocket connection');
    
    if (this.onConnectionStatusCallback) {
      this.onConnectionStatusCallback(true);
    }

    // Simuler des utilisateurs connectés
    setTimeout(() => {
      const users: ConnectedUser[] = [
        { id: '1', username: 'Alice-Local', isOnline: true, isLocal: true },
        { id: '2', username: 'Bob-Local', isOnline: true, isLocal: true },
        { id: '3', username: 'Charlie-Remote', isOnline: true, isLocal: false }
      ];
      
      if (this.onUsersUpdateCallback) {
        this.onUsersUpdateCallback(users);
      }
    }, 1000);

    // Simuler un message de bienvenue
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        userId: 'system',
        username: 'Système',
        content: `Bienvenue ${username}! Vous êtes connecté en mode local.`,
        timestamp: new Date(),
        type: 'system'
      };
      
      if (this.onMessageCallback) {
        this.onMessageCallback(welcomeMessage);
      }
    }, 1500);
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'message':
        if (this.onMessageCallback) {
          this.onMessageCallback(data.message);
        }
        break;
      
      case 'user-joined':
        if (this.onUserJoinCallback) {
          this.onUserJoinCallback(data.user);
        }
        break;
      
      case 'user-left':
        if (this.onUserLeaveCallback) {
          this.onUserLeaveCallback(data.userId);
        }
        break;
      
      case 'users-update':
        if (this.onUsersUpdateCallback) {
          this.onUsersUpdateCallback(data.users);
        }
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  sendChatMessage(content: string, username: string) {
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: 'me',
      username,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'chat-message',
        message
      });
    } else {
      // Mode local - simuler l'envoi
      console.log('Sending message in local mode:', content);
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
      
      // Simuler une réponse
      setTimeout(() => {
        const response: ChatMessage = {
          id: (Date.now() + 1).toString(),
          userId: '1',
          username: 'Alice-Local',
          content: 'Message reçu en mode local!',
          timestamp: new Date(),
          type: 'text'
        };
        
        if (this.onMessageCallback) {
          this.onMessageCallback(response);
        }
      }, 1000);
    }
  }

  private sendMessage(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  private attemptReconnect(username: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(username);
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.onMessageCallback = callback;
  }

  onUserJoin(callback: (user: ConnectedUser) => void) {
    this.onUserJoinCallback = callback;
  }

  onUserLeave(callback: (userId: string) => void) {
    this.onUserLeaveCallback = callback;
  }

  onUsersUpdate(callback: (users: ConnectedUser[]) => void) {
    this.onUsersUpdateCallback = callback;
  }

  onConnectionStatus(callback: (connected: boolean) => void) {
    this.onConnectionStatusCallback = callback;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
