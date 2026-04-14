const express    = require('express');
const router     = express.Router();
const Tournament = require('../models/Tournament');
const Team       = require('../models/Team');
const Match      = require('../models/Match');
const PointsTable= require('../models/PointsTable');

// GET /api/dashboard/stats (public)
router.get('/stats', async (req, res) => {
  try {
    const [
      totalTournaments,
      ongoingTournaments,
      totalTeams,
      totalMatches,
      completedMatches,
      upcomingMatches,
      liveMatches,
    ] = await Promise.all([
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: 'ongoing' }),
      Team.countDocuments(),
      Match.countDocuments(),
      Match.countDocuments({ status: 'completed' }),
      Match.countDocuments({ status: 'scheduled' }),
      Match.countDocuments({ status: 'live' }),
    ]);

    // Recent 5 completed matches
    const recentMatches = await Match.find({ status: 'completed' })
      .populate('team1', 'name shortName color')
      .populate('team2', 'name shortName color')
      .populate('winner', 'name shortName')
      .populate('tournament', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Next 5 upcoming matches
    const nextMatches = await Match.find({ status: 'scheduled' })
      .populate('team1', 'name shortName color')
      .populate('team2', 'name shortName color')
      .populate('tournament', 'name')
      .sort({ matchDate: 1 })
      .limit(5);

    // Live matches
    const liveMatchList = await Match.find({ status: 'live' })
      .populate('team1', 'name shortName color')
      .populate('team2', 'name shortName color')
      .populate('tournament', 'name')
      .limit(3);

    // Top teams across all league tournaments (by points)
    const topTeams = await PointsTable.find()
      .populate('team', 'name shortName color')
      .populate('tournament', 'name')
      .sort({ points: -1, netScore: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalTournaments,
          ongoingTournaments,
          totalTeams,
          totalMatches,
          completedMatches,
          upcomingMatches,
          liveMatches,
        },
        recentMatches,
        nextMatches,
        liveMatchList,
        topTeams,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
