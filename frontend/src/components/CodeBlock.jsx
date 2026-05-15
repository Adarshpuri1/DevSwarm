// frontend/src/components/CodeBlock.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CodeBlock({ code, language = 'javascript', agentColor = '#06b6d4' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className="rounded-xl overflow-hidden border text-xs"
      style={{ borderColor: `${agentColor}20` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: `${agentColor}10` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <span
            className="font-mono text-xs"
            style={{ color: agentColor }}
          >
            {language || 'code'}
          </span>
          <span className="text-[#4a5568]">{lines.length} lines</span>
        </div>
        <button
          onClick={copy}
          className="text-[#4a5568] hover:text-white transition-colors font-mono"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 bg-[#080a0f] text-[#c9d1d9] font-mono text-xs leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 shrink-0 text-[#2d3748] select-none text-right mr-4">
                {i + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
