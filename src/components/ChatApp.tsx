import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useNetworkDiscovery } from '@/hooks/useNetworkDiscovery';
import { useIsMobile } from '@/hooks/useIsMobile';
import { WebSocketService, ChatMessage, ConnectedUser } from '@/services/websocketService';
import { WebRTCService, WebRTCCall } from '@/services/webrtcService';
import AppBar from '@/components/mobile/AppBar';
import BottomNavBar from '@/components/mobile/BottomNavBar';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff,
  Send,
  Users,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw
} from 'lucide-react';
import LocalPeersPanel from '@/components/local/LocalPeersPanel';

const ChatApp = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'online' | 'local'>('online');
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeCall, setActiveCall] = useState<WebRTCCall | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'users' | 'calls' | 'settings'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webSocketServiceRef = useRef<WebSocketService | null>(null);
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Hook de découverte réseau local
  const { localDevices, isScanning, refreshScan } = useNetworkDiscovery(
    username, 
    connectionMode === 'local' && isConnected
  );

  // Initialiser les services
  useEffect(() => {
    const wsUrl = connectionMode === 'online' 
      ? 'ws://localhost:3001' 
      : 'ws://local';
      
    webSocketServiceRef.current = new WebSocketService(wsUrl);
    webRTCServiceRef.current = new WebRTCService();

    // Callbacks WebSocket
    webSocketServiceRef.current.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    webSocketServiceRef.current.onUsersUpdate((updatedUsers) => {
      setUsers(updatedUsers);
    });

    webSocketServiceRef.current.onConnectionStatus((connected) => {
      setIsConnected(connected);
      if (!connected) {
        toast({
          title: "Connexion perdue",
          description: "Tentative de reconnexion...",
          variant: "destructive"
        });
      }
    });

    // Callbacks WebRTC
    webRTCServiceRef.current.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    webRTCServiceRef.current.onCallEnd(() => {
      setActiveCall(null);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
    });

    return () => {
      webSocketServiceRef.current?.disconnect();
    };
  }, [connectionMode]);

  // Mettre à jour les utilisateurs avec les appareils locaux
  useEffect(() => {
    if (connectionMode === 'local') {
      const combinedUsers = [
        ...users.filter(u => !u.isLocal),
        ...localDevices.map(device => ({
          id: device.id,
          username: device.username,
          isOnline: true,
          isLocal: true
        }))
      ];
      setUsers(combinedUsers);
    }
  }, [localDevices, connectionMode]);

  const connect = async () => {
    if (!username.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom d'utilisateur",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await webSocketServiceRef.current?.connect(username);
      setIsConnected(true);
      toast({
        title: "Connexion établie",
        description: `Connecté en mode ${connectionMode}`,
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur",
        variant: "destructive"
      });
    }
  };

  const disconnect = () => {
    webSocketServiceRef.current?.disconnect();
    setIsConnected(false);
    setUsers([]);
    setMessages([]);
    setActiveCall(null);
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.endCall();
    }
    toast({
      title: "Déconnecté",
      description: "Vous avez été déconnecté du chat",
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    webSocketServiceRef.current?.sendChatMessage(newMessage, username);
    setNewMessage('');
  };

  const startCall = async (userId: string, type: 'audio' | 'video') => {
    try {
      if (!webRTCServiceRef.current) return;
      
      const call = await webRTCServiceRef.current.startCall(userId, type);
      setActiveCall({ ...call, status: 'active' });
      
      const localStream = webRTCServiceRef.current.getLocalStream();
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      
      toast({
        title: "Appel en cours",
        description: `Appel ${type} avec ${users.find(u => u.id === userId)?.username}`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'appel",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    webRTCServiceRef.current?.endCall();
    setActiveCall(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    webRTCServiceRef.current?.toggleAudio(newState);
    setIsAudioEnabled(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    webRTCServiceRef.current?.toggleVideo(newState);
    setIsVideoEnabled(newState);
  };

  // Interface de connexion
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ChatConnect
            </CardTitle>
            <p className="text-slate-400">Communication en temps réel</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && connect()}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Mode de connexion</label>
              <div className="flex gap-2">
                <Button
                  variant={connectionMode === 'online' ? 'default' : 'outline'}
                  onClick={() => setConnectionMode('online')}
                  className="flex-1"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  En ligne
                </Button>
                <Button
                  variant={connectionMode === 'local' ? 'default' : 'outline'}
                  onClick={() => setConnectionMode('local')}
                  className="flex-1"
                >
                  <WifiOff className="w-4 h-4 mr-2" />
                  Local
                </Button>
              </div>
            </div>
            
            <Button onClick={connect} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
        
        {/* Panel des pairs locaux même en mode déconnecté */}
        <LocalPeersPanel />
      </div>
    );
  }

  // Interface principale
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* App Bar Mobile */}
      {isMobile && (
        <AppBar
          username={username}
          connectionMode={connectionMode}
          isConnected={isConnected}
          userCount={users.length}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSettingsClick={() => setActiveTab('settings')}
        />
      )}
      
      <div className={`flex flex-1 ${isMobile ? 'pt-16 pb-20' : ''}`}>
        {/* Sidebar */}
        <div className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-40 w-80 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} pt-16`
            : 'w-80'
        } bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col`}>
          
          {/* Header Desktop */}
          {!isMobile && (
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">{username}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant={connectionMode === 'online' ? 'default' : 'secondary'}>
                      {connectionMode === 'online' ? (
                        <><Wifi className="w-3 h-3 mr-1" /> En ligne</>
                      ) : (
                        <><WifiOff className="w-3 h-3 mr-1" /> Local</>
                      )}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Utilisateurs ({users.length})</span>
              </div>
              
              {connectionMode === 'local' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshScan}
                  disabled={isScanning}
                  className="p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{user.username}</p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-slate-400">
                            {user.isLocal ? 'Local' : 'En ligne'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startCall(user.id, 'audio')}
                        className="w-8 h-8 p-0"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startCall(user.id, 'video')}
                        className="w-8 h-8 p-0"
                      >
                        <Video className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Overlay pour mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 pt-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Call Interface */}
          {activeCall && (
            <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">
                      Appel {activeCall.type} avec {users.find(u => u.id === activeCall.peerId)?.username}
                    </span>
                    <Badge variant="secondary">{activeCall.status}</Badge>
                  </div>
                </div>
                
                {!isMobile && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isAudioEnabled ? "default" : "destructive"}
                      onClick={toggleAudio}
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    
                    {activeCall.type === 'video' && (
                      <Button
                        size="sm"
                        variant={isVideoEnabled ? "default" : "destructive"}
                        onClick={toggleVideo}
                      >
                        {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    <Button size="sm" variant="destructive" onClick={endCall}>
                      <PhoneOff className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Video Area */}
              {activeCall.type === 'video' && (
                <div className="mt-4 flex gap-4 flex-wrap">
                  <div className="relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      className="w-48 h-36 bg-slate-700 rounded-lg object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Vous
                    </span>
                  </div>
                  <div className="relative">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      className="w-48 h-36 bg-slate-700 rounded-lg object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      {users.find(u => u.id === activeCall.peerId)?.username}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.userId === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${
                      message.type === 'system' 
                        ? 'bg-slate-700/50 text-slate-300 text-center p-2 rounded-lg text-sm' 
                        : message.userId === 'me'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-lg rounded-br-sm'
                          : 'bg-slate-700/50 text-white p-3 rounded-lg rounded-bl-sm'
                    }`}>
                      {message.type !== 'system' && (
                        <p className="text-xs opacity-75 mb-1">{message.username}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      {isMobile && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessages={0}
          activeCall={activeCall ? {
            isActive: true,
            isAudioEnabled,
            isVideoEnabled,
            type: activeCall.type
          } : undefined}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      )}
      
      {/* Panel des pairs locaux - toujours présent */}
      <LocalPeersPanel />
    </div>
  );
};

export default ChatApp;
