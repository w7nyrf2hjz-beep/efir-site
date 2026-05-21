#!/bin/bash
clear
cd "$(cd "$(dirname "$0")" && pwd)"
if ! command -v node &>/dev/null; then
    echo "Node.js not found. Install from https://nodejs.org"
    open "https://nodejs.org/en/download" 2>/dev/null
    exit 1
fi
echo "Node.js $(node --version) found"
if [ ! -d node_modules/next ]; then
    echo "Installing components... wait 5-10 min"
    npm install || exit 1
fi
if [ ! -f data/efir.db ]; then
    echo "Creating database..."
    node scripts/seed.mjs || exit 1
fi
echo ""
echo "Site:  http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo "Phone: +77001234567 (code appears here)"
echo "Do NOT close this window!"
echo ""
(sleep 7 && open http://localhost:3000 2>/dev/null) &
npx next dev --port 3000
