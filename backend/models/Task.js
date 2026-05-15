// backend/models/Task.js
const mongoose = require('mongoose');

const agentOutputSchema = new mongoose.Schema({
  agent: { type: String, enum: ['frontend', 'backend', 'qa', 'reviewer'], required: true },
  name: String,
  output: String,
  codeBlocks: [String],
  status: { type: String, enum: ['pending', 'running', 'done', 'error'], default: 'pending' },
  duration: Number, // ms
  createdAt: { type: Date, default: Date.now },
});

const conflictSchema = new mongoose.Schema({
  description: String,
  agentA: String,
  agentB: String,
  resolution: String,
  resolvedAt: Date,
});

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'running', 'complete', 'failed'],
    default: 'pending'
  },
  options: { type: Object, default: {} },
  agentOutputs: [agentOutputSchema],
  conflicts: [conflictSchema],
  messages: [{
    from: String,
    to: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  finalOutput: String,
  completedAt: Date,
  error: String,
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
