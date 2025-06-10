
import { useState, useEffect, useCallback } from 'react';

export interface LocalPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: string;
  isLocal: boolean;
}

export interface LocalDevice {
  name: string;
  ip: string;
  port: number;
}

export interface LocalPeersData {
  localDevice: LocalDevice;
  peers: LocalPeer[];
  count: number;
}

export const useLocalPeers = (enabled: boolean = true, refreshInterval: number = 5000) => {
  const [peersData, setPeersData] = useState<LocalPeersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(false);

  const fetchPeers = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3002/peers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout après 3 secondes
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LocalPeersData = await response.json();
      setPeersData(data);
      setIsServerAvailable(true);
      
      console.log(`🔍 Found ${data.count} local peers:`, data.peers);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsServerAvailable(false);
      setPeersData(null);
      
      if (!errorMessage.includes('fetch')) {
        console.warn('⚠️ Local server not available:', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Effet pour fetch périodique
  useEffect(() => {
    if (!enabled) {
      setPeersData(null);
      setError(null);
      setIsServerAvailable(false);
      return;
    }

    // Fetch initial
    fetchPeers();

    // Fetch périodique
    const interval = setInterval(fetchPeers, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPeers, refreshInterval, enabled]);

  const refreshPeers = useCallback(() => {
    fetchPeers();
  }, [fetchPeers]);

  return {
    localDevice: peersData?.localDevice || null,
    peers: peersData?.peers || [],
    count: peersData?.count || 0,
    isLoading,
    error,
    isServerAvailable,
    refreshPeers
  };
};
