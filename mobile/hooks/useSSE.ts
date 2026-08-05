import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useEcomGuardStore } from '../store/useEcomGuardStore';

/**
 * SSE hook that works on both web (native EventSource) and native (react-native-sse).
 * The SSE endpoint on the backend is at /events (no /api prefix).
 */
export const useSSE = (baseUrl: string) => {
  const {
    setConnected,
    setSseStatus,
    setAgentStatus,
    setErrorMessage,
    addReasoningEntry,
    addReview,
    updateReviewClassification,
    addContradiction,
    addProposedAction,
    setProposedActions,
    updateActionStatus,
    addExecutedAction,
    setOutcomeReport,
    reset,
  } = useEcomGuardStore();

  const esRef = useRef<any>(null);

  useEffect(() => {
    // The backend SSE is at /events (events.py has no prefix)
    const sseUrl = `${baseUrl}/events`;
    console.log(`[SSE] Connecting to: ${sseUrl}`);

    let es: any;

    const handleEvent = (eventType: string, rawData: string) => {
      if (!rawData) return;
      try {
        const data = JSON.parse(rawData);
        switch (eventType) {
          case 'connected':
            console.log('[SSE] Server confirmed connection');
            setSseStatus('online');
            setConnected(true);
            break;
          case 'agent_status':
            setAgentStatus(data.status);
            if (['investigating', 'awaiting_approval', 'resolved'].includes(data.status)) {
              setErrorMessage(null);
            }
            break;
          case 'investigation_started':
            setErrorMessage(null);
            setAgentStatus('investigating');
            break;
          case 'review_added':
            addReview(data);
            break;
          case 'review_classified':
            updateReviewClassification(data.review_id, data.label, data.reason);
            break;
          case 'reasoning':
            setErrorMessage(null);
            addReasoningEntry(data);
            break;
          case 'contradiction_found':
            addContradiction(data);
            break;
          case 'action_proposed':
            // Backend emits one event per action.
            setErrorMessage(null);
            addProposedAction(data);
            break;
          case 'actions_proposed':
            // Back-compat: a batch of actions.
            setErrorMessage(null);
            if (Array.isArray(data.actions)) setProposedActions(data.actions);
            break;
          case 'action_auto_approved':
            updateActionStatus(data.action_id, 'approved');
            break;
          case 'action_approved':
            updateActionStatus(data.action_id, 'approved');
            break;
          case 'action_rejected':
            updateActionStatus(data.action_id, 'rejected');
            break;
          case 'action_executing':
            updateActionStatus(data.action_id, 'executing');
            break;
          case 'action_complete':
            updateActionStatus(data.action_id, 'complete');
            addExecutedAction(data);
            break;
          case 'action_failed':
            if (!data.retrying) {
              updateActionStatus(data.action_id, 'escalated');
              addExecutedAction(data);
            }
            break;
          case 'action_escalated':
            updateActionStatus(data.action_id, 'escalated');
            addExecutedAction(data);
            break;
          case 'outcome_report':
            setOutcomeReport(data);
            break;
          case 'reset':
            console.log('[SSE] Server reset received');
            setErrorMessage(null);
            reset();
            break;
          case 'tool_used':
            // The backend also emits a paired `reasoning` entry for each read,
            // so nothing to do here (avoids a duplicate timeline row).
            break;
          case 'investigation_complete':
            // Informational; tools stream their own reasoning entries.
            break;
          case 'agent_error':
            setErrorMessage(data.message ? `${data.message}${data.detail ? ` (${data.detail})` : ''}` : 'Agent error');
            break;
        }
      } catch (err) {
        console.warn(`[SSE] Failed to parse event "${eventType}":`, err);
      }
    };

    const eventTypes = [
      'connected', 'agent_status', 'investigation_started', 'investigation_complete',
      'review_added', 'review_classified', 'reasoning', 'contradiction_found',
      'action_proposed', 'actions_proposed', 'action_auto_approved',
      'action_approved', 'action_rejected', 'action_executing', 'action_complete',
      'action_failed', 'action_escalated', 'outcome_report', 'reset',
      'tool_used', 'agent_error',
    ];

    if (Platform.OS === 'web') {
      // Web: use native browser EventSource
      es = new window.EventSource(sseUrl);

      es.onopen = () => {
        console.log('[SSE] Web EventSource opened');
        setSseStatus('online');
        setConnected(true);
      };

      es.onerror = (err: any) => {
        console.warn('[SSE] Web EventSource error/disconnected', err);
        setSseStatus('offline');
        // Don't set isConnected to false - let StateSync handle that
      };

      // Listen for all custom event types
      for (const type of eventTypes) {
        es.addEventListener(type, (event: MessageEvent) => {
          handleEvent(type, event.data);
        });
      }
    } else {
      // Native: use react-native-sse
      const RNEventSource = require('react-native-sse').default;
      es = new RNEventSource(sseUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      es.addEventListener('open', () => {
        console.log('[SSE] Native EventSource opened');
        setSseStatus('online');
        setConnected(true);
      });

      es.addEventListener('error', (event: any) => {
        console.warn('[SSE] Native EventSource error', event);
        setSseStatus('offline');
        // Don't set isConnected to false - let StateSync handle that
      });

      for (const type of eventTypes) {
        es.addEventListener(type, (event: any) => {
          handleEvent(type, event.data);
        });
      }
    }

    esRef.current = es;

    return () => {
      console.log('[SSE] Closing connection');
      if (Platform.OS === 'web') {
        es?.close();
      } else {
        es?.removeAllEventListeners?.();
        es?.close();
      }
    };
  }, [baseUrl, setErrorMessage]);

  return { isConnected: useEcomGuardStore(state => state.isConnected) };
};
