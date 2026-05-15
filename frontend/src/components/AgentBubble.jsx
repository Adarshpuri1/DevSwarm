// frontend/src/components/AgentBubble.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import CodeBlock from './CodeBlock';

const AGENT_CONFIG = {
  frontend: { name: 'Aria', emoji: '🎨', color: '#06b6d4' },
  backend: { name: 'Nexus', emoji: '⚙️', color: '#8b5cf6' },
  qa: { name: 'Vera', emoji: '🔬', color: '#10b981' },
  reviewer: { name: 'Orion', emoji: '🔭', color: '#f59e0b' },
};

function parseContent(output) {
  if (!output) return [];
  const segments = [];
  const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(output)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: output.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', lang: match[1] || 'text', content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < output.length) {
    segments.push({ type: 'text', content: output.slice(lastIndex) });
  }
  return segments;
}

export default function AgentBubble({ agentKey, name, emoji, color, output, duration }) {
  const cfg = AGENT_CONFIG[agentKey] || { name, emoji, color };
  const [expanded, setExpanded] = useState(true);
  const segments = parseContent(output);
  const hasCode = segments.some(s => s.type === 'code');
  const wordCount = output?.split(/\s+/).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="px-6 py-2"
    >
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: `${cfg.color}25`,
          background: `linear-gradient(135deg, ${cfg.color}06, transparent)`,
        }}
      >
        {/* Agent header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          style={{ borderBottom: expanded ? `1px solid ${cfg.color}15` : 'none' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{
              background: `${cfg.color}18`,
              border: `1px solid ${cfg.color}40`,
              boxShadow: `0 0 8px ${cfg.color}20`,
            }}
          >
            {cfg.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{cfg.name}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ color: cfg.color, background: `${cfg.color}15` }}
              >
                ✓ done
              </span>
              {duration && (
                <span className="text-[#4a5568] text-xs font-mono">
                  {(duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <p className="text-[#8892a4] text-xs">
              {wordCount} words {hasCode ? '· includes code' : ''}
            </p>
          </div>
          <span className="text-[#4a5568] text-xs">{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Content */}
        {expanded && (
          <div className="px-4 py-3 space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
            {segments.map((seg, i) => {
              if (seg.type === 'text') {
                return (
                  <p key={i} className="text-[#c9d1d9] text-sm leading-relaxed whitespace-pre-wrap">
                    {seg.content.trim()}
                  </p>
                );
              }
              return (
                <CodeBlock key={i} code={seg.content} language={seg.lang} agentColor={cfg.color} />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
