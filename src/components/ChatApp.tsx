
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
  Settings
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  isLocal?: boolean;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface Call {
  id: string;
  from: string;
  to: string;
  type: 'audio' | 'video';
  status: 'incoming' | 'outgoing' | 'active' | 'ended';
}

const ChatApp = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'online' | 'local'>('online');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const { toast } = useToast();

  // Simulation WebSocket pour la démo
  useEffect(() => {
    if (isConnected && username) {
      // Simuler une connexion WebSocket
      const mockSocket = {
        send: (data: string) => {
          console.log('Sending:', data);
        },
        close: () => {
          console.log('Socket closed');
        }
      };
      
      socketRef.current = mockSocket as any;
      
      // Simuler des utilisateurs connectés
      setTimeout(() => {
        setUsers([
          { id: '1', username: 'Alice', isOnline: true },
          { id: '2', username: 'Bob', isOnline: true, isLocal: true },
          { id: '3', username: 'Charlie', isOnline: true }
        ]);
      }, 1000);

      // Message de bienvenue
      setMessages([
        {
          id: '1',
          userId: 'system',
          username: 'Système',
          content: `Bienvenue ${username}! Vous êtes connecté en mode ${connectionMode}.`,
          timestamp: new Date(),
          type: 'system'
        }
      ]);
    }
  }, [isConnected, username, connectionMode]);

  const connect = () => {
    if (!username.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom d'utilisateur",
        variant: "destructive"
      });
      return;
    }
    
    setIsConnected(true);
    toast({
      title: "Connexion établie",
      description: `Connecté en mode ${connectionMode}`,
    });
  };

  const disconnect = () => {
    setIsConnected(false);
    setUsers([]);
    setMessages([]);
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    toast({
      title: "Déconnecté",
      description: "Vous avez été déconnecté du chat",
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      userId: 'me',
      username: username,
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simuler une réponse
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        userId: '1',
        username: 'Alice',
        content: 'Message reçu!',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const startCall = async (userId: string, type: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      setLocalStream(stream);
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      
      const call: Call = {
        id: Date.now().toString(),
        from: username,
        to: userId,
        type,
        status: 'outgoing'
      };
      
      setActiveCall(call);
      
      toast({
        title: "Appel en cours",
        description: `Appel ${type} vers ${users.find(u => u.id === userId)?.username}`,
      });
      
      // Simuler acceptation après 2 secondes
      setTimeout(() => {
        setActiveCall(prev => prev ? {...prev, status: 'active'} : null);
        toast({
          title: "Appel accepté",
          description: "L'appel a été accepté",
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la caméra/microphone",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setActiveCall(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    
    toast({
      title: "Appel terminé",
      description: "L'appel a été terminé",
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col">
        {/* Header */}
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

        {/* Users List */}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Utilisateurs connectés ({users.length})</span>
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
                    Appel {activeCall.type} avec {users.find(u => u.id === activeCall.to)?.username}
                  </span>
                  <Badge variant="secondary">{activeCall.status}</Badge>
                </div>
              </div>
              
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
            </div>
            
            {/* Video Area */}
            {activeCall.type === 'video' && (
              <div className="mt-4 flex gap-4">
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
                    {users.find(u => u.id === activeCall.to)?.username}
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
  );
};

export default ChatApp;
