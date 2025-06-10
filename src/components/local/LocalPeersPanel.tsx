import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalPeers } from '@/hooks/useLocalPeers';
import { LocalWebRTCService, LocalWebRTCConnection } from '@/services/localWebRTCService';
import { MockLocalPeersService } from '@/services/mockLocalPeersService';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  MessageCircle, 
  Phone, 
  Video,
  RefreshCw,
  Send,
  X,
  Minimize2,
  Maximize2,
  Server,
  AlertTriangle
} from 'lucide-react';

const LocalPeersPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeConnection, setActiveConnection] = useState<LocalWebRTCConnection | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [webrtcService, setWebrtcService] = useState<LocalWebRTCService | null>(null);
  const [connections, setConnections] = useState<LocalWebRTCConnection[]>([]);
  const [showMockData, setShowMockData] = useState(false);
  const [mockService] = useState(() => MockLocalPeersService.getInstance());
  const [mockPeersData, setMockPeersData] = useState(mockService.getPeersData());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Utiliser le hook pour récupérer les pairs locaux (toujours en mode réel)
  const { 
    localDevice, 
    peers, 
    count, 
    isLoading, 
    isServerAvailable, 
    refreshPeers,
    retryCount,
    diagnostics 
  } = useLocalPeers(true, 3000);

  // Mettre à jour les données mock périodiquement si activé
  useEffect(() => {
    if (!showMockData) return;

    const interval = setInterval(() => {
      setMockPeersData(mockService.getPeersData());
    }, 5000);

    return () => clearInterval(interval);
  }, [showMockData, mockService]);

  // Données à utiliser selon le mode
  const currentLocalDevice = showMockData ? mockPeersData.localDevice : localDevice;
  const currentPeers = showMockData ? mockPeersData.peers : peers;
  const currentCount = showMockData ? mockPeersData.count : count;

  // Initialiser le service WebRTC
  useEffect(() => {
    if (currentLocalDevice && !webrtcService) {
      const deviceId = `${currentLocalDevice.name}-${currentLocalDevice.ip}`;
      const service = new LocalWebRTCService(deviceId);
      
      service.onConnection((connection) => {
        console.log('✅ New connection established:', connection.peerName);
        setConnections(prev => [...prev.filter(c => c.peerId !== connection.peerId), connection]);
      });
      
      service.onMessage((peerId, message) => {
        console.log('💬 Message received:', message);
        setConnections(prev => prev.map(c => c.peerId === peerId ? service.getConnection(peerId)! : c));
      });
      
      service.onDisconnect((peerId) => {
        console.log('🔌 Connection closed:', peerId);
        setConnections(prev => prev.filter(c => c.peerId !== peerId));
        if (activeConnection?.peerId === peerId) {
          setActiveConnection(null);
        }
      });
      
      setWebrtcService(service);
    }
  }, [currentLocalDevice, webrtcService, activeConnection]);

  // Auto-scroll des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConnection?.messages]);

  const handleConnectToPeer = async (peer: any) => {
    if (!webrtcService) return;
    
    try {
      console.log(`🤝 Connecting to ${peer.name}...`);
      const connection = await webrtcService.initiateConnection(peer.id, peer.name);
      setConnections(prev => [...prev.filter(c => c.peerId !== peer.id), connection]);
      setActiveConnection(connection);
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleSendMessage = () => {
    if (!webrtcService || !activeConnection || !newMessage.trim()) return;
    
    const success = webrtcService.sendMessage(activeConnection.peerId, newMessage);
    if (success) {
      setNewMessage('');
      // Mettre à jour la connexion avec le nouveau message
      const updatedConnection = webrtcService.getConnection(activeConnection.peerId);
      if (updatedConnection) {
        setActiveConnection(updatedConnection);
        setConnections(prev => prev.map(c => c.peerId === activeConnection.peerId ? updatedConnection : c));
      }
    }
  };

  const handleCloseConnection = (peerId: string) => {
    if (!webrtcService) return;
    
    webrtcService.closeConnection(peerId);
    setConnections(prev => prev.filter(c => c.peerId !== peerId));
    if (activeConnection?.peerId === peerId) {
      setActiveConnection(null);
    }
  };

  const handleRefresh = () => {
    if (showMockData) {
      mockService.refreshPeers();
      setMockPeersData(mockService.getPeersData());
    } else {
      refreshPeers();
    }
  };

  const toggleMockMode = () => {
    setShowMockData(!showMockData);
    console.log(`🔄 Switching to ${!showMockData ? 'mock' : 'real'} data mode`);
  };

  const getBadgeColor = () => {
    if (showMockData) return 'secondary';
    if (!isServerAvailable) return 'destructive';
    return currentCount > 0 ? 'default' : 'secondary';
  };

  const getBadgeText = () => {
    if (showMockData) return `🟡 ${currentCount} pair(s) simulé(s)`;
    if (!isServerAvailable) return '🔴 Serveur Node.js indisponible';
    return currentCount > 0 ? `🟢 ${currentCount} pair(s) local` : '🔴 Aucun pair local';
  };

  const getStatusMessage = () => {
    if (showMockData) return 'Mode simulation activé';
    if (!isServerAvailable) {
      return `Serveur non disponible (tentative ${retryCount}). Démarrez le serveur Node.js dans /server`;
    }
    if (currentCount === 0) {
      return 'Serveur disponible, aucun pair détecté';
    }
    return `Serveur connecté, ${currentCount} pair(s) trouvé(s)`;
  };

  // Interface compacte (badge cliquable)
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700 cursor-pointer hover:bg-slate-800/95 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-center gap-2" onClick={() => setIsExpanded(true)}>
              <Badge variant={getBadgeColor()} className="text-xs">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  getBadgeText()
                )}
              </Badge>
              
              {connections.filter(c => c.status === 'connected').length > 0 && (
                <Badge variant="default" className="text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {connections.filter(c => c.status === 'connected').length} connecté(s)
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface étendue
  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-h-96">
      <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              {isServerAvailable && !showMockData ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              Réseau Local
              {showMockData && <Badge variant="secondary" className="text-xs">Simulation</Badge>}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1 h-6 w-6"
                title="Actualiser"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="p-1 h-6 w-6"
                title="Réduire"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getBadgeColor()} className="text-xs">
              {getBadgeText()}
            </Badge>
            {currentLocalDevice && (
              <span className="text-xs text-slate-400">
                {currentLocalDevice.name} ({currentLocalDevice.ip})
              </span>
            )}
          </div>

          {/* Informations de statut */}
          <div className="flex items-center gap-2 p-2 bg-slate-700/30 rounded text-slate-300">
            <div className="flex-1">
              <span className="text-xs">{getStatusMessage()}</span>
              {diagnostics.lastSuccessfulFetch && !showMockData && (
                <div className="text-xs text-slate-500 mt-1">
                  Dernière connexion : {diagnostics.lastSuccessfulFetch.toLocaleTimeString()}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMockMode}
              className="text-xs h-6"
            >
              {showMockData ? 'Mode Réel' : 'Mode Démo'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Chat actif */}
          {activeConnection && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                      {activeConnection.peerName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white">{activeConnection.peerName}</span>
                  <Badge 
                    variant={activeConnection.status === 'connected' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activeConnection.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseConnection(activeConnection.peerId)}
                  className="p-1 h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Messages */}
              <ScrollArea className="h-24 mb-2">
                <div className="space-y-1">
                  {activeConnection.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`text-xs p-1 rounded ${
                        message.isOwn 
                          ? 'bg-blue-500/20 text-blue-300 ml-4' 
                          : 'bg-slate-600/50 text-slate-300 mr-4'
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input message */}
              <div className="flex gap-1">
                <Input
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="text-xs h-6 bg-slate-600/50 border-slate-500"
                  disabled={activeConnection.status !== 'connected'}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || activeConnection.status !== 'connected'}
                  className="h-6 w-6 p-0"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Liste des pairs */}
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {currentPeers.map((peer) => {
                const connection = connections.find(c => c.peerId === peer.id);
                const isConnected = connection?.status === 'connected';
                
                return (
                  <div 
                    key={peer.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          {peer.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white truncate">{peer.name}</p>
                        <p className="text-xs text-slate-400">{peer.ip}</p>
                      </div>
                      {isConnected && (
                        <Badge variant="default" className="text-xs">connecté</Badge>
                      )}
                      {showMockData && (
                        <Badge variant="secondary" className="text-xs">simulé</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {isConnected ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setActiveConnection(connection)}
                          className="w-6 h-6 p-0"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConnectToPeer(peer)}
                            className="w-6 h-6 p-0"
                            disabled={connection?.status === 'connecting'}
                          >
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-6 h-6 p-0"
                            disabled
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {currentPeers.length === 0 && isServerAvailable && !showMockData && (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">Aucun pair détecté</p>
                  <p className="text-xs text-slate-500">Assurez-vous que d'autres appareils exécutent l'application</p>
                </div>
              )}
              
              {!isServerAvailable && !showMockData && (
                <div className="text-center py-4">
                  <Server className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <p className="text-xs text-red-400">Serveur Node.js non disponible</p>
                  <p className="text-xs text-slate-500">
                    Exécutez: <code className="bg-slate-700 px-1 rounded">cd server && npm start</code>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={toggleMockMode}
                    >
                      Mode Démo
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={handleRefresh}
                    >
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalPeersPanel;
