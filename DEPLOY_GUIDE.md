# 🚀 TourneyPro — Free Global Hosting Guide
## Zorin OS Complete Step-by-Step (No Credit Card Needed)

**Services Used:**
- 🍃 MongoDB Atlas — Free cloud database
- 🚂 Render.com — Free cloud hosting
- 🐙 GitHub — Free code storage

**Total Cost: ₹0 / $0 — 100% Free Forever**

---

## ✅ WHAT YOU NEED BEFORE STARTING
- Your tournament-app project folder
- Internet connection
- Email address
- About 30-45 minutes

---

## STEP 1 — Install Git on Zorin OS

Open Terminal (Ctrl+Alt+T) and run these one by one:

```bash
sudo apt update
sudo apt install git -y
git --version
```

You should see something like: `git version 2.x.x`

Then set your identity (use any name/email):
```bash
git config --global user.name "Your Name"
git config --global user.email "youremail@gmail.com"
```

---

## STEP 2 — Install Node.js 20 on Zorin OS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

You should see: `v20.x.x` and `10.x.x`

---

## STEP 3 — Prepare Your Project

Open terminal, go to your project folder:
```bash
cd ~/tournament-app
```

If you downloaded the zip, extract it first:
```bash
cd ~/Downloads
unzip tournament-app-fixed.zip
cd tournament-app
```

---

## STEP 4 — Create GitHub Account + Upload Code

### 4A. Create GitHub Account
1. Go to https://github.com
2. Click "Sign up"
3. Enter email, password, username
4. Verify email

### 4B. Create a New Repository
1. After login, click the "+" icon top right
2. Click "New repository"
3. Name it: `tournament-app`
4. Set to **Public**
5. DO NOT check "Add README"
6. Click "Create repository"
7. **COPY the URL shown** — looks like:
   `https://github.com/YOURNAME/tournament-app.git`

### 4C. Upload Your Code via Terminal

```bash
# Go into your project folder
cd ~/tournament-app

# Check all files are there
ls

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "TourneyPro initial upload"

# Connect to GitHub (paste YOUR URL)
git remote add origin https://github.com/YOURNAME/tournament-app.git

# Upload (you'll be asked for GitHub username + password)
# NOTE: Use a Personal Access Token as password (see 4D below)
git push -u origin main
```

### 4D. GitHub Personal Access Token (needed for push)
GitHub no longer accepts passwords. Do this:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it "tournament-deploy"
4. Check: `repo` checkbox
5. Scroll down → "Generate token"
6. **COPY the token immediately** (you see it only once!)
7. When terminal asks for "Password:" — paste this token

---

## STEP 5 — Free MongoDB Atlas Database

### 5A. Create Account
1. Go to https://mongodb.com/atlas/database
2. Click "Try Free"
3. Sign up with Google or email
4. Choose "Free" plan (M0 — always free)

### 5B. Create a Cluster
1. Click "Build a Database"
2. Choose **FREE — M0**
3. Provider: AWS
4. Region: Choose closest to India (Mumbai ap-south-1)
5. Cluster Name: `tournament-cluster`
6. Click "Create"

### 5C. Create Database User
1. In left menu → "Database Access"
2. Click "Add New Database User"
3. Username: `tourneyuser`
4. Password: Click "Autogenerate Secure Password" → COPY IT
5. Role: "Atlas admin"
6. Click "Add User"

### 5D. Allow All IP Access
1. In left menu → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access From Anywhere"  ← Important!
4. Click "Confirm"

### 5E. Get Your Connection String
1. In left menu → "Database"
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Driver: Node.js, Version: 5.5+
5. COPY the connection string. Looks like:
   `mongodb+srv://tourneyuser:<password>@tournament-cluster.abc123.mongodb.net/`
6. Replace `<password>` with your actual password
7. Add database name at end:
   `mongodb+srv://tourneyuser:YOURPASSWORD@tournament-cluster.abc123.mongodb.net/tournament_db`
8. **SAVE THIS STRING — you need it in Step 6**

---

## STEP 6 — Host on Render.com (Free)

