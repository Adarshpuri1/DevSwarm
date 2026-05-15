// frontend/src/components/ChatArea.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwarmStore } from '../store/swarmStore';
import { useSwarm } from '../hooks/useSwarm';
import AgentBubble from './AgentBubble';
import CodeBlock from './CodeBlock';

const PHASES = [
  'Idle', 'Decomposition', 'Parallel Dev', 'QA Testing', 'Code Review', 'Conflict Resolution', 'Complete'
];

function EventBubble({ event }) {
  const { event: type, data } = event;

  if (type === 'orchestrator') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 px-6 py-2"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
          ⚡
        </div>
        <div>
          <p className="text-[#8892a4] text-xs font-mono mb-0.5">Orchestrator</p>
          <p className="text-white text-sm">{data.message}</p>
        </div>
      </motion.div>
    );
  }

  if (type === 'phase') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-6 my-2 bg-[#0d1117] border border-[#1c2333] rounded-xl px-4 py-3 flex items-center gap-3"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-mono text-cyan-400">
          {data.phase}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{data.name}</p>
          <p className="text-[#8892a4] text-xs">{data.message}</p>
        </div>
      </motion.div>
    );
  }

  if (type === 'agent_start') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-6 py-1"
      >
        <div className="flex gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#4a5568]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#4a5568]" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#4a5568]" />
        </div>
        <p className="text-[#8892a4] text-xs font-mono">{data.name} is working...</p>
      </motion.div>
    );
  }

  if (type === 'agent_done') {
    return <AgentBubble agentKey={data.agent} name={data.name} emoji={data.emoji} color={data.color} output={data.output} duration={data.duration} />;
  }

  if (type === 'inter_agent_message') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-1.5"
      >
        <div className="flex items-center gap-2 text-xs text-[#4a5568] font-mono">
          <span>{data.fromEmoji}</span>
          <span className="text-[#2d3748]">{data.fromName}</span>
          <span>→</span>
          <span>{data.toEmoji}</span>
          <span className="text-[#2d3748]">{data.toName}</span>
          <span className="text-[#4a5568] italic ml-1">"{data.message}"</span>
        </div>
      </motion.div>
    );
  }

  if (type === 'conflict_detected') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-6 my-1 flex items-center gap-2 text-amber-400 text-xs font-mono bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2"
      >
        ⚠️ {data.message}
      </motion.div>
    );
  }

  if (type === 'conflict_resolved') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-6 my-1 flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-2"
      >
        ✅ Conflicts resolved by Orion
      </motion.div>
    );
  }

  if (type === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-6 my-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl px-5 py-4"
      >
        <p className="text-emerald-400 font-semibold">✅ DevSwarm Complete!</p>
        <p className="text-[#8892a4] text-sm mt-1">
          All 4 agents contributed · {(data.totalDuration / 1000).toFixed(1)}s total
          {data.conflictsResolved > 0 && ` · ${data.conflictsResolved} conflict(s) resolved`}
        </p>
      </motion.div>
    );
  }

  if (type === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-6 my-2 text-red-400 text-xs font-mono bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2"
      >
        ❌ Error: {data.message}
      </motion.div>
    );
  }

  return null;
}

export default function ChatArea() {
  const [input, setInput] = useState('');
  const { events, currentTask } = useSwarmStore();
  const { submitTask } = useSwarm();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitTask(input.trim());
      setInput('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const isRunning = currentTask?.status === 'running' || submitting;

  const EXAMPLES = [
    'Build a user authentication system with JWT and password reset',
    'Create a real-time dashboard with charts and live data updates',
    'Add a file upload feature with drag-and-drop and image preview',
    'Build a notification system with in-app alerts and email delivery',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center text-3xl mx-auto mb-6">
                ⚡
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                What should the team build?
              </h2>
              <p className="text-[#8892a4] text-sm leading-relaxed mb-8">
                Describe a feature and your AI dev team — Aria, Nexus, Vera, and Orion — will collaborate to architect, build, test, and review it.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(ex)}
                    className="text-left px-4 py-3 rounded-xl border border-[#1c2333] bg-[#0d1117] text-[#8892a4] text-sm hover:text-white hover:border-[#2d3748] transition-all duration-200"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* User message */}
            {currentTask && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end px-6 mb-4"
              >
                <div className="max-w-sm bg-gradient-to-br from-cyan-600 to-purple-700 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-white text-sm">{currentTask.description}</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {events.map((event) => (
                <EventBubble key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1c2333] p-4 shrink-0">
        {submitError && (
          <p className="text-red-400 text-xs mb-2 font-mono">{submitError}</p>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1 bg-[#0d1117] border border-[#1c2333] rounded-xl overflow-hidden focus-within:border-cyan-500/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a feature for DevSwarm to build... (⌘+Enter to send)"
              disabled={isRunning}
              rows={2}
              className="w-full bg-transparent px-4 py-3 text-white placeholder-[#4a5568] text-sm resize-none focus:outline-none disabled:opacity-40"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isRunning || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl font-medium text-black disabled:opacity-40 transition-all duration-200 flex items-center justify-center"
            style={{ background: isRunning ? 'transparent' : 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            {isRunning ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-cyan-400 text-lg"
              >
                ⚙️
              </motion.span>
            ) : '→'}
          </button>
        </div>
        <p className="text-[#4a5568] text-xs mt-2 font-mono">
          {isRunning ? '⚡ DevSwarm is building your feature...' : 'Ctrl/⌘ + Enter to send'}
        </p>
      </div>
    </div>
  );
}
