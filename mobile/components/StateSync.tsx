import { useEffect } from 'react';
import { API_URL } from '../config/api';
import { useEcomGuardStore } from '../store/useEcomGuardStore';

/**
 * StateSync component — polls /api/state every 3 seconds as a fallback
 * for when SSE is not working or for initial state load.
 * 
 * This is a background component that doesn't render anything.
 */
export default function StateSync() {
  const loadState = useEcomGuardStore(state => state.loadState);
  const setApiStatus = useEcomGuardStore(state => state.setApiStatus);
  const setConnected = useEcomGuardStore(state => state.setConnected);
  const setErrorMessage = useEcomGuardStore(state => state.setErrorMessage);

  useEffect(() => {
    let mounted = true;

    const syncState = async () => {
      console.log('[StateSync] Attempting to fetch from:', `${API_URL}/api/state`);
      try {
        const response = await fetch(`${API_URL}/api/state`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });

        console.log('[StateSync] Response status:', response.status);

        if (!mounted) return;

        if (!response.ok) {
          console.error('[StateSync] Response not OK:', response.status);
          setApiStatus('offline');
          setConnected(false);
          setErrorMessage(`API ${response.status}: ${API_URL}/api/state`);
          return;
        }

        const snapshot = await response.json();
        console.log('[StateSync] Successfully fetched state:', snapshot);
        console.log('[StateSync] Setting connected=true, apiStatus=online');
        setConnected(true);
        setApiStatus('online');
        setErrorMessage(null);
        loadState(snapshot);
        console.log('[StateSync] State loaded successfully');
      } catch (error: any) {
        console.error('[StateSync] Fetch error:', error.message, error);
        if (!mounted) return;
        setApiStatus('offline');
        setConnected(false);
        setErrorMessage(`API unreachable: ${API_URL}/api/state - ${error.message}`);
      }
    };

    // Initial sync
    syncState();

    // Poll every 3 seconds (reduced from 2s to avoid overlap with SSE)
    const interval = setInterval(syncState, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadState, setApiStatus, setConnected, setErrorMessage]);

  return null; // This component doesn't render anything
}
