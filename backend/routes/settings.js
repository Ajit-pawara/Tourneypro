const express    = require('express');
const router     = express.Router();
const Tournament = require('../models/Tournament');
const { auth }   = require('../middleware/auth');

// ─── Sport presets ────────────────────────────────────────────────────────────
const SPORT_PRESETS = {
  volleyball: {
    label: 'Volleyball', icon: '🏐',
    scoreLabel: 'Points', setLabel: 'Set',
    matchFormat: 'bo5', setsToWin: 3,
    defaultSetPoints: 25, finalSetPoints: 15,
    useShorterFinalSet: true, mustWinBy2: true, maxOvertimePoints: 0,
    pointsWin: 3, pointsLoss: 0, pointsTie: 0,
    pointsBonusStraight: 0, pointsCloseWin: 2, useCloseWinPoints: true,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','won','setRatio','pointRatio'],
    rules: `VOLLEYBALL RULES\n================\n1. Match Format: Best of 5 Sets\n2. Sets 1–4: First to 25 points (win by 2)\n3. Set 5 (deciding): First to 15 points (win by 2)\n4. Tournament Points: Win 3-0 or 3-1 = 3 pts | Win 3-2 = 2 pts | Lose 2-3 = 1 pt | Lose 0-3 or 1-3 = 0 pts\n5. Net touch or crossing under net = fault\n6. Maximum 3 touches per side\n7. Players must rotate clockwise each time they win service\n8. Tiebreaker: Points → Set Ratio → Point Ratio`,
  },
  football: {
    label: 'Football', icon: '⚽',
    scoreLabel: 'Goals', setLabel: 'Half',
    matchFormat: 'halves', setsToWin: 0,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 3, pointsLoss: 0, pointsTie: 1,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 2, periodDurationMins: 45, overtimeDurationMins: 15,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','goalDiff','goalsFor','headToHead'],
    rules: `FOOTBALL RULES\n==============\n1. Match Duration: 2 × 45 minutes + injury time\n2. Overtime: 2 × 15 minutes (if applicable in knockout)\n3. Penalty Shootout: 5 kicks each, then sudden death\n4. League Points: Win = 3 pts | Draw = 1 pt | Loss = 0 pts\n5. Tiebreaker: Points → Goal Difference → Goals Scored → Head-to-Head\n6. Offside rule applies\n7. Maximum 3 substitutions per match (5 in some formats)\n8. Red card = player sent off, team plays with 10\n9. Yellow card accumulation: 2 yellows = 1 red (suspension next match)`,
  },
  basketball: {
    label: 'Basketball', icon: '🏀',
    scoreLabel: 'Points', setLabel: 'Quarter',
    matchFormat: 'quarters', setsToWin: 0,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 0,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 4, periodDurationMins: 10, overtimeDurationMins: 5,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','won','pointDiff','pointsFor'],
    rules: `BASKETBALL RULES\n================\n1. Match: 4 × 10 minutes quarters (FIBA) / 4 × 12 min (NBA)\n2. Overtime: 5 minutes, repeated until winner\n3. Shot Clock: 24 seconds to attempt a shot\n4. 3-second violation in the key\n5. Scoring: Field goal = 2 pts | 3-pointer = 3 pts | Free throw = 1 pt\n6. Fouls: 5 personal fouls = player disqualification\n7. Team foul bonus: 5+ team fouls per quarter → free throws\n8. League Points: Win = 2 pts | Loss = 0 pts | No draws\n9. Tiebreaker: Points → Win % → Point Differential`,
  },
  cricket: {
    label: 'Cricket', icon: '🏏',
    scoreLabel: 'Runs', setLabel: 'Inning',
    matchFormat: 'innings', setsToWin: 0,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 1,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 1, oversPerInnings: 20, powerplayOvers: 6,
    tiebreakerOrder: ['points','nrr','won'],
    rules: `CRICKET RULES (T20 FORMAT)\n==========================\n1. Format: T20 — 20 overs per side, 1 inning each\n2. Powerplay: Overs 1–6 — max 2 fielders outside 30-yard circle\n3. Result: Wins by runs (batting first) or wickets (batting second)\n4. No Result / Tie: DLS method applies in rain-affected matches\n5. Super Over: Tie-breaker — 1 over per side, 2 wickets max\n6. Fielding Restrictions: Max 5 fielders on leg side\n7. Free Hit: After a no-ball, next delivery is a free hit\n8. League Points: Win = 2 pts | Tie / NR = 1 pt | Loss = 0 pts\n9. Tiebreaker: Points → Net Run Rate (NRR) → Head-to-Head\n10. NRR = (Total runs scored / Overs faced) − (Runs conceded / Overs bowled)`,
  },
  hockey: {
    label: 'Field Hockey', icon: '🏑',
    scoreLabel: 'Goals', setLabel: 'Quarter',
    matchFormat: 'quarters', setsToWin: 0,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 3, pointsLoss: 0, pointsTie: 1,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 4, periodDurationMins: 15, overtimeDurationMins: 7,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','goalDiff','goalsFor'],
    rules: `FIELD HOCKEY RULES\n==================\n1. Match: 4 × 15-minute quarters, 2-min break between, 10-min halftime\n2. Goals only valid from inside the striking circle\n3. Penalty Corner: Awarded for foul inside circle or intentional foul\n4. Penalty Stroke: For deliberate foul preventing a goal\n5. No raised ball unless in the air for a shot on goal\n6. No use of body/feet to play the ball\n7. Green card = 2-min suspension | Yellow = 5–10 min | Red = expulsion\n8. Tie (Knockout): Shootout — 5 players each, then sudden death\n9. League Points: Win = 3 pts | Draw = 1 pt | Loss = 0 pts`,
  },
  badminton: {
    label: 'Badminton', icon: '🏸',
    scoreLabel: 'Points', setLabel: 'Game',
    matchFormat: 'bo3', setsToWin: 2,
    defaultSetPoints: 21, finalSetPoints: 21,
    useShorterFinalSet: false, mustWinBy2: true, maxOvertimePoints: 30,
    pointsWin: 2, pointsLoss: 0, pointsTie: 0,
    pointsBonusStraight: 1, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','won','gameRatio','pointRatio'],
    rules: `BADMINTON RULES\n===============\n1. Match: Best of 3 Games\n2. Each game to 21 points (win by 2)\n3. If tied 20-20: play until one side leads by 2 (max 30-29)\n4. Service must be below 1.15m height (waist level)\n5. Serve diagonally into service court\n6. Let = replay (shuttle hits net on serve, etc.)\n7. Fault = shuttle lands out, player touches net, double hit\n8. A point is scored on every rally (rally scoring)\n9. Singles: Narrow court | Doubles: Full width court\n10. League Points: 2-0 Win = 3 pts | 2-1 Win = 2 pts | Loss = 0 pts`,
  },
  tabletennis: {
    label: 'Table Tennis', icon: '🏓',
    scoreLabel: 'Points', setLabel: 'Game',
    matchFormat: 'bo5', setsToWin: 3,
    defaultSetPoints: 11, finalSetPoints: 11,
    useShorterFinalSet: false, mustWinBy2: true, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 0,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','won','gameRatio','pointRatio'],
    rules: `TABLE TENNIS RULES\n==================\n1. Match: Best of 5 (or 7) Games\n2. Each game to 11 points (win by 2, no cap)\n3. Service changes every 2 points\n4. Ball must bounce once on each side\n5. Edge ball = legal point | Side ball = fault\n6. Service: Ball tossed 16cm+, hit behind end line\n7. Net touch on serve = let (replay)\n8. Alternate service every 2 points (every 1 point if tied 10-10)\n9. Rally scoring — point scored on every rally`,
  },
  kabaddi: {
    label: 'Kabaddi', icon: '🤼',
    scoreLabel: 'Points', setLabel: 'Half',
    matchFormat: 'halves', setsToWin: 0,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 1,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 2, periodDurationMins: 20, overtimeDurationMins: 7,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','pointDiff','pointsFor'],
    rules: `KABADDI RULES\n=============\n1. Match: 2 × 20 minutes halves, 5-min halftime\n2. Raider crosses into opponent half chanting "kabaddi" continuously\n3. Raider earns 1 point per defender tagged and safely returned\n4. Defenders earn 1 point if raider is stopped before returning\n5. All Out: When all 7 players of a team are out — bonus 2 points\n6. Out players revived one-by-one as team earns points\n7. Raider must tag and return in one breath (one continuous chant)\n8. Bonus Line: Raider earns bonus if they reach it with 6+ defenders\n9. League Points: Win = 2 pts | Tie = 1 pt | Loss = 0 pts`,
  },
  tennis: {
    label: 'Tennis', icon: '🎾',
    scoreLabel: 'Games', setLabel: 'Set',
    matchFormat: 'bo3', setsToWin: 2,
    defaultSetPoints: 6, finalSetPoints: 6,
    useShorterFinalSet: false, mustWinBy2: true, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 0,
    pointsBonusStraight: 1, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','won','setRatio','gameRatio'],
    rules: `TENNIS RULES\n============\n1. Match: Best of 3 Sets (women/doubles) or Best of 5 Sets (men's Grand Slams)\n2. Set: First to 6 games, win by 2 (e.g. 7-5)\n3. Tiebreak: If tied 6-6, play tiebreak to 7 (win by 2)\n4. Game Scoring: 0, 15, 30, 40, Deuce (40-40) → Advantage → Game\n5. Service: 2 attempts; double fault = point lost\n6. Ball in = any part touches the line\n7. Let = ball clips net on service (replay)\n8. Foot fault = server steps on baseline before striking\n9. League Points: Straight win = 3 pts | 2-1 win = 2 pts | Loss = 0 pts`,
  },
  custom: {
    label: 'Custom Sport', icon: '🏅',
    scoreLabel: 'Score', setLabel: 'Period',
    matchFormat: 'single', setsToWin: 1,
    defaultSetPoints: 0, finalSetPoints: 0,
    useShorterFinalSet: false, mustWinBy2: false, maxOvertimePoints: 0,
    pointsWin: 2, pointsLoss: 0, pointsTie: 1,
    pointsBonusStraight: 0, pointsCloseWin: 0, useCloseWinPoints: false,
    periodCount: 0, periodDurationMins: 0, overtimeDurationMins: 0,
    inningsPerSide: 0, oversPerInnings: 0, powerplayOvers: 0,
    tiebreakerOrder: ['points','netScore','won'],
    rules: 'Enter your custom tournament rules here...',
  },
};

