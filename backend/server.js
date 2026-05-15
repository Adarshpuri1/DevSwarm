// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const agentRoutes = require('./routes/agentRoutes');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// ═══ SECURITY MIDDLEWARE ══════════════════════════════════
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ═══ RATE LIMITING ═══════════════════════════════════════
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ═══ ROUTES ══════════════════════════════════════════════
app.use('/api/agents', agentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ═══ HEALTH CHECK ════════════════════════════════════════
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  agents: 4,
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

// ═══ ERROR HANDLER ═══════════════════════════════════════
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ═══ DATABASE + START ════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devswarm')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 DevSwarm API running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => { console.error('❌ DB connection failed:', err); process.exit(1); });

module.exports = app;
