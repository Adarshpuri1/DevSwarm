// frontend/src/components/PipelinePanel.jsx
import { motion } from 'framer-motion';
import { useSwarmStore } from '../store/swarmStore';

const PHASES = [
  { id: 1, name: 'Task Decomposition', icon: '🧩', desc: 'Breaking task into parallel workstreams' },
  { id: 2, name: 'Parallel Development', icon: '⚡', desc: 'Aria + Nexus building simultaneously' },
  { id: 3, name: 'QA Testing', icon: '🔬', desc: 'Vera writing comprehensive tests' },
  { id: 4, name: 'Code Review', icon: '🔭', desc: 'Orion auditing all implementations' },
  { id: 5, name: 'Conflict Resolution', icon: '⚖️', desc: 'Resolving inter-agent disagreements' },
  { id: 6, name: 'Final Output', icon: '✅', desc: 'Unified production-ready code' },
];

const AGENTS = [
  { key: 'frontend', name: 'Aria', emoji: '🎨', color: '#06b6d4' },
  { key: 'backend', name: 'Nexus', emoji: '⚙️', color: '#8b5cf6' },
  { key: 'qa', name: 'Vera', emoji: '🔬', color: '#10b981' },
  { key: 'reviewer', name: 'Orion', emoji: '🔭', color: '#f59e0b' },
];

function PhaseStep({ phase, status }) {
  // status: 'pending' | 'active' | 'done'
  const colors = {
    pending: { border: '#1c2333', bg: 'transparent', text: '#4a5568', icon: '#2d3748' },
    active: { border: '#06b6d4', bg: 'rgba(6,182,212,0.05)', text: '#06b6d4', icon: '#06b6d4' },
    done: { border: '#10b981', bg: 'rgba(16,185,129,0.05)', text: '#10b981', icon: '#10b981' },
  };
  const c = colors[status] || colors.pending;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-500"
      style={{ borderColor: c.border, background: c.bg }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
        style={{
          background: `${c.icon}15`,
          border: `1px solid ${c.icon}30`,
          boxShadow: status === 'active' ? `0 0 10px ${c.icon}40` : 'none',
        }}
      >
        {status === 'active' ? (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {phase.icon}
          </motion.span>
        ) : status === 'done' ? '✓' : phase.icon}
      </div>
      <div>
        <p className="text-white text-xs font-semibold">{phase.name}</p>
        <p className="text-[#4a5568] text-xs mt-0.5">{phase.desc}</p>
      </div>
    </div>
  );
}

export default function PipelinePanel() {
  const { currentPhase, agentStatuses, events, currentTask } = useSwarmStore();

  const getPhaseStatus = (phaseId) => {
    if (currentPhase > phaseId) return 'done';
    if (currentPhase === phaseId) return 'active';
    return 'pending';
  };

  // Count events per type
  const agentDoneCount = events.filter(e => e.event === 'agent_done').length;
  const interAgentCount = events.filter(e => e.event === 'inter_agent_message').length;
  const conflictCount = events.filter(e => e.event === 'conflict_detected').length;

  const isComplete = currentPhase >= 6;

  return (
    <div className="p-4 space-y-4">
      <p className="text-[#4a5568] text-xs font-mono uppercase tracking-widest px-1">
        Build Pipeline
      </p>

      {/* Pipeline steps */}
      <div className="space-y-1.5">
        {PHASES.map(phase => (
          <PhaseStep
            key={phase.id}
            phase={phase}
            status={getPhaseStatus(phase.id)}
          />
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-[#4a5568] mb-2 font-mono">
          <span>Progress</span>
          <span>{Math.round((currentPhase / 6) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-[#1c2333] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentPhase / 6) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Agent activity grid */}
      <div className="mt-4">
        <p className="text-[#4a5568] text-xs font-mono uppercase tracking-widest mb-3 px-1">
          Agent Activity
        </p>
        <div className="grid grid-cols-2 gap-2">
          {AGENTS.map(agent => {
            const status = agentStatuses[agent.key];
            return (
              <div
                key={agent.key}
                className="rounded-xl border p-2.5 transition-all duration-300"
                style={{
                  borderColor: status === 'running' ? `${agent.color}50` :
                               status === 'done' ? `${agent.color}30` : '#1c2333',
                  background: status === 'running' ? `${agent.color}08` : 'transparent',
                  boxShadow: status === 'running' ? `0 0 12px ${agent.color}15` : 'none',
                }}
              >
                <div className="text-lg mb-1">
                  {status === 'running' ? (
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {agent.emoji}
                    </motion.span>
                  ) : agent.emoji}
                </div>
                <p className="text-white text-xs font-semibold">{agent.name}</p>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{
                    color: status === 'running' ? agent.color :
                           status === 'done' ? '#10b981' : '#4a5568'
                  }}
                >
                  {status || 'idle'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {(agentDoneCount > 0 || interAgentCount > 0) && (
        <div className="border border-[#1c2333] rounded-xl p-3 space-y-2">
          <p className="text-[#4a5568] text-xs font-mono uppercase tracking-widest">Session Stats</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#8892a4]">Agents completed</span>
              <span className="text-white font-mono">{agentDoneCount}/4</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8892a4]">Agent messages</span>
              <span className="text-white font-mono">{interAgentCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8892a4]">Conflicts detected</span>
              <span className={`font-mono ${conflictCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {conflictCount}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8892a4]">Total events</span>
              <span className="text-white font-mono">{events.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Complete badge */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 text-center"
        >
          <p className="text-emerald-400 font-semibold text-sm">🎉 Build Complete</p>
          <p className="text-[#8892a4] text-xs mt-1">
            {agentDoneCount} agents contributed
          </p>
        </motion.div>
      )}
    </div>
  );
}
