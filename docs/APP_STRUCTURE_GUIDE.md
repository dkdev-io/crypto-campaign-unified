# App Structure & Deployment Guide

## CRITICAL: PROJECT LAYOUT

**Current Working Directory Issues:**
- Agents often start in: `/Users/Danallovertheplace/crypto-campaign-unified/crypto-campaign-unified` ❌
- Actual project root: `/Users/Danallovertheplace/crypto-campaign-unified` ✅

**MANDATORY: Always run `cd /Users/Danallovertheplace/crypto-campaign-unified` first**

## MONOREPO STRUCTURE

```
crypto-campaign-unified/
├── frontend/           # React + Vite app
│   ├── package.json   # @crypto-campaign/frontend
│   ├── src/           # React components
│   └── vite.config.js # Vite config (default port 5173)
├── backend/            # Express API server  
│   ├── package.json   # @crypto-campaign/backend
│   ├── src/index.js   # Main server (nodemon)
│   └── .env           # Backend environment
├── contracts/          # Ethereum contracts
│   ├── package.json   # Hardhat project
│   └── contracts/     # Solidity files
└── package.json       # Root workspace manager
```

## DEVELOPMENT COMMANDS

**Start Everything:**
```bash
npm run dev                    # Frontend + Backend + Deploy watcher
```

**Individual Services:**
```bash
npm run dev:frontend          # Vite dev server (port 5173)
npm run dev:backend           # Express server (port 3000)
```

**Build & Deploy:**
```bash
npm run build                 # Build all workspaces
npm run deploy               # Deploy to GitHub Pages
```

## DEPLOYMENT STATUS

**Live Site:** https://dkdev-io.github.io/crypto-campaign-setup/
- Static build deployed to Netlify
- Connected to Supabase backend
- Web3 wallet integration enabled

**Local Development:**
- Frontend: http://localhost:5173 (when running)
- Backend: http://localhost:3000 (when running)
- Contracts: Local Hardhat network on port 8545

## CURRENT RUNNING SERVICES

*This section should be auto-updated by agents*

Last Updated: Never
Frontend Status: Unknown
Backend Status: Unknown
Database: Supabase (configured)

## FOR AGENTS: MANDATORY CHECKLIST

Before working on this project:

1. [ ] `cd /Users/Danallovertheplace/crypto-campaign-unified`
2. [ ] Check running services: `lsof -i :3000,5173,8545`
3. [ ] Verify monorepo structure: `ls -la frontend backend contracts`
4. [ ] Check deployment status: Read this file's "CURRENT RUNNING SERVICES" section
5. [ ] Update this file with current status before ending session

## COMMON AGENT FAILURES TO AVOID

❌ **Don't create new React apps** - Use existing `frontend/` workspace
❌ **Don't assume ports** - Check what's actually running
❌ **Don't ignore monorepo** - Use workspace commands
❌ **Don't work in wrong directory** - Always confirm you're in project root