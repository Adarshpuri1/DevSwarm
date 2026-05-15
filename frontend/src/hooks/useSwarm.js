// frontend/src/hooks/useSwarm.js
import { useCallback, useRef } from 'react';
import { useSwarmStore } from '../store/swarmStore';

const API = import.meta.env.VITE_API_URL || '/api';

export function useSwarm() {
  const store = useSwarmStore();
  const sseRef = useRef(null);

  const connectSSE = useCallback((taskId) => {
    // Close any existing SSE connection
    if (sseRef.current) sseRef.current.close();

    const token = store.token;
    const url = `${API}/agents/stream/${taskId}`;

    // EventSource doesn't support headers, so we use fetch for SSE
    // Alternative: append token as query param (simpler for demo)
    const es = new EventSource(`${url}?token=${token}`);
    sseRef.current = es;

    const handleEvent = (eventName) => (e) => {
      try {
        const data = JSON.parse(e.data);
        store.addEvent({ event: eventName, data, id: Date.now() });

        switch (eventName) {
          case 'agent_start':
            store.setAgentStatus(data.agent, 'running');
            break;
          case 'agent_done':
            store.setAgentStatus(data.agent, 'done');
            break;
          case 'agent_error':
            store.setAgentStatus(data.agent, 'error');
            break;
          case 'phase':
            store.setCurrentPhase(data.phase);
            break;
          case 'complete':
            store.setCurrentPhase(6);
            store.resetAgentStatuses();
            // Fetch final task
            store.fetchTask(taskId).then(t => store.setCurrentTask(t));
            break;
        }
      } catch (_) {}
    };

    const eventTypes = [
      'orchestrator', 'decomposition', 'phase',
      'agent_start', 'agent_done', 'agent_error',
      'inter_agent_message', 'conflict_detected', 'conflict_resolved',
      'complete', 'error'
    ];

    eventTypes.forEach(ev => {
      es.addEventListener(ev, handleEvent(ev));
    });

    es.onerror = () => {
      store.addEvent({ event: 'sse_error', data: { message: 'Connection lost' }, id: Date.now() });
    };

    return () => es.close();
  }, [store]);

  const submitTask = useCallback(async (description) => {
    store.clearEvents();
    store.resetAgentStatuses();
    store.setCurrentPhase(0);

    const result = await store.submitTask(description);
    store.setCurrentTask({ _id: result.taskId, status: 'running', description });

    // Connect SSE for live updates
    connectSSE(result.taskId);

    return result;
  }, [store, connectSSE]);

  const disconnect = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  return { submitTask, connectSSE, disconnect };
}
