const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  role:     { type: String, default: 'Player' },
  jerseyNo: { type: Number },
});

const teamSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  shortName:   { type: String, trim: true, maxlength: 5 },
  color:       { type: String, default: '#6366f1' },
  logo:        { type: String, default: '' },
  captain:     { type: String, default: '' },
  players:     [playerSchema],
  tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' }],
  city:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
