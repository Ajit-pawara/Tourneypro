require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tournament_db');
  console.log('✅  Connected to MongoDB');

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('ℹ️   Admin user already exists. Skipping.');
  } else {
    await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
    console.log('🎉  Admin user created → username: admin | password: admin123');
  }

  await mongoose.disconnect();
  console.log('✅  Done. Run: npm start');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
