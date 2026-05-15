// frontend/src/components/DevSwarm.jsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AgentPanel from './AgentPanel';
import ChatArea from './ChatArea';
import PipelinePanel from './PipelinePanel';
import { useSwarmStore } from '../store/swarmStore';

export default function DevSwarm() {
  const { user, logout, fetchTasks } = useSwarmStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="h-screen bg-[#080a0f] flex flex-col overflow-hidden">
      {/* Top nav */}
      <header className="h-14 border-b border-[#1c2333] flex items-center justify-between px-6 shrink-0 glass z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold text-black">
            DS
          </div>
          <span className="font-mono font-bold text-white tracking-tight">DevSwarm</span>
          <span className="text-[#4a5568] text-xs font-mono">v1.0</span>

          <div className="ml-4 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#8892a4] text-xs">4 agents online</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#8892a4] text-sm">
            {user?.name || user?.email || 'Developer'}
          </span>
          <button
            onClick={logout}
            className="text-xs text-[#4a5568] hover:text-white transition-colors font-mono border border-[#1c2333] rounded-lg px-3 py-1.5 hover:border-[#2d3748]"
          >
            sign out
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Agent roster */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 border-r border-[#1c2333] shrink-0 overflow-y-auto scrollbar-hide"
        >
          <AgentPanel />
        </motion.div>

        {/* Center: Chat area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <ChatArea />
        </motion.div>

        {/* Right: Pipeline */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-72 border-l border-[#1c2333] shrink-0 overflow-y-auto scrollbar-hide"
        >
          <PipelinePanel />
        </motion.div>
      </div>
    </div>
  );
}
