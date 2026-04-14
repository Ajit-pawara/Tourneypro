require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/teams',       require('./routes/teams'));
app.use('/api/matches',     require('./routes/matches'));
app.use('/api/points',      require('./routes/points'));
app.use('/api/dashboard',   require('./routes/dashboard'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// Frontend routes
app.get('/admin',  (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/player', (req, res) => res.sendFile(path.join(__dirname, '../frontend/player.html')));
app.get('*',       (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tournament_db')
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Admin  → http://localhost:${PORT}/admin`);
      console.log(`🎮 Player → http://localhost:${PORT}/player`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
