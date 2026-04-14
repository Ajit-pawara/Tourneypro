const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  setNo: Number, score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 }, winner: { type: Number, default: 0 },
}, { _id: false });

const periodSchema = new mongoose.Schema({
  periodNo: Number, score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 }, label: { type: String, default: '' },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  tournament:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  team1:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  team2:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  score1:          { type: Number, default: null },
  score2:          { type: Number, default: null },
  scoreText1:      { type: String, default: '' },
  scoreText2:      { type: String, default: '' },
  sets:            { type: [setSchema], default: [] },
  setsWon1:        { type: Number, default: 0 },
  setsWon2:        { type: Number, default: 0 },
  indivPtsFor1:    { type: Number, default: 0 }, // sum of individual points/goals scored by team1
  indivPtsFor2:    { type: Number, default: 0 },
  periods:         { type: [periodSchema], default: [] },
  winner:          { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  isDraw:          { type: Boolean, default: false },
  isStraightWin:   { type: Boolean, default: false },
  isCloseWin:      { type: Boolean, default: false },
  pointsAwarded1:  { type: Number, default: 0 },
  pointsAwarded2:  { type: Number, default: 0 },
  status:          { type: String, enum: ['scheduled','live','completed','cancelled'], default: 'scheduled' },
  matchDate:       { type: Date, required: true },
  venue:           { type: String, default: '' },
  round:           { type: String, default: 'Group Stage' },
  roundNo:         { type: Number, default: 1 },
  notes:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
