<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Election (Vercel-ready)

This project is configured for Vercel deployment with:
- Vite frontend
- Vercel Serverless API routes under `api/`

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and adjust variables if needed
3. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Import this repository into Vercel
2. Framework preset: `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables:
   - `VITE_API_BASE_URL` (keep empty when frontend and API are in the same Vercel project)
   - `CORS_ORIGIN` (optional, comma-separated allowlist)

## Data persistence note

Current API storage is in-memory per serverless instance. Data can reset after cold starts/redeploys.  
For persistent production data, migrate users/crises/state data to an external database.