### 6A. Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest!)
4. Authorize Render to access GitHub

### 6B. Create Web Service
1. Dashboard → "New +" → "Web Service"
2. Click "Connect" next to your `tournament-app` repo
3. Fill in these settings:

```
Name:             tournament-app
Region:           Singapore (closest to India)
Branch:           main
Root Directory:   backend
Runtime:          Node
Build Command:    npm install
Start Command:    npm start
Instance Type:    Free
```

4. Scroll down to "Environment Variables"
5. Click "Add Environment Variable" for EACH of these:

```
Key: MONGODB_URI
Value: mongodb+srv://tourneyuser:YOURPASSWORD@tournament-cluster.abc123.mongodb.net/tournament_db

Key: JWT_SECRET
Value: TourneyPro2024SecretKey@SuperSecure#xyz789!

Key: NODE_ENV
Value: production

Key: PORT
Value: 10000
```

6. Click "Create Web Service"

### 6C. Wait for Deployment
- Render will build your app (takes 3-5 minutes)
- You'll see logs at the bottom
- Wait for green "Live" status
- Your URL will be: `https://tournament-app-xxxx.onrender.com`

### 6D. Create Admin User
Once deployed, open the Render dashboard:
1. Go to your service
2. Click "Shell" tab at top
3. Type in the shell:
```bash
node seed.js
```
4. You'll see: `Admin user created → username: admin | password: admin123`

---

## STEP 7 — Access Your Live App

Your app is now live globally! Share these links:

```
🌐 Main Login:   https://tournament-app-xxxx.onrender.com
📊 Admin Panel:  https://tournament-app-xxxx.onrender.com/admin
🎮 Player View:  https://tournament-app-xxxx.onrender.com/player
```

Admin Login:
- Username: admin
- Password: admin123

---

## STEP 8 — Add Custom Domain (Optional, Free)

If you have a domain (from Freenom.com — free domains):

1. In Render → your service → "Settings"
2. Scroll to "Custom Domains"
3. Add your domain
4. Copy the CNAME record shown
5. In your domain provider → DNS settings
6. Add CNAME record pointing to Render

---

## 🔄 How to Update Your App Later

Whenever you make changes locally:
```bash
cd ~/tournament-app
git add .
git commit -m "Update: describe what you changed"
git push origin main
```

Render automatically detects the push and redeploys! ✅

---

## 🐛 COMMON PROBLEMS & FIXES

### Problem: "git push" asks for password every time
Fix:
```bash
git config --global credential.helper store
```
Then push once with your token — it saves automatically.

### Problem: Render build fails
Fix: Check Root Directory is set to `backend` not the main folder.

### Problem: App loads but can't login
Fix: Check MONGODB_URI is correct in Render environment variables.
Make sure you ran `node seed.js` in Render shell.

### Problem: App sleeps after 15 minutes (free tier)
Fix: Use https://cron-job.org (free) to ping your URL every 14 minutes.
Add a cron job that calls: `GET https://your-app.onrender.com/api/dashboard/stats`

### Problem: MongoDB connection refused
Fix: Make sure you added "Allow Access From Anywhere" in MongoDB Atlas Network Access.

---

## 📱 SHARE WITH PLAYERS

Send this message to your players:

```
🏆 TourneyPro — Tournament App is LIVE!

👤 Player Access (No password needed!):
🔗 https://YOUR-APP.onrender.com

Just enter your name and browse:
✅ Live scores
✅ Match schedule  
✅ Points table
✅ Team standings

Admin contact: [your name]
```

---

## 💡 FREE TIER LIMITS (Render.com)

| Feature | Free Limit |
|---------|-----------|
| Web Service | 1 free service |
| RAM | 512 MB |
| CPU | Shared |
| Sleep | After 15 min inactivity |
| Monthly Hours | 750 hrs (enough for 24/7) |
| MongoDB Atlas | 512 MB storage |
| Bandwidth | 100 GB/month |

**This is more than enough for a college/local tournament!**

---

*Guide created for Zorin OS — works on Ubuntu/Debian too*
*TourneyPro Tournament Management System*
