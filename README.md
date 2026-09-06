# 🏆 TourneyPro — Tournament Management System

A professional, full-stack Tournament Management System built with Node.js, Express, MongoDB, and a dark-themed modern UI.
Live:-https://volley-scorer.preview.emergentagent.com/

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+ installed
- MongoDB running locally (via MongoDB Compass or `mongod`)
- MongoDB Compass: connect to `mongodb://localhost:27017`

### 2. Install Dependencies
```bash
cd backend
npm install
```




### 3. Seed the Admin User
```bash
npm run seed
```
This creates: **username: `admin`** | **password: `admin123`**

### 4. Start the Server
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

### 5. Open in Browser
| Page | URL |
|------|-----|
| Login | http://localhost:5000 |
| Admin Panel | http://localhost:5000/admin |
| Player View | http://localhost:5000/player |

---

## 📁 Project Structure

```
tournament-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # Admin user schema
│   │   ├── Tournament.js    # Tournament schema
│   │   ├── Team.js          # Team + player schema
│   │   ├── Match.js         # Match schema
│   │   └── PointsTable.js   # Points/standings schema
│   ├── routes/
│   │   ├── auth.js          # Login endpoints
│   │   ├── tournaments.js   # Tournament CRUD + fixtures
│   │   ├── teams.js         # Team CRUD
│   │   ├── matches.js       # Match CRUD + result updates
│   │   ├── points.js        # Points table
│   │   └── dashboard.js     # Analytics stats
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── server.js            # Express app entry point
│   ├── seed.js              # Admin user seeder
│   ├── .env                 # Environment variables
│   └── package.json
└── frontend/
    ├── login.html           # Login page (Admin + Player)
    ├── admin.html           # Full admin dashboard SPA
    └── player.html          # Read-only player view
```

---

## 🔐 Authentication

| Role | Login Method | Access |
|------|-------------|--------|
| Admin | Username + Password | Full CRUD on all data |
| Player | Name only (no password) | Read-only view |

---

## 📊 Points System (League Format)

| Result | Points |
|--------|--------|
| Win | **+2** |
| Draw | **+1** |
| Loss | **0** |

**Tiebreaker order:** Points → Net Score (GF−GA) → Wins

Points are **automatically recalculated** when match results are updated or corrected.

---

## 🎮 Admin Features

1. **Dashboard** — Live stats, recent results, upcoming matches, top teams leaderboard
2. **Tournaments** — Create/Edit/Delete, set entry fee, prize pool, rules, format (League/Knockout)
3. **Teams** — Create teams with color, short name, captain, city. Enroll them in tournaments.
4. **Matches** — Schedule matches, mark as Live/Completed, enter scores + score text (e.g. "185/4 (20)")
5. **Points Table** — Auto-updated live standings with progress bars, rank medals, net score
6. **Fixture Generation** — One click auto-generates all fixtures (round-robin for League, elimination draw for Knockout)

---

## 🌐 REST API Endpoints

### Auth
- `POST /api/auth/admin-login` — Admin login
- `POST /api/auth/player-login` — Player login (no password)
- `GET  /api/auth/me` — Verify token

### Tournaments
- `GET    /api/tournaments` — List all
- `GET    /api/tournaments/:id` — Single tournament
- `POST   /api/tournaments` — Create (admin)
- `PUT    /api/tournaments/:id` — Update (admin)
- `DELETE /api/tournaments/:id` — Delete (admin)
- `POST   /api/tournaments/:id/teams` — Add team (admin)
- `DELETE /api/tournaments/:id/teams/:teamId` — Remove team (admin)
- `POST   /api/tournaments/:id/generate-fixtures` — Auto-generate (admin)

### Teams
- `GET    /api/teams` — List all (filter by `?tournament=id`)
- `POST   /api/teams` — Create (admin)
- `PUT    /api/teams/:id` — Update (admin)
- `DELETE /api/teams/:id` — Delete (admin)
- `POST   /api/teams/:id/players` — Add player (admin)
- `DELETE /api/teams/:id/players/:playerId` — Remove player (admin)

### Matches
- `GET    /api/matches` — List (filter `?tournament=&status=&team=`)
- `POST   /api/matches` — Create (admin)
- `PUT    /api/matches/:id` — Update details (admin)
- `PUT    /api/matches/:id/result` — Update score → auto points (admin)
- `PUT    /api/matches/:id/status` — Change status (admin)
- `DELETE /api/matches/:id` — Delete + reverse points (admin)

### Points
- `GET    /api/points/:tournamentId` — Standings (sorted)
- `DELETE /api/points/:tournamentId` — Reset table (admin)

### Dashboard
- `GET    /api/dashboard/stats` — All analytics in one call

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tournament_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production_2024
NODE_ENV=development
```

---

## 🗄 MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | Admin accounts with hashed passwords |
| `tournaments` | Tournament definitions |
| `teams` | Teams with embedded player roster |
| `matches` | All scheduled/completed matches |
| `pointstables` | Live standings per tournament |

---

## 🎨 UI Features

- ⚫ Full dark theme (Notion/Linear inspired)
- 📱 Fully responsive (mobile + desktop)
- 🎴 Glassmorphism cards with gradient accents
- ✨ Smooth animations and hover states
- 🔔 Toast notifications for all actions
- ⏳ Loading spinners
- 📊 Progress bars in points table
- 🥇🥈🥉 Medal rankings
- 🔴 Live match indicators with pulse animation

---

## 🔧 Troubleshooting

**MongoDB not connecting?**
```bash
# Start MongoDB service
sudo systemctl start mongod
# Or start manually
mongod --dbpath /var/lib/mongodb
```

**Port already in use?**
```bash
# Change PORT in .env or kill existing process
lsof -ti:5000 | xargs kill
```

**Forgot admin password?**
```bash
# Drop the user and re-seed
npm run seed
```
