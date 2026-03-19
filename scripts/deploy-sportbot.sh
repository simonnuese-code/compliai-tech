#!/bin/bash
# =============================================
# CompliAI Sport-Bot — Hetzner Deployment
# =============================================
# Usage: ./scripts/deploy-sportbot.sh
# 
# This script deploys everything to the Hetzner server:
# 1. Worker service (polls football API, sends WhatsApp)
# 2. WhatsApp bridge (whatsapp-web.js based)
# 3. Systemd services for both
#
# Prerequisites:
# - SSH key at ~/.ssh/hetzner_sport_bot
# - Server at 167.235.59.89
# =============================================

set -e

SERVER="root@167.235.59.89"
SSH_KEY="$HOME/.ssh/hetzner_sport_bot"
SSH_OPTS="-i $SSH_KEY -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no"
REMOTE_DIR="/opt/sportbot"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Check SSH connection first
echo "🔌 Testing SSH connection..."
if ! ssh $SSH_OPTS $SERVER "echo 'OK'" 2>/dev/null; then
  fail "Cannot connect to server. Check if server is running."
fi
log "SSH connection OK"

# Step 1: Clean up and prepare
echo ""
echo "📁 Step 1: Preparing server..."
ssh $SSH_OPTS $SERVER "
  systemctl stop sportbot 2>/dev/null || true
  systemctl stop whatsapp-bridge 2>/dev/null || true
  mkdir -p $REMOTE_DIR/prisma
"
log "Server prepared"

# Step 2: Upload files
echo ""
echo "📦 Step 2: Uploading files..."
scp $SSH_OPTS scripts/sportbot-worker.js $SERVER:$REMOTE_DIR/worker.js
scp $SSH_OPTS scripts/whatsapp-bridge.js $SERVER:$REMOTE_DIR/whatsapp-bridge.js
scp $SSH_OPTS prisma/schema.prisma $SERVER:$REMOTE_DIR/prisma/schema.prisma
log "Files uploaded"

# Step 3: Install dependencies
echo ""
echo "📥 Step 3: Installing dependencies..."
ssh $SSH_OPTS $SERVER "
  cd $REMOTE_DIR

  cat > package.json << 'PKGJSON'
{
  \"name\": \"sportbot-worker\",
  \"version\": \"1.0.0\",
  \"private\": true,
  \"dependencies\": {
    \"@prisma/client\": \"^6.0.0\",
    \"prisma\": \"^6.0.0\",
    \"whatsapp-web.js\": \"^1.26.1-alpha.3\",
    \"qrcode-terminal\": \"^0.12.0\"
  }
}
PKGJSON

  npm install --production 2>&1 | tail -5
  npx prisma generate 2>&1 | tail -3
"
log "Dependencies installed"

# Step 4: Install Chromium (needed for WhatsApp)
echo ""
echo "🌐 Step 4: Installing Chromium..."
ssh $SSH_OPTS $SERVER "
  which chromium-browser >/dev/null 2>&1 || apt-get update -qq && apt-get install -y -qq chromium-browser
"
log "Chromium ready"

# Step 5: Create .env file
echo ""
echo "🔐 Step 5: Setting up environment..."

# Read API key from local .env.local if available
LOCAL_FOOTBALL_KEY=$(grep FOOTBALL_DATA_API_KEY .env.local 2>/dev/null | cut -d'"' -f2 || echo "")
LOCAL_ODDS_KEY=$(grep ODDS_API_KEY .env.local 2>/dev/null | cut -d'"' -f2 || echo "")
LOCAL_DB_URL=$(grep DATABASE_URL .env.local 2>/dev/null | cut -d'"' -f2 || grep DATABASE_URL .env 2>/dev/null | cut -d'"' -f2 || echo "")

if [ -z "$LOCAL_DB_URL" ]; then
  fail "No DATABASE_URL found in .env or .env.local"
fi

ssh $SSH_OPTS $SERVER "
  cat > $REMOTE_DIR/.env << 'ENVFILE'
DATABASE_URL=\"$LOCAL_DB_URL\"
FOOTBALL_DATA_API_KEY=\"$LOCAL_FOOTBALL_KEY\"
ODDS_API_KEY=\"$LOCAL_ODDS_KEY\"
WAHA_URL=\"http://localhost:3001\"
WAHA_API_KEY=\"\"
ENVFILE
"
log "Environment configured"

# Step 6: Create systemd services
echo ""
echo "⚙️  Step 6: Creating services..."
ssh $SSH_OPTS $SERVER "
  # WhatsApp Bridge service
  cat > /etc/systemd/system/whatsapp-bridge.service << 'SVC1'
[Unit]
Description=CompliAI WhatsApp Bridge
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sportbot
Environment=PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ExecStart=/usr/bin/node /opt/sportbot/whatsapp-bridge.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVC1

  # Sport-Bot Worker service
  cat > /etc/systemd/system/sportbot.service << 'SVC2'
[Unit]
Description=CompliAI Sport-Bot Worker
After=network.target whatsapp-bridge.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sportbot
EnvironmentFile=/opt/sportbot/.env
ExecStart=/usr/bin/node /opt/sportbot/worker.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVC2

  systemctl daemon-reload
  systemctl enable whatsapp-bridge sportbot
"
log "Services created"

# Step 7: Start everything
echo ""
echo "🚀 Step 7: Starting services..."
ssh $SSH_OPTS $SERVER "
  systemctl start whatsapp-bridge
  sleep 3
  systemctl start sportbot
  sleep 2
  echo '--- WhatsApp Bridge ---'
  systemctl is-active whatsapp-bridge
  echo '--- Sport-Bot Worker ---'
  systemctl is-active sportbot
"
log "Services started!"

echo ""
echo "========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "========================================="
echo ""
echo "  Sport-Bot Worker:  systemctl status sportbot"
echo "  WhatsApp Bridge:   systemctl status whatsapp-bridge"
echo "  Worker Logs:       journalctl -u sportbot -f"
echo "  WhatsApp Logs:     journalctl -u whatsapp-bridge -f"
echo ""
echo "  WhatsApp API:      http://167.235.59.89:3001/health"
echo ""
warn "Don't forget to add FOOTBALL_DATA_API_KEY to /opt/sportbot/.env"
echo ""
