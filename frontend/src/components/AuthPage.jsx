// frontend/src/components/AuthPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwarmStore } from '../store/swarmStore';

const AGENTS = [
  { name: 'Aria', emoji: '🎨', color: '#06b6d4', role: 'Frontend Dev' },
  { name: 'Nexus', emoji: '⚙️', color: '#8b5cf6', role: 'Backend Dev' },
  { name: 'Vera', emoji: '🔬', color: '#10b981', role: 'QA Engineer' },
  { name: 'Orion', emoji: '🔭', color: '#f59e0b', role: 'Reviewer' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setToken, setUser } = useSwarmStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');

      setUser(data.user);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#080a0f] flex overflow-hidden">
      {/* Left — Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-black">
              DS
            </div>
            <span className="font-mono font-bold text-white text-xl tracking-tight">DevSwarm</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            AI agents that
            <br />
            <span className="gradient-text">ship code together</span>
          </h1>
          <p className="text-[#8892a4] text-lg leading-relaxed max-w-sm">
            A multi-agent platform where specialized AI devs collaborate to build, test, review, and deploy your features.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-2 gap-3">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="bg-[#0d1117] border border-[#1c2333] rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}40` }}>
                {agent.emoji}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{agent.name}</p>
                <p className="text-[#8892a4] text-xs">{agent.role}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full animate-pulse"
                style={{ background: agent.color }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative"
        >
          <div className="bg-[#0d1117] border border-[#1c2333] rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex bg-[#080a0f] rounded-xl p-1 mb-8">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    mode === m
                      ? 'bg-[#1c2333] text-white shadow'
                      : 'text-[#8892a4] hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-[#8892a4] text-xs font-medium mb-2 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full bg-[#080a0f] border border-[#1c2333] rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#080a0f] border border-[#1c2333] rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-[#080a0f] border border-[#1c2333] rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-black transition-all duration-200 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⚡</motion.span>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In to DevSwarm' : 'Join DevSwarm'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[#4a5568] text-sm mt-6">
            Powered by Claude AI · MIT License
          </p>
        </motion.div>
      </div>
    </div>
  );
}