// GET all presets (public)
router.get('/presets', (req, res) => {
  const list = Object.entries(SPORT_PRESETS).map(([key, v]) => ({
    key, label: v.label, icon: v.icon,
  }));
  res.json({ success: true, data: list });
});

// GET a specific preset
router.get('/presets/:sport', (req, res) => {
  const preset = SPORT_PRESETS[req.params.sport];
  if (!preset) return res.status(404).json({ success: false, message: 'Preset not found' });
  res.json({ success: true, data: preset });
});

// GET settings for a tournament (public)
router.get('/:tournamentId', async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.tournamentId).select('name sport settings rules');
    if (!t) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, data: t.settings || {}, tournament: { name: t.name, sport: t.sport } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT save settings for a tournament (admin)
router.put('/:tournamentId', auth, async (req, res) => {
  try {
    const updates = { settings: req.body };
    // Also sync top-level rules field for backward compat
    if (req.body.rules !== undefined) updates.rules = req.body.rules;
    const t = await Tournament.findByIdAndUpdate(
      req.params.tournamentId,
      { $set: updates },
      { new: true, runValidators: false }
    );
    if (!t) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, data: t.settings, message: 'Settings saved successfully!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT apply a preset to a tournament (admin)
router.put('/:tournamentId/apply-preset/:sport', auth, async (req, res) => {
  try {
    const preset = SPORT_PRESETS[req.params.sport];
    if (!preset) return res.status(404).json({ success: false, message: 'Unknown preset' });

    const { label, icon, ...settingsData } = preset;
    const t = await Tournament.findByIdAndUpdate(
      req.params.tournamentId,
      { $set: { settings: settingsData, sport: label, rules: settingsData.rules } },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, data: t.settings, message: `${label} preset applied!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = { router, SPORT_PRESETS };
