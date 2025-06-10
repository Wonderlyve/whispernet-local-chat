
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
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const maxRetries = 5;

  const testServerConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing server connectivity...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3002/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server connectivity test successful:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('❌ Server connectivity test failed:', error);
      return false;
    }
  }, []);

  const fetchPeers = useCallback(async () => {
    if (!enabled) return;

    // Si on a trop de tentatives consécutives échouées, tester d'abord la connectivité
    if (retryCount >= 3 && !isServerAvailable) {
      const isConnected = await testServerConnectivity();
      if (!isConnected) {
        console.log('🔄 Server still not available after connectivity test');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout plus long

      console.log('📡 Fetching peers from server...');
      const response = await fetch('http://localhost:3002/peers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LocalPeersData = await response.json();
      setPeersData(data);
      setIsServerAvailable(true);
      setRetryCount(0);
      setLastSuccessfulFetch(new Date());
      
      console.log(`✅ Successfully fetched ${data.count} local peers:`, data.peers);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsServerAvailable(false);
      setPeersData(null);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < maxRetries) {
        console.warn(`⚠️ Local server not available (attempt ${retryCount + 1}/${maxRetries}):`, errorMessage);
      } else {
        console.error('❌ Local server unavailable after multiple attempts. Please start the Node.js server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, retryCount, isServerAvailable, testServerConnectivity]);

  // Effet pour fetch périodique
  useEffect(() => {
    if (!enabled) {
      setPeersData(null);
      setError(null);
      setIsServerAvailable(false);
      setRetryCount(0);
      setLastSuccessfulFetch(null);
      return;
    }

    // Fetch initial
    fetchPeers();

    // Fetch périodique avec intervalle adaptatif
    const actualInterval = retryCount >= maxRetries && !isServerAvailable 
      ? refreshInterval * 6 // Réduire la fréquence si le serveur n'est pas disponible
      : refreshInterval;

    const interval = setInterval(fetchPeers, actualInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPeers, refreshInterval, retryCount, isServerAvailable, enabled]);

  const refreshPeers = useCallback(() => {
    console.log('🔄 Manual refresh requested');
    setRetryCount(0);
    setError(null);
    fetchPeers();
  }, [fetchPeers]);

  // Diagnostics pour debug
  const diagnostics = {
    lastSuccessfulFetch,
    retryCount,
    serverAvailable: isServerAvailable,
    timeSinceLastSuccess: lastSuccessfulFetch ? Date.now() - lastSuccessfulFetch.getTime() : null
  };

  return {
    localDevice: peersData?.localDevice || null,
    peers: peersData?.peers || [],
    count: peersData?.count || 0,
    isLoading,
    error,
    isServerAvailable,
    refreshPeers,
    retryCount,
    diagnostics
  };
};
