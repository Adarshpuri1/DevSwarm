// tests/unit/orchestrator.test.js
const { detectConflicts } = require('../../backend/utils/conflictResolver');

describe('Conflict Detection', () => {
  test('detects conflict keyword', () => {
    expect(detectConflicts('There is a conflict in the API')).toBe(true);
  });

  test('detects inconsistency keyword', () => {
    expect(detectConflicts('The response schema shows an inconsistency')).toBe(true);
  });

  test('returns false for clean review', () => {
    expect(detectConflicts('Everything looks great, no issues found')).toBe(false);
  });

  test('case insensitive', () => {
    expect(detectConflicts('CONFLICT detected in auth middleware')).toBe(true);
  });
});

describe('MessageQueue', () => {
  const mq = require('../../backend/utils/messageQueue');

  beforeEach(() => {
    mq.clearHistory('test-task');
  });

  test('publishes and delivers to subscriber', (done) => {
    const cleanup = mq.subscribe('test-task', (event, data) => {
      expect(event).toBe('agent_done');
      expect(data.agent).toBe('frontend');
      cleanup();
      done();
    });
    mq.publish('test-task', 'agent_done', { agent: 'frontend' });
  });

  test('replays history to late subscribers', () => {
    mq.publish('test-task', 'orchestrator', { message: 'Hello' });
    const received = [];
    const cleanup = mq.subscribe('test-task', (event, data) => {
      received.push({ event, data });
    });
    expect(received.length).toBe(1);
    expect(received[0].event).toBe('orchestrator');
    cleanup();
  });

  test('cleanup removes subscriber', () => {
    let callCount = 0;
    const cleanup = mq.subscribe('test-task', () => callCount++);
    mq.publish('test-task', 'test', {});
    cleanup();
    mq.publish('test-task', 'test', {});
    expect(callCount).toBe(2); // 1 from history replay + 1 live
  });

  test('caps history at 200 events', () => {
    for (let i = 0; i < 250; i++) {
      mq.publish('test-task', 'event', { i });
    }
    const history = mq.getHistory('test-task');
    expect(history.length).toBeLessThanOrEqual(200);
  });
});
