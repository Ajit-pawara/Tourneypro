const express  = require('express');
const router   = express.Router();
const Team     = require('../models/Team');
const { auth } = require('../middleware/auth');

// GET all teams (public)
router.get('/', async (req, res) => {
  try {
    const { tournament } = req.query;
    const query = tournament ? { tournaments: tournament } : {};
    const teams = await Team.find(query).populate('tournaments', 'name format status').sort({ name: 1 });
    res.json({ success: true, data: teams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single team (public)
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('tournaments');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST create team (admin)
router.post('/', auth, async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json({ success: true, data: team, message: 'Team created successfully!' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT update team (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team, message: 'Team updated!' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE team (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Team deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST add player to team (admin)
router.post('/:id/players', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    team.players.push(req.body);
    await team.save();
    res.json({ success: true, data: team, message: 'Player added!' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE player from team (admin)
router.delete('/:id/players/:playerId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    team.players = team.players.filter(p => p._id.toString() !== req.params.playerId);
    await team.save();
    res.json({ success: true, data: team, message: 'Player removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
