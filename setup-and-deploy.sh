#!/bin/bash
# ============================================================
# TourneyPro — One-Shot Setup & Deploy Script for Zorin OS
# Run: bash setup-and-deploy.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo ""
  echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}${BOLD}║     🏆 TourneyPro — Deploy to Free Cloud     ║${NC}"
  echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
}

step() { echo -e "\n${CYAN}${BOLD}▶ STEP $1: $2${NC}"; }
ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
info() { echo -e "  ${YELLOW}ℹ  $1${NC}"; }
err()  { echo -e "  ${RED}❌ $1${NC}"; }
ask()  { echo -e "\n  ${BOLD}❓ $1${NC}"; }

banner

# ── STEP 1: Install Git ─────────────────────────────────────
step 1 "Installing Git"
if command -v git &>/dev/null; then
  ok "Git already installed: $(git --version)"
else
  sudo apt update -qq && sudo apt install git -y -qq
  ok "Git installed: $(git --version)"
fi

# ── STEP 2: Install Node.js 20 ──────────────────────────────
step 2 "Installing Node.js 20"
if command -v node &>/dev/null && [[ $(node -v) == v2* ]]; then
  ok "Node.js already installed: $(node -v)"
else
  info "Downloading Node.js 20 setup..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
  sudo apt install -y nodejs -qq
  ok "Node.js installed: $(node -v)"
  ok "npm installed: $(npm -v)"
fi

# ── STEP 3: Find project folder ─────────────────────────────
step 3 "Finding Your Project"
ask "Where is your tournament-app folder? (Press Enter for ~/Downloads/tournament-app)"
read -r PROJECT_PATH
PROJECT_PATH="${PROJECT_PATH:-$HOME/Downloads/tournament-app}"

# Handle zip file
if [ -f "${PROJECT_PATH}.zip" ]; then
  info "Found zip file! Extracting..."
  cd "$(dirname "$PROJECT_PATH")"
  unzip -q "${PROJECT_PATH}.zip"
  ok "Extracted to $PROJECT_PATH"
fi

if [ ! -d "$PROJECT_PATH" ]; then
  err "Project folder not found at: $PROJECT_PATH"
  ask "Enter the full path to your tournament-app folder:"
  read -r PROJECT_PATH
fi

if [ ! -d "$PROJECT_PATH/backend" ]; then
  err "backend folder not found inside project. Check the path."
  exit 1
fi

ok "Project found at: $PROJECT_PATH"
cd "$PROJECT_PATH"

# ── STEP 4: Install dependencies ────────────────────────────
step 4 "Installing Backend Dependencies"
cd "$PROJECT_PATH/backend"
npm install --silent
ok "npm packages installed"

# ── STEP 5: GitHub setup ────────────────────────────────────
step 5 "GitHub Repository Setup"
cd "$PROJECT_PATH"

echo ""
echo -e "  ${BOLD}You need a GitHub account. Go to: https://github.com${NC}"
echo -e "  Create a NEW EMPTY repository named: ${YELLOW}tournament-app${NC}"
echo -e "  (DON'T check 'Add README')"
echo ""
ask "Enter your GitHub username:"
read -r GH_USER
ask "Enter your GitHub Personal Access Token"
info "(Get it from: github.com/settings/tokens → Generate new token (classic) → check 'repo')"
read -rs GH_TOKEN
echo ""
ask "Enter your email for git config:"
read -r GH_EMAIL

# Configure git
git config --global user.name "$GH_USER"
git config --global user.email "$GH_EMAIL"
git config --global credential.helper store

# Init and push
if [ -d ".git" ]; then
  info "Git already initialized"
else
  git init
  ok "Git initialized"
fi

git add . > /dev/null 2>&1
git commit -m "TourneyPro initial deployment" > /dev/null 2>&1

REMOTE_URL="https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/tournament-app.git"
git remote remove origin > /dev/null 2>&1
git remote add origin "$REMOTE_URL"

info "Pushing to GitHub..."
if git push -u origin main --force > /dev/null 2>&1; then
  ok "Code pushed to GitHub!"
  echo -e "  ${GREEN}GitHub URL: https://github.com/${GH_USER}/tournament-app${NC}"
else
  # Try master branch
  if git push -u origin master --force > /dev/null 2>&1; then
    ok "Code pushed to GitHub! (branch: master)"
  else
    err "Push failed. Check your token and repo name."
    info "Try creating the repo on GitHub first, then run this script again."
    exit 1
  fi
fi

