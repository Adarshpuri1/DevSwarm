// backend/models/AgentSession.js
const mongoose = require('mongoose');

const agentSessionSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  agent: { type: String, enum: ['frontend', 'backend', 'qa', 'reviewer', 'orchestrator'] },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'complete', 'error'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('AgentSession', agentSessionSchema);
