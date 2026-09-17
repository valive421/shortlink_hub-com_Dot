#!/usr/bin/env bash
set -euo pipefail

npm install
npm run install:all

if [ ! -f server/.env ]; then
  cp .env.example server/.env
  echo "Created server/.env from .env.example. Update MONGODB_URI and JWT secrets before starting."
fi

if [ ! -f client/.env ]; then
  cat > client/.env <<'ENV'
VITE_API_URL=http://localhost:5000/api
VITE_PUBLIC_BASE_URL=http://localhost:5000
ENV
fi

echo "Installing Coss UI primitives..."
cd client
npx shadcn@latest init @coss/style
npx shadcn@latest add @coss/ui
cd ..

echo "Setup complete. This project uses MongoDB Atlas M0 (Free 512 MB); no local MongoDB or Docker is required."
echo "1. Edit server/.env and set MONGODB_URI."
echo "2. Run: npm run dev"