# ── STEP 6: MongoDB Atlas instructions ──────────────────────
step 6 "MongoDB Atlas — Free Cloud Database"
echo ""
echo -e "  ${BOLD}Do these steps in your browser:${NC}"
echo ""
echo -e "  1. Go to: ${YELLOW}https://mongodb.com/atlas/database${NC}"
echo -e "  2. Sign up FREE (no credit card)"
echo -e "  3. Create cluster: FREE M0 → Region: Mumbai (ap-south-1)"
echo -e "  4. Database Access → Add User:"
echo -e "     Username: ${YELLOW}tourneyuser${NC}"
echo -e "     Password: (auto-generate, COPY IT)"
echo -e "  5. Network Access → Add IP → ${YELLOW}Allow Access From Anywhere${NC}"
echo -e "  6. Database → Connect → Drivers → Node.js"
echo -e "     Copy connection string, replace <password>"
echo ""
ask "Paste your MongoDB connection string here (mongodb+srv://...):"
read -r MONGO_URI

if [[ "$MONGO_URI" != mongodb+srv://* ]]; then
  info "That doesn't look right. Using placeholder — update on Render manually."
  MONGO_URI="mongodb+srv://tourneyuser:YOURPASSWORD@cluster.mongodb.net/tournament_db"
else
  # Add database name if missing
  if [[ "$MONGO_URI" != *"tournament_db"* ]]; then
    MONGO_URI="${MONGO_URI%/}/tournament_db"
  fi
  ok "MongoDB URI saved!"
fi

# ── STEP 7: Render.com instructions ─────────────────────────
step 7 "Render.com — Free Hosting"
echo ""
echo -e "  ${BOLD}Do these steps in your browser:${NC}"
echo ""
echo -e "  1. Go to: ${YELLOW}https://render.com${NC}"
echo -e "  2. Sign up with GitHub"
echo -e "  3. New + → Web Service"
echo -e "  4. Connect: ${YELLOW}${GH_USER}/tournament-app${NC}"
echo -e "  5. Settings:"
echo ""
echo -e "     ${BOLD}Name:            ${YELLOW}tournament-app${NC}"
echo -e "     ${BOLD}Root Directory:  ${YELLOW}backend${NC}"
echo -e "     ${BOLD}Build Command:   ${YELLOW}npm install${NC}"
echo -e "     ${BOLD}Start Command:   ${YELLOW}npm start${NC}"
echo -e "     ${BOLD}Instance Type:   ${YELLOW}Free${NC}"
echo ""
echo -e "  6. Add Environment Variables (copy exactly):"
echo ""
echo -e "     ${BOLD}MONGODB_URI${NC}"
echo -e "     ${YELLOW}${MONGO_URI}${NC}"
echo ""
echo -e "     ${BOLD}JWT_SECRET${NC}"
echo -e "     ${YELLOW}TourneyPro$(date +%s)SecretKey@Secure#2024!${NC}"
echo ""
echo -e "     ${BOLD}NODE_ENV${NC}"
echo -e "     ${YELLOW}production${NC}"
echo ""
echo -e "     ${BOLD}PORT${NC}"
echo -e "     ${YELLOW}10000${NC}"
echo ""
echo -e "  7. Click ${YELLOW}Create Web Service${NC}"
echo -e "  8. Wait 3-5 minutes for build"
echo -e "  9. Once LIVE: Go to Shell tab → type: ${YELLOW}node seed.js${NC}"
echo ""

# ── Save config summary ─────────────────────────────────────
CONFIG_FILE="$HOME/Desktop/TourneyPro-Config.txt"
cat > "$CONFIG_FILE" << CONF
╔══════════════════════════════════════════════╗
║         TourneyPro Deployment Config          ║
╚══════════════════════════════════════════════╝

GitHub Repository:
  https://github.com/${GH_USER}/tournament-app

MongoDB URI:
  ${MONGO_URI}

Render Environment Variables to Add:
  MONGODB_URI = ${MONGO_URI}
  JWT_SECRET  = TourneyPro$(date +%s)SecretKey@Secure
  NODE_ENV    = production
  PORT        = 10000

Admin Login (after running node seed.js):
  Username: admin
  Password: admin123

Render Settings:
  Root Directory: backend
  Build Command:  npm install
  Start Command:  npm start

Your Live URLs (replace xxxx with your Render URL):
  Main:   https://tournament-app-xxxx.onrender.com
  Admin:  https://tournament-app-xxxx.onrender.com/admin
  Player: https://tournament-app-xxxx.onrender.com/player

To update after changes:
  cd $PROJECT_PATH
  git add .
  git commit -m "Update"
  git push origin main
CONF

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅ SETUP COMPLETE! NEXT STEPS BELOW:   ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
ok "Code pushed to GitHub"
ok "Config saved to Desktop: TourneyPro-Config.txt"
echo ""
echo -e "  ${BOLD}Now do Steps 6 & 7 above in your browser.${NC}"
echo -e "  Your config details are saved on your Desktop!"
echo ""
info "Once Render is live, your app is accessible from ANYWHERE in the world!"
echo ""
