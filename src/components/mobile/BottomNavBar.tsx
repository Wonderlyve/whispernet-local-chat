
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  Phone, 
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'chat' | 'users' | 'calls' | 'settings';
  onTabChange: (tab: 'chat' | 'users' | 'calls' | 'settings') => void;
  unreadMessages?: number;
  activeCall?: {
    isActive: boolean;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    type: 'audio' | 'video';
  };
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onEndCall?: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  unreadMessages = 0,
  activeCall,
  onToggleAudio,
  onToggleVideo,
  onEndCall
}) => {
  // Si un appel est actif, afficher les contrôles d'appel
  if (activeCall?.isActive) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700">
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          {/* Contrôle audio */}
          <Button
            variant={activeCall.isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={onToggleAudio}
            className="rounded-full w-14 h-14"
          >
            {activeCall.isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>

          {/* Contrôle vidéo (si appel vidéo) */}
          {activeCall.type === 'video' && (
            <Button
              variant={activeCall.isVideoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={onToggleVideo}
              className="rounded-full w-14 h-14"
            >
              {activeCall.isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* Raccrocher */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full w-16 h-16"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    );
  }

  // Navigation normale
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Chat */}
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          onClick={() => onTabChange('chat')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 relative"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs">Chat</span>
          {unreadMessages > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs px-1"
            >
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </Badge>
          )}
        </Button>

        {/* Utilisateurs */}
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => onTabChange('users')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Contacts</span>
        </Button>

        {/* Appels */}
        <Button
          variant={activeTab === 'calls' ? 'default' : 'ghost'}
          onClick={() => onTabChange('calls')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Phone className="w-5 h-5" />
          <span className="text-xs">Appels</span>
        </Button>

        {/* Paramètres */}
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => onTabChange('settings')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Paramètres</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavBar;
