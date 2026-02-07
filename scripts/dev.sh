#!/usr/bin/env bash
set -euo pipefail
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
