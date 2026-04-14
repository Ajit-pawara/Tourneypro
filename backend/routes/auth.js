const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Team    = require('../models/Team');

// ─── POST /api/auth/admin-login ───────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, user: { id: user._id, username: user.username, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/player-login ─────────────────────────────────────────────
// No password — just name lookup or create player session
router.post('/player-login', async (req, res) => {
  try {
    const { name, teamName } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: 'Name is required.' });

    // Issue a read-only token
    const token = jwt.sign(
      { name, teamName: teamName || '', role: 'player' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ success: true, token, user: { name, teamName: teamName || '', role: 'player' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(403).json({ success: false });
  }
});

module.exports = router;
