# Interview Panel App

This repository contains a Gemini-based Interview Panel simulator.

Quick start (local):

1. Copy `.env.example` to `.env` and set GEMINI_API_KEY
2. npm install
3. npm run dev
4. Open http://localhost:3000 and upload files via the web UI

Notes:
- The app runs on the current branch `lakshay-rana1111-interview-panel-simulator`.
- The backend calls Gemini — costs and rate limits apply to your API key.

## Secrets & Gemini API Key

Do NOT commit your API keys. Locally, create a `.env` file at the repo root with:

GEMINI_API_KEY=your_key_here

This repository already includes `.env` in `.gitignore` so it won't be committed.

For deployments, add the GEMINI_API_KEY to your host's secret settings (e.g., Vercel/Render/GitHub Actions secrets) instead of embedding it in code.

If a secret is ever accidentally committed, rotate it immediately and remove it from Git history.
