
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
  const maxRetries = 3;

  const fetchPeers = useCallback(async () => {
    if (!enabled) return;

    // Si on a déjà essayé plusieurs fois et que le serveur n'est pas disponible,
    // on augmente l'intervalle pour éviter le spam
    if (retryCount >= maxRetries && !isServerAvailable) {
      console.log('🔄 Serveur local non disponible - tentative réduite');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('http://localhost:3002/peers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      setRetryCount(0); // Reset retry count on success
      
      console.log(`🔍 Found ${data.count} local peers:`, data.peers);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsServerAvailable(false);
      setPeersData(null);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < maxRetries) {
        console.warn('⚠️ Local server not available, retrying...', errorMessage);
      } else {
        console.warn('⚠️ Local server definitively unavailable after multiple attempts');
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, retryCount, isServerAvailable]);

  // Effet pour fetch périodique avec gestion intelligente des tentatives
  useEffect(() => {
    if (!enabled) {
      setPeersData(null);
      setError(null);
      setIsServerAvailable(false);
      setRetryCount(0);
      return;
    }

    // Fetch initial
    fetchPeers();

    // Fetch périodique avec intervalle adaptatif
    const actualInterval = retryCount >= maxRetries && !isServerAvailable 
      ? refreshInterval * 4 // Augmenter l'intervalle si le serveur n'est pas disponible
      : refreshInterval;

    const interval = setInterval(fetchPeers, actualInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPeers, refreshInterval, retryCount, isServerAvailable, enabled]);

  const refreshPeers = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refresh
    fetchPeers();
  }, [fetchPeers]);

  return {
    localDevice: peersData?.localDevice || null,
    peers: peersData?.peers || [],
    count: peersData?.count || 0,
    isLoading,
    error,
    isServerAvailable,
    refreshPeers,
    retryCount
  };
};
