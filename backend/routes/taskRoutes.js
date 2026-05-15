// backend/routes/taskRoutes.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/tasks — Alias for agent tasks
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(tasks);
  } catch (err) { next(err); }
});

// GET /api/tasks/stats
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const [total, complete, failed, running] = await Promise.all([
      Task.countDocuments({ userId: req.user.id }),
      Task.countDocuments({ userId: req.user.id, status: 'complete' }),
      Task.countDocuments({ userId: req.user.id, status: 'failed' }),
      Task.countDocuments({ userId: req.user.id, status: 'running' }),
    ]);
    res.json({ total, complete, failed, running, pending: total - complete - failed - running });
  } catch (err) { next(err); }
});

module.exports = router;
