
import { useState, useEffect, useRef } from 'react';

interface DiscoveredDevice {
  id: string;
  username: string;
  ip: string;
  isLocal: boolean;
}

export const useNetworkDiscovery = (username: string, enabled: boolean) => {
  const [localDevices, setLocalDevices] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const broadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour obtenir l'IP locale approximative
  const getLocalIP = async (): Promise<string> => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && !ipMatch[1].startsWith('169.254')) {
            pc.close();
            resolve(ipMatch[1]);
          }
        }
      };
      
      // Fallback après 3 secondes
      setTimeout(() => {
        pc.close();
        resolve('192.168.1.100'); // IP par défaut
      }, 3000);
    });
  };

  // Simulation de la découverte réseau local via broadcast UDP
  const startNetworkDiscovery = async () => {
    if (!enabled || !username) return;
    
    setIsScanning(true);
    const localIP = await getLocalIP();
    const networkBase = localIP.substring(0, localIP.lastIndexOf('.'));
    
    console.log(`Scanning network ${networkBase}.x for devices...`);
    
    // Simuler la découverte d'appareils locaux
    const simulatedDevices: DiscoveredDevice[] = [
      {
        id: 'local-1',
        username: 'Device-Alice',
        ip: `${networkBase}.101`,
        isLocal: true
      },
      {
        id: 'local-2', 
        username: 'Device-Bob',
        ip: `${networkBase}.102`,
        isLocal: true
      }
    ];

    // Ajouter progressivement les appareils découverts
    simulatedDevices.forEach((device, index) => {
      setTimeout(() => {
        setLocalDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (!exists) {
            console.log(`Discovered local device: ${device.username} at ${device.ip}`);
            return [...prev, device];
          }
          return prev;
        });
      }, (index + 1) * 1000);
    });

    setIsScanning(false);
  };

  // Broadcast de présence pour les autres appareils
  const startPresenceBroadcast = () => {
    if (!enabled || !username) return;
    
    const broadcast = () => {
      console.log(`Broadcasting presence as ${username}...`);
      // En réalité, ceci enverrait un paquet UDP broadcast
    };
    
    broadcast(); // Broadcast initial
    broadcastIntervalRef.current = setInterval(broadcast, 10000); // Toutes les 10 secondes
  };

  // Scan périodique du réseau
  const startPeriodicScan = () => {
    if (!enabled) return;
    
    scanIntervalRef.current = setInterval(() => {
      startNetworkDiscovery();
    }, 30000); // Scan toutes les 30 secondes
  };

  useEffect(() => {
    if (enabled && username) {
      startNetworkDiscovery();
      startPresenceBroadcast();
      startPeriodicScan();
    } else {
      setLocalDevices([]);
      setIsScanning(false);
    }

    return () => {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [enabled, username]);

  const refreshScan = () => {
    setLocalDevices([]);
    startNetworkDiscovery();
  };

  return {
    localDevices,
    isScanning,
    refreshScan
  };
};
