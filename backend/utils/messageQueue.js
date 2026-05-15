// backend/utils/messageQueue.js
// In-memory pub/sub for SSE event streaming between orchestrator and clients

class MessageQueue {
  constructor() {
    this.subscribers = new Map(); // taskId -> [sendFn, ...]
    this.history = new Map();     // taskId -> [events]
  }

  /**
   * Subscribe to a task's event stream
   * @returns cleanup function
   */
  subscribe(taskId, sendFn) {
    if (!this.subscribers.has(taskId)) {
      this.subscribers.set(taskId, []);
    }
    this.subscribers.get(taskId).push(sendFn);

    // Replay history for late subscribers
    const hist = this.history.get(taskId) || [];
    hist.forEach(({ event, data }) => sendFn(event, data));

    return () => {
      const subs = this.subscribers.get(taskId) || [];
      const idx = subs.indexOf(sendFn);
      if (idx > -1) subs.splice(idx, 1);
      if (subs.length === 0) this.subscribers.delete(taskId);
    };
  }

  /**
   * Publish event to all subscribers of a task
   */
  publish(taskId, event, data) {
    // Store in history (cap at 200 events)
    if (!this.history.has(taskId)) this.history.set(taskId, []);
    const hist = this.history.get(taskId);
    hist.push({ event, data, ts: Date.now() });
    if (hist.length > 200) hist.shift();

    // Deliver to live subscribers
    const subs = this.subscribers.get(taskId) || [];
    subs.forEach(fn => {
      try { fn(event, data); }
      catch (e) { console.error('SSE delivery error:', e); }
    });
  }

  /**
   * Clear history for a task (cleanup)
   */
  clearHistory(taskId) {
    this.history.delete(taskId);
  }

  /**
   * Get event history for a task
   */
  getHistory(taskId) {
    return this.history.get(taskId) || [];
  }
}

module.exports = new MessageQueue();
