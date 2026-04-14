const express     = require('express');
const router      = express.Router();
const Match       = require('../models/Match');
const Tournament  = require('../models/Tournament');
const PointsTable = require('../models/PointsTable');
const { auth }    = require('../middleware/auth');

// ── GET all matches ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { tournament, status, team } = req.query;
    const q = {};
    if (tournament) q.tournament = tournament;
    if (status)     q.status     = status;
    if (team)       q.$or = [{ team1: team }, { team2: team }];
    const matches = await Match.find(q)
      .populate('team1', 'name shortName color')
      .populate('team2', 'name shortName color')
      .populate('winner', 'name shortName')
      .populate('tournament', 'name format settings sport')
      .sort({ matchDate: 1 });
    res.json({ success: true, data: matches });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET single ───────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const m = await Match.findById(req.params.id)
      .populate('team1 team2 winner')
      .populate('tournament', 'name format settings sport');
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: m });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST create ──────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const m = new Match(req.body);
    await m.save();
    const populated = await Match.findById(m._id)
      .populate('team1 team2')
      .populate('tournament', 'name format settings sport');
    res.status(201).json({ success: true, data: populated, message: 'Match scheduled!' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── PUT update details ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    ['score1','score2','winner','isDraw','sets','periods','setsWon1','setsWon2',
     'pointsAwarded1','pointsAwarded2','isStraightWin','isCloseWin'].forEach(k => delete req.body[k]);
    const m = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('team1 team2')
      .populate('tournament', 'name format settings sport');
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: m, message: 'Match updated!' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── PUT update result (full sport-aware logic) ───────────────────────────────
router.put('/:id/result', auth, async (req, res) => {
  try {
    const { score1, score2, scoreText1, scoreText2, sets, periods } = req.body;
    if (score1 === undefined || score2 === undefined)
      return res.status(400).json({ success: false, message: 'Both scores required.' });

    const m = await Match.findById(req.params.id).populate('tournament');
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });

    const t   = m.tournament;
    const cfg = (t.settings?.toObject ? t.settings.toObject() : t.settings) || {};
    const fmt = cfg.matchFormat || 'single';

    // ── Compute sets won ──────────────────────────────────────────────────
    let setsWon1 = 0, setsWon2 = 0;
    let indivPtsFor1 = 0, indivPtsFor2 = 0; // sum of individual set scores
    const cleanSets = [];
    if (fmt === 'sets' && Array.isArray(sets) && sets.length) {
      sets.forEach(s => {
        if (s.score1 === undefined || s.score2 === undefined) return;
        const s1 = Number(s.score1), s2 = Number(s.score2);
        cleanSets.push({ setNo: s.setNo, score1: s1, score2: s2, winner: s1 > s2 ? 1 : s2 > s1 ? 2 : 0 });
        if (s1 > s2) setsWon1++; else if (s2 > s1) setsWon2++;
        indivPtsFor1 += s1; indivPtsFor2 += s2;
      });
    } else {
      // For non-sets sports, individual score IS the numeric score
      indivPtsFor1 = Number(score1); indivPtsFor2 = Number(score2);
    }

    // ── Determine winner ──────────────────────────────────────────────────
    const main1 = fmt === 'sets' ? setsWon1 : Number(score1);
    const main2 = fmt === 'sets' ? setsWon2 : Number(score2);
    let winner = null, isDraw = false;
    if      (main1 > main2) winner = m.team1;
    else if (main2 > main1) winner = m.team2;
    else isDraw = true;

    // ── Straight vs Close win ─────────────────────────────────────────────
    const setsToWin    = cfg.setsToWin || Math.ceil((cfg.bestOf || 1) / 2);
    const totalSets    = main1 + main2;
    const isStraightWin = !isDraw && totalSets === setsToWin;
    const isCloseWin    = !isDraw && !isStraightWin && totalSets > setsToWin;

    // ── Tournament points for each team ───────────────────────────────────
    const pWin   = Number(cfg.pointsWin  ?? 3);
    const pLoss  = Number(cfg.pointsLoss ?? 0);
    const pTie   = Number(cfg.pointsTie  ?? 1);
    const pBonus = Number(cfg.pointsBonusStraight ?? 0);
    const pClose = Number(cfg.pointsCloseWin ?? 0);
    const useClose = !!cfg.useCloseWinPoints;

    let pts1 = 0, pts2 = 0;
    if (isDraw) {
      pts1 = pTie; pts2 = pTie;
    } else {
      let winPts = pWin, losePts = pLoss;
      if (isStraightWin && pBonus > 0) winPts += pBonus;
      if (isCloseWin && useClose && pClose > 0) winPts = pClose;
      if (winner === m.team1) { pts1 = winPts; pts2 = losePts; }
      else                    { pts2 = winPts; pts1 = losePts; }
    }

    // ── Reverse old points if editing a completed match ───────────────────
    if (m.status === 'completed' && m.score1 !== null && t.format === 'league') {
      await reversePoints(t._id, m.team1, m.team2, m);
    }

    // ── Save match ────────────────────────────────────────────────────────
    m.score1           = Number(score1);
    m.score2           = Number(score2);
    m.scoreText1       = scoreText1 || String(score1);
    m.scoreText2       = scoreText2 || String(score2);
    m.sets             = cleanSets;
    m.setsWon1         = setsWon1;
    m.setsWon2         = setsWon2;
    m.periods          = (fmt === 'periods' && periods) ? periods : [];
    m.winner           = winner;
    m.isDraw           = isDraw;
    m.isStraightWin    = isStraightWin;
    m.isCloseWin       = isCloseWin;
    m.pointsAwarded1   = pts1;
    m.pointsAwarded2   = pts2;
    m.indivPtsFor1     = indivPtsFor1;
    m.indivPtsFor2     = indivPtsFor2;
    m.status           = 'completed';
    await m.save();

    // ── Apply new points ──────────────────────────────────────────────────
    if (t.format === 'league') {
      await applyPoints(t._id, m.team1, m.team2, m);
    }

    const populated = await Match.findById(m._id)
      .populate('team1 team2 winner')
      .populate('tournament', 'name format settings sport');
    res.json({ success: true, data: populated, message: 'Result saved! Points updated.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT status ───────────────────────────────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const m = await Match.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate('team1 team2').populate('tournament', 'name format settings');
    res.json({ success: true, data: m, message: `Match marked as ${req.body.status}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const m = await Match.findById(req.params.id).populate('tournament');
    if (!m) return res.status(404).json({ success: false, message: 'Not found' });
    if (m.status === 'completed' && m.score1 !== null && m.tournament.format === 'league') {
      await reversePoints(m.tournament._id, m.team1, m.team2, m);
    }
    await m.deleteOne();
    res.json({ success: true, message: 'Match deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════ POINTS HELPERS ════════════════════════════════════════

async function ensure(tournament, team) {
  let e = await PointsTable.findOne({ tournament, team });
  if (!e) e = await PointsTable.create({ tournament, team });
  return e;
}

async function applyPoints(tournament, team1, team2, m) {
  const e1 = await ensure(tournament, team1);
  const e2 = await ensure(tournament, team2);

  e1.played++; e2.played++;

  // Individual game points (goals, set scores, runs etc.)
  e1.pointsFor     += (m.indivPtsFor1 || 0); e1.pointsAgainst += (m.indivPtsFor2 || 0);
  e2.pointsFor     += (m.indivPtsFor2 || 0); e2.pointsAgainst += (m.indivPtsFor1 || 0);

  // Sets (volleyball)
  e1.setsWon  += (m.setsWon1 || 0); e1.setsLost += (m.setsWon2 || 0);
  e2.setsWon  += (m.setsWon2 || 0); e2.setsLost += (m.setsWon1 || 0);

  // Straight / close wins
  if (m.isStraightWin) {
    if (m.pointsAwarded1 > m.pointsAwarded2) e1.straightWins++;
    else                                      e2.straightWins++;
  }
  if (m.isCloseWin) {
    if (m.pointsAwarded1 > m.pointsAwarded2) e1.closeWins++;
    else                                      e2.closeWins++;
  }

  // W/L/D
  if (m.isDraw)                             { e1.drawn++; e2.drawn++; }
  else if (m.pointsAwarded1 > m.pointsAwarded2) { e1.won++;  e2.lost++;  }
  else                                      { e2.won++;  e1.lost++;  }

  // Tournament points
  e1.points += (m.pointsAwarded1 || 0);
  e2.points += (m.pointsAwarded2 || 0);

  await e1.save(); await e2.save();
}

async function reversePoints(tournament, team1, team2, m) {
  const e1 = await PointsTable.findOne({ tournament, team: team1 });
  const e2 = await PointsTable.findOne({ tournament, team: team2 });
  if (!e1 || !e2) return;

  const dec = (e, n) => Math.max(0, e - n);

  e1.played  = dec(e1.played, 1);   e2.played  = dec(e2.played, 1);
  e1.points  = dec(e1.points,  m.pointsAwarded1 || 0);
  e2.points  = dec(e2.points,  m.pointsAwarded2 || 0);
  e1.pointsFor     = dec(e1.pointsFor,     m.indivPtsFor1 || 0);
  e1.pointsAgainst = dec(e1.pointsAgainst, m.indivPtsFor2 || 0);
  e2.pointsFor     = dec(e2.pointsFor,     m.indivPtsFor2 || 0);
  e2.pointsAgainst = dec(e2.pointsAgainst, m.indivPtsFor1 || 0);
  e1.setsWon  = dec(e1.setsWon,  m.setsWon1 || 0); e1.setsLost = dec(e1.setsLost, m.setsWon2 || 0);
  e2.setsWon  = dec(e2.setsWon,  m.setsWon2 || 0); e2.setsLost = dec(e2.setsLost, m.setsWon1 || 0);

  if (m.isDraw)                             { e1.drawn = dec(e1.drawn, 1); e2.drawn = dec(e2.drawn, 1); }
  else if (m.pointsAwarded1 > m.pointsAwarded2) { e1.won   = dec(e1.won,   1); e2.lost  = dec(e2.lost,  1); }
  else                                      { e2.won   = dec(e2.won,   1); e1.lost  = dec(e1.lost,  1); }

  if (m.isStraightWin) {
    if (m.pointsAwarded1 > m.pointsAwarded2) e1.straightWins = dec(e1.straightWins, 1);
    else e2.straightWins = dec(e2.straightWins, 1);
  }
  if (m.isCloseWin) {
    if (m.pointsAwarded1 > m.pointsAwarded2) e1.closeWins = dec(e1.closeWins, 1);
    else e2.closeWins = dec(e2.closeWins, 1);
  }

  await e1.save(); await e2.save();
}

module.exports = router;
