// frontend/src/components/AgentPanel.jsx
import { motion } from 'framer-motion';
import { useSwarmStore } from '../store/swarmStore';

const AGENTS = [
  {
    key: 'frontend',
    name: 'Aria',
    emoji: '🎨',
    color: '#06b6d4',
    role: 'Frontend Dev',
    skills: ['React', 'Tailwind', 'GSAP', 'Framer Motion'],
    desc: 'Builds pixel-perfect, animated React interfaces.'
  },
  {
    key: 'backend',
    name: 'Nexus',
    emoji: '⚙️',
    color: '#8b5cf6',
    role: 'Backend Dev',
    skills: ['Node.js', 'Express', 'MongoDB', 'JWT'],
    desc: 'Architects production-grade RESTful APIs.'
  },
  {
    key: 'qa',
    name: 'Vera',
    emoji: '🔬',
    color: '#10b981',
    role: 'QA Engineer',
    skills: ['Jest', 'Playwright', 'Supertest', '80%+ coverage'],
    desc: 'Writes comprehensive test suites for all layers.'
  },
  {
    key: 'reviewer',
    name: 'Orion',
    emoji: '🔭',
    color: '#f59e0b',
    role: 'Code Reviewer',
    skills: ['Security', 'Architecture', 'Performance', 'Conflicts'],
    desc: 'Reviews code and resolves inter-agent conflicts.'
  },
];

const STATUS_CONFIG = {
  idle: { label: 'idle', dot: 'bg-[#2d3748]' },
  running: { label: 'working', dot: 'bg-cyan-400 animate-pulse' },
  done: { label: 'done', dot: 'bg-emerald-400' },
  error: { label: 'error', dot: 'bg-red-400' },
};

export default function AgentPanel() {
  const { agentStatuses, tasks } = useSwarmStore();

  return (
    <div className="p-4 space-y-2">
      <p className="text-[#4a5568] text-xs font-mono uppercase tracking-widest mb-4 px-1">
        Agent Roster
      </p>

      {AGENTS.map((agent, i) => {
        const status = agentStatuses[agent.key] || 'idle';
        const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

        return (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-[#1c2333] bg-[#0d1117] p-3 hover:border-opacity-60 transition-all duration-200 group cursor-default"
            style={{ '--agent-color': agent.color }}
          >
            {/* Header row */}
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 transition-all duration-300"
                style={{
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}${status === 'running' ? '80' : '30'}`,
                  boxShadow: status === 'running' ? `0 0 12px ${agent.color}40` : 'none',
                }}
              >
                {status === 'running' ? (
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    {agent.emoji}
                  </motion.span>
                ) : agent.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white text-sm">{agent.name}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className="text-[10px] text-[#4a5568] font-mono">{statusCfg.label}</span>
                  </div>
                </div>
                <p className="text-[#8892a4] text-xs">{agent.role}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-[#4a5568] text-xs leading-relaxed mb-2.5 line-clamp-2">
              {agent.desc}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1">
              {agent.skills.slice(0, 3).map(skill => (
                <span
                  key={skill}
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: `${agent.color}10`,
                    color: agent.color,
                    border: `1px solid ${agent.color}20`,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Task stats */}
      {tasks.length > 0 && (
        <div className="mt-6">
          <p className="text-[#4a5568] text-xs font-mono uppercase tracking-widest mb-3 px-1">
            Recent Tasks
          </p>
          <div className="space-y-1.5">
            {tasks.slice(0, 5).map(task => (
              <div key={task._id} className="flex items-center gap-2 px-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  task.status === 'complete' ? 'bg-emerald-400' :
                  task.status === 'failed' ? 'bg-red-400' :
                  task.status === 'running' ? 'bg-cyan-400 animate-pulse' :
                  'bg-[#2d3748]'
                }`} />
                <p className="text-[#8892a4] text-xs truncate">{task.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
