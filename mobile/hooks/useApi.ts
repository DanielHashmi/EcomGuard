import { useCallback } from 'react';
import { useEcomGuardStore } from '../store/useEcomGuardStore';
import { API_URL } from '../config/api';

let autoStreamPollTimer: ReturnType<typeof setInterval> | null = null;

export const useApi = () => {
  const {
    loadState,
    reset,
    setApiStatus,
    setConnected,
    setErrorMessage,
  } = useEcomGuardStore();

  const fetchState = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetch(`${API_URL}/api/state`);
      if (res.ok) {
        const snapshot = await res.json();
        loadState(snapshot);
        setApiStatus('online');
        setConnected(true);
      } else {
        setApiStatus('offline');
        setConnected(false);
        setErrorMessage(`HTTP Error ${res.status} when fetching ${API_URL}/api/state`);
      }
    } catch (e: any) {
      console.error('Failed to fetch initial state', e);
      setApiStatus('offline');
      setConnected(false);
      setErrorMessage(`Connection Error to ${API_URL}/api/state: ` + (e.message || String(e)));
    }
  }, [loadState, setApiStatus, setConnected, setErrorMessage]);

  const addReview = useCallback(async (text: string, rating: number, reviewer: string) => {
    try {
      await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, rating, reviewer })
      });
    } catch (e) {
      console.error('Add review failed', e);
    }
  }, []);

  const triggerInvestigation = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/agent/investigate`, { method: 'POST' });
    } catch (e) {
      console.error('Trigger investigation failed', e);
    }
  }, []);

  const approveAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_URL}/api/actions/${actionId}/approve`, { method: 'POST' });
    } catch (e) {
      console.error('Approve action failed', e);
    }
  }, []);

  const rejectAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_URL}/api/actions/${actionId}/reject`, { method: 'POST' });
    } catch (e) {
      console.error('Reject action failed', e);
    }
  }, []);

  const approveAllActions = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/actions/approve-all`, { method: 'POST' });
    } catch (e) {
      console.error('Approve all failed', e);
    }
  }, []);

  const executeActions = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/actions/execute`, { method: 'POST' });
    } catch (e) {
      console.error('Execute actions failed', e);
    }
  }, []);

  const resetSystem = useCallback(async () => {
    try {
      if (autoStreamPollTimer) {
        clearInterval(autoStreamPollTimer);
        autoStreamPollTimer = null;
      }
      await fetch(`${API_URL}/api/reset`, { method: 'POST' });
      reset();
    } catch (e) {
      console.error('Reset failed', e);
    }
  }, [reset]);

  const startAutoStream = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/auto-stream`, { method: 'POST' });
      if (res.ok) {
          setErrorMessage(null);
          fetchState();

          if (autoStreamPollTimer) {
            clearInterval(autoStreamPollTimer);
          }

          let pollCount = 0;
          autoStreamPollTimer = setInterval(() => {
            pollCount += 1;
            fetchState();

            if (pollCount >= 20) {
              if (autoStreamPollTimer) {
                clearInterval(autoStreamPollTimer);
                autoStreamPollTimer = null;
              }
            }
          }, 2500);
      } else {
          setErrorMessage(`Auto-Stream HTTP Error: ${res.status}`);
      }
    } catch (e: any) {
      console.error('Start stream failed', e);
      setConnected(false);
      setErrorMessage(`Auto-Stream Connection Error to ${API_URL}/api/reviews/auto-stream: ` + (e.message || String(e)));
    }
  }, [fetchState, setConnected, setErrorMessage]);

  return {
    API_URL,
    fetchState,
    addReview,
    triggerInvestigation,
    approveAction,
    rejectAction,
    approveAllActions,
    executeActions,
    resetSystem,
    startAutoStream,
  };
};
