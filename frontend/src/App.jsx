// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DevSwarm from './components/DevSwarm';
import AuthPage from './components/AuthPage';
import { useSwarmStore } from './store/swarmStore';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.25 } },
};

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#080a0f]">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="relative w-16 h-16"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-emerald-400" />
          <div className="absolute inset-[2px] rounded-2xl bg-[#080a0f] flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </motion.div>
        <motion.p
          className="text-[#4a5568] text-sm font-mono tracking-widest uppercase"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Initializing DevSwarm
        </motion.p>
      </div>
    </div>
  );
}

export default function App() {
  const { token, setToken, setUser } = useSwarmStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('devswarm_token');
    if (stored) {
      setToken(stored);
      // Validate token by fetching /me
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user) setUser(data.user);
          else {
            localStorage.removeItem('devswarm_token');
            setToken(null);
          }
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return <LoadingScreen />;

  return (
    <>
      <div className="scan-line" />
      <AnimatePresence mode="wait">
        {token ? (
          <motion.div key="app" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-screen">
            <DevSwarm />
          </motion.div>
        ) : (
          <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-screen">
            <AuthPage />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
