#!/bin/bash
# ============================================================
# TourneyPro - Zorin OS Setup Script
# Run this once: bash setup-zorin.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║     TourneyPro - Zorin OS Setup          ║"
echo "║     Free Global Hosting Setup            ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# --- Check for internet ---
echo -e "${YELLOW}Checking internet connection...${NC}"
if ! ping -c 1 google.com &>/dev/null; then
  echo -e "${RED}No internet! Connect first.${NC}"; exit 1
fi
echo -e "${GREEN}Internet OK${NC}"

# --- Install Git if missing ---
if ! command -v git &>/dev/null; then
  echo -e "${YELLOW}Installing Git...${NC}"
  sudo apt update && sudo apt install -y git
fi
echo -e "${GREEN}Git: $(git --version)${NC}"

# --- Install Node.js if missing ---
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}Installing Node.js 20...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo -e "${GREEN}Node: $(node --version) | npm: $(npm --version)${NC}"

# --- Install dependencies ---
echo -e "${YELLOW}Installing backend packages...${NC}"
cd backend && npm install
echo -e "${GREEN}Packages installed!${NC}"

# --- Collect user info ---
echo ""
echo -e "${CYAN}══ Setup Configuration ══${NC}"

read -p "Enter your MongoDB Atlas URI: " MONGO_URI
if [ -z "$MONGO_URI" ]; then
  MONGO_URI="mongodb://localhost:27017/tournament_db"
  echo -e "${YELLOW}Using local MongoDB${NC}"
fi

read -p "Enter a secret key (press Enter for auto-generate): " JWT_SEC
if [ -z "$JWT_SEC" ]; then
  JWT_SEC="TourneyPro_$(openssl rand -hex 16 2>/dev/null || echo 'SecretKey2024xK9mP2qL8n')"
fi

# --- Write .env file ---
cat > .env << ENVEOF
PORT=5000
MONGODB_URI=${MONGO_URI}
JWT_SECRET=${JWT_SEC}
NODE_ENV=production
ENVEOF
echo -e "${GREEN}.env file created!${NC}"

# --- Run seed ---
echo -e "${YELLOW}Creating admin user...${NC}"
node seed.js
echo ""

# --- Git setup ---
cd ..
echo -e "${CYAN}══ Git & GitHub Setup ══${NC}"
read -p "Your GitHub username: " GH_USER
read -p "Your name for Git: " GH_NAME
read -p "Your email for Git: " GH_EMAIL

git config --global user.name "$GH_NAME"
git config --global user.email "$GH_EMAIL"

if [ ! -d ".git" ]; then
  git init
fi

git add .
git commit -m "TourneyPro initial deployment" 2>/dev/null || git commit --allow-empty -m "TourneyPro deployment"

echo ""
echo -e "${CYAN}══ Ready to Push to GitHub ══${NC}"
echo ""
echo -e "${YELLOW}1. Go to github.com → Create new repository named: tournament-app${NC}"
echo -e "${YELLOW}2. Make it PUBLIC, don't add README${NC}"
echo -e "${YELLOW}3. Copy the repository URL${NC}"
echo ""
read -p "Paste your GitHub repository URL (https://github.com/...): " REPO_URL

if [ ! -z "$REPO_URL" ]; then
  git remote remove origin 2>/dev/null
  git remote add origin "$REPO_URL"
  git branch -M main
  echo ""
  echo -e "${YELLOW}Pushing to GitHub (enter your Personal Access Token as password)...${NC}"
  echo -e "${YELLOW}Get token: GitHub → Settings → Developer Settings → Personal Access Tokens${NC}"
  echo ""
  git push -u origin main
  echo -e "${GREEN}Code pushed to GitHub!${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           NEXT: Deploy on Render.com                 ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  1. Go to: https://dashboard.render.com              ║${NC}"
echo -e "${CYAN}║  2. Sign in with GitHub                              ║${NC}"
echo -e "${CYAN}║  3. New+ → Web Service → tournament-app repo         ║${NC}"
echo -e "${CYAN}║  4. Root Directory: backend                          ║${NC}"
echo -e "${CYAN}║  5. Build: npm install  |  Start: npm start          ║${NC}"
echo -e "${CYAN}║  6. Add env vars:                                    ║${NC}"
echo -e "${GREEN}║     MONGODB_URI = ${MONGO_URI:0:40}...                 ║${NC}"
echo -e "${GREEN}║     JWT_SECRET  = ${JWT_SEC:0:30}...                   ║${NC}"
echo -e "${GREEN}║     NODE_ENV    = production                         ║${NC}"
echo -e "${GREEN}║     PORT        = 5000                               ║${NC}"
echo -e "${CYAN}║  7. Click 'Create Web Service'                       ║${NC}"
echo -e "${CYAN}║  8. Wait 3-5 mins → Your app is LIVE! 🎉             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Admin login: admin / admin123${NC}"
echo ""
