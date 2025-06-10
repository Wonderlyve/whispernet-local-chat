
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Users, 
  Bell,
  Menu
} from 'lucide-react';

interface AppBarProps {
  username: string;
  connectionMode: 'online' | 'local';
  isConnected: boolean;
  userCount: number;
  unreadCount?: number;
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

const AppBar: React.FC<AppBarProps> = ({
  username,
  connectionMode,
  isConnected,
  userCount,
  unreadCount = 0,
  onMenuClick,
  onSettingsClick
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMenuClick}
            className="md:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white">ChatConnect</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{username}</span>
              <Badge 
                variant={isConnected ? 'default' : 'secondary'} 
                className="text-xs px-1.5 py-0.5"
              >
                {connectionMode === 'online' ? (
                  <><Wifi className="w-3 h-3 mr-1" /> En ligne</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> Local</>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User count */}
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{userCount}</span>
          </div>

          {/* Notifications */}
          {unreadCount > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 flex items-center justify-center text-xs px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </div>
          )}

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSettingsClick}
            className="p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-red-500/20 border-t border-red-500/30 px-4 py-2">
          <p className="text-xs text-red-300 text-center">
            Connexion perdue - Tentative de reconnexion...
          </p>
        </div>
      )}
    </div>
  );
};

export default AppBar;
