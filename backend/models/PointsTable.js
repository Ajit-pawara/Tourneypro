const mongoose = require('mongoose');

const pointsTableSchema = new mongoose.Schema({
  tournament:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  team:          { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  played:        { type: Number, default: 0 },
  won:           { type: Number, default: 0 },
  lost:          { type: Number, default: 0 },
  drawn:         { type: Number, default: 0 },
  points:        { type: Number, default: 0 },   // tournament points (3/2/1/0)
  setsWon:       { type: Number, default: 0 },   // total sets won
  setsLost:      { type: Number, default: 0 },   // total sets lost
  pointsFor:     { type: Number, default: 0 },   // individual game points scored (volleyball points, goals, etc.)
  pointsAgainst: { type: Number, default: 0 },   // individual game points conceded
  straightWins:  { type: Number, default: 0 },   // 3-0 or 2-0 wins
  closeWins:     { type: Number, default: 0 },   // 3-2 or 2-1 wins
  // Computed
  netSets:       { type: Number, default: 0 },
  netPoints:     { type: Number, default: 0 },
  winPct:        { type: Number, default: 0 },
  // Manual override flag
  manualEdit:    { type: Boolean, default: false },
}, { timestamps: true });

pointsTableSchema.pre('save', function (next) {
  this.netSets   = this.setsWon   - this.setsLost;
  this.netPoints = this.pointsFor - this.pointsAgainst;
  this.winPct    = this.played > 0 ? Math.round((this.won / this.played) * 100) : 0;
  next();
});

module.exports = mongoose.model('PointsTable', pointsTableSchema);
